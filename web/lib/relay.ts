import { ethers } from "ethers";
import type { Engine } from "./types";
import { ANCHOR_ABI } from "./chainEngine";
import { handleFor } from "./hash";
import { RPC } from "./constants";
import deployed from "./deployed.sepolia.json";

// ---------------------------------------------------------------------------
// Relay path: the hosted site anchors REAL Arbitrum Sepolia txs through a
// server-held key (app/api/relay-anchor). The browser never sees a key; only
// anchor(bytes32) is reachable; the server validates + rate-limits.
// ---------------------------------------------------------------------------

const ROOT_RE = /^0x[0-9a-fA-F]{64}$/;

/** Strict 32-byte hex check — the ONLY input shape the relay accepts. */
export function isValidRoot(s: unknown): s is string {
  return typeof s === "string" && ROOT_RE.test(s);
}

/** Minimal token bucket. capacity = burst, refillPerSec = sustained rate. */
export class TokenBucket {
  private tokens: number;
  private last: number;
  constructor(
    private capacity: number,
    private refillPerSec: number,
  ) {
    this.tokens = capacity;
    this.last = Date.now();
  }
  take(): boolean {
    const now = Date.now();
    this.tokens = Math.min(this.capacity, this.tokens + ((now - this.last) / 1000) * this.refillPerSec);
    this.last = now;
    if (this.tokens < 1) return false;
    this.tokens -= 1;
    return true;
  }
}

/**
 * Per-IP token buckets so one hostile client can't starve everyone else
 * (the stage demo included). Oldest entries are evicted at maxIps — a
 * bounded map, so a scanner rotating IPs can't grow memory either.
 */
export class IpBuckets {
  private buckets = new Map<string, TokenBucket>();
  constructor(
    private capacity: number,
    private refillPerSec: number,
    private maxIps = 500,
  ) {}
  get size(): number {
    return this.buckets.size;
  }
  take(ip: string): boolean {
    let b = this.buckets.get(ip);
    if (!b) {
      if (this.buckets.size >= this.maxIps) {
        const oldest = this.buckets.keys().next().value;
        if (oldest !== undefined) this.buckets.delete(oldest);
      }
      b = new TokenBucket(this.capacity, this.refillPerSec);
      this.buckets.set(ip, b);
    }
    return b.take();
  }
}

/** GET the relay route; true iff a funded server-side key is configured. */
export async function probeRelay(): Promise<boolean> {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 2500);
    const res = await fetch("/api/relay-anchor", { signal: ctl.signal });
    clearTimeout(t);
    if (!res.ok) return false;
    const j = (await res.json()) as { live?: boolean };
    return j.live === true;
  } catch {
    return false;
  }
}

const errMsg = (e: unknown) => {
  if (e && typeof e === "object") {
    const o = e as { message?: string };
    return o.message || String(e);
  }
  return String(e);
};

/**
 * Anchor-via-relay engine: real anchor txs through /api/relay-anchor, with the
 * within/over budget check in a local closure — the same honesty contract as
 * chainEngine (the fleet's confidential check is a stand-in, and labeled so).
 */
export function createRelayEngine(opts: { endpoint?: string; log: (m: string, c?: string) => void }): Engine {
  const { endpoint = "/api/relay-anchor", log } = opts;
  let remaining: number | null = null;
  let granted = false;
  let revoked = false;
  let count = 0;

  return {
    async grant(_id, limit) {
      remaining = limit;
      granted = true;
      revoked = false;
      count = 0;
      return { ok: true, handle: handleFor("rem", 0) };
    },

    async act(_id, amount, root) {
      const within = granted && !revoked && remaining !== null && amount <= remaining;
      const sequence = count;
      // only draw down the budget once we KNOW the proof anchored
      const commit = () => {
        if (within && remaining !== null) remaining -= amount;
        count++;
      };
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ root }),
        });
        const j = (await res.json().catch(() => ({}))) as { ok?: boolean; tx?: string; error?: string };
        if (!res.ok || !j.ok) {
          log(`relay anchor failed: ${j.error || res.status}`, "err");
          return { within, root, sequence, anchored: false, tx: "" };
        }
        commit();
        return { within, root, sequence, anchored: true, tx: j.tx || "" };
      } catch (e) {
        log(`relay unreachable: ${errMsg(e)}`, "err");
        return { within, root, sequence, anchored: false, tx: "" };
      }
    },

    async reveal() {
      return { remainingClear: remaining };
    },
    async revealWithin() {
      return { within: null };
    },
    async revoke() {
      revoked = true;
      remaining = 0;
      return { ok: true };
    },

    async verify(root) {
      try {
        const contract = new ethers.Contract(
          (deployed as { anchor: string | null }).anchor ?? ethers.ZeroAddress,
          ANCHOR_ABI,
          new ethers.JsonRpcProvider(RPC),
        );
        const [anchored, timestamp, submitter] = await contract.verify(root);
        return { anchored: Boolean(anchored), timestamp: Number(timestamp), submitter };
      } catch (e) {
        log(`verify failed: ${errMsg(e)}`, "err");
        return { anchored: false, timestamp: 0, submitter: null };
      }
    },
  };
}
