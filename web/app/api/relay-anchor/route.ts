import { NextResponse } from "next/server";
import { ethers } from "ethers";
import deployed from "@/lib/deployed.sepolia.json";
import { ANCHOR_ABI } from "@/lib/chainEngine";
import { isValidRoot, TokenBucket, IpBuckets } from "@/lib/relay";
import { RPC, EXPLORER } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Server-side anchor relay. Holds FLEET_RELAYER_KEY (a TESTNET throwaway, set
// only in the deployment environment — never NEXT_PUBLIC_, never in the
// bundle). Exposes exactly one on-chain capability: anchor(bytes32) on the
// deployed HeroProofAnchor. Strict input validation + token-bucket limiting;
// worst-case abuse = a few dollars of testnet gas.
// ---------------------------------------------------------------------------

export const dynamic = "force-dynamic";

// Per-IP first (burst 25, ~12/min sustained — one full shift is 18 anchors),
// so a hostile client exhausts only its own allowance, never the stage
// demo's. A generous global bucket backstops total testnet-gas burn.
const perIp = new IpBuckets(25, 0.2);
const globalBucket = new TokenBucket(80, 1);

let contract: ethers.Contract | null = null;
function relayer(): ethers.Contract | null {
  const key = process.env.FLEET_RELAYER_KEY;
  const anchor = (deployed as { anchor?: string | null }).anchor;
  if (!key || !/^0x[0-9a-fA-F]{64}$/.test(key) || !anchor) return null;
  if (!contract) {
    const wallet = new ethers.Wallet(key, new ethers.JsonRpcProvider(RPC));
    contract = new ethers.Contract(anchor, ANCHOR_ABI, wallet);
  }
  return contract;
}

/** Availability probe: {live} — true iff a well-formed server key is configured. */
export async function GET() {
  const c = relayer();
  return NextResponse.json({
    live: !!c,
    address: (deployed as { anchor?: string | null }).anchor ?? undefined,
  });
}

/** Anchor one proof root. Body: {root: 0x + 64 hex}. */
export async function POST(req: Request) {
  const c = relayer();
  if (!c) return NextResponse.json({ ok: false, error: "relayer disabled" }, { status: 503 });
  const ip = req.headers.get("x-nf-client-connection-ip") ?? req.headers.get("x-forwarded-for") ?? "unknown";
  if (!perIp.take(ip) || !globalBucket.take()) {
    return NextResponse.json({ ok: false, error: "rate limited" }, { status: 429 });
  }

  const body = (await req.json().catch(() => ({}))) as { root?: unknown };
  if (!isValidRoot(body.root)) {
    return NextResponse.json({ ok: false, error: "bad root" }, { status: 400 });
  }

  try {
    const tx = await c.anchor(body.root);
    await tx.wait();
    return NextResponse.json({ ok: true, tx: tx.hash, explorer: `${EXPLORER}/tx/${tx.hash}` });
  } catch {
    // Already anchored (replay / pre-anchor griefing) still counts as anchored —
    // same on-chain-state recovery as chainEngine, cheaper than parsing errors.
    try {
      const [already] = await c.verify(body.root);
      if (already) return NextResponse.json({ ok: true, tx: "", explorer: "" });
    } catch {
      /* verify also failed → real chain problem */
    }
    return NextResponse.json({ ok: false, error: "anchor failed" }, { status: 502 });
  }
}
