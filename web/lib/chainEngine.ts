import type { Contract } from "ethers";
import type { Engine } from "./types";
import { handleFor } from "./hash";

export const ANCHOR_ABI = [
  "function anchor(bytes32 proofRoot)",
  "function verify(bytes32 proofRoot) view returns (bool anchored, uint64 timestamp, address submitter)",
  // declared so ethers can DECODE the revert (otherwise the recovery below is dead code)
  "error AlreadyAnchored(bytes32 proofRoot)",
];

const errMsg = (e: unknown) => {
  if (e && typeof e === "object") {
    const o = e as { shortMessage?: string; message?: string };
    return o.shortMessage || o.message || String(e);
  }
  return String(e);
};


/**
 * Anchor-only engine: real anchor()/verify() on-chain (L3), with the within/over
 * budget check in a local closure (L3+ confidential stays simulated - CoFHE is
 * absent on plain anvil). Same Engine interface as sim/live.
 */
export function createChainEngine(opts: { contract: Contract; log: (m: string, c?: string) => void }): Engine {
  const { contract, log } = opts;
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
      // only mutate the budget/counter once we KNOW the proof is anchored,
      // so a reverted/failed tx never silently draws down the budget.
      const commit = () => {
        if (within && remaining !== null) remaining -= amount;
        count++;
      };
      try {
        const tx = await contract.anchor(root);
        await tx.wait();
        commit();
        return { within, root, sequence, anchored: true, tx: tx.hash };
      } catch (e) {
        // The anchor reverted. If the root is ALREADY on-chain (a replay, or an
        // attacker pre-anchored it), that's still "anchored", not a failure - so
        // check on-chain state rather than parse ethers' (inconsistent) error shape.
        try {
          const [already] = await contract.verify(root);
          if (already) {
            commit();
            log(`already anchored on-chain: ${root.slice(0, 10)}…`, "pending");
            return { within, root, sequence, anchored: true, tx: "" };
          }
        } catch {
          /* verify also failed → a real chain problem; fall through to error */
        }
        log(`chain anchor failed: ${errMsg(e)}`, "err");
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
        const [anchored, timestamp, submitter] = await contract.verify(root);
        return { anchored: Boolean(anchored), timestamp: Number(timestamp), submitter };
      } catch (e) {
        log(`chain verify failed: ${errMsg(e)}`, "err");
        return { anchored: false, timestamp: 0, submitter: null };
      }
    },
  };
}
