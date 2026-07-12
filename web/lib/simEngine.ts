import type { Engine } from "./types";
import { handleFor } from "./hash";

/**
 * Deterministic local engine. The true budget lives in this closure and is
 * ONLY returned by reveal() - it never flows into React state otherwise, so it
 * cannot leak into the rendered DOM. Never throws.
 *
 * The branchless rule mirrors the on-chain contract: within = amount <= remaining;
 * an over-authority action is a no-op on the budget but is still "anchored".
 */
export function createSimEngine(): Engine {
  let remaining: number | null = null; // SECRET - closure only
  let granted = false;
  let revoked = false;
  let count = 0;

  return {
    async grant(_agentId, limit) {
      remaining = limit;
      granted = true;
      revoked = false;
      count = 0;
      return { ok: true, handle: handleFor("rem", 0) };
    },

    async act(_agentId, amount, root) {
      const within = granted && !revoked && remaining !== null && amount <= remaining;
      if (within && remaining !== null) remaining -= amount;
      const sequence = count++;
      return { within, root, sequence, anchored: true, tx: handleFor("tx", sequence) };
    },

    async reveal() {
      return { remainingClear: remaining };
    },

    async revealWithin() {
      // The hook tracks per-action verdicts locally in sim; nothing to unseal.
      return { within: null };
    },

    async revoke() {
      revoked = true;
      remaining = 0;
      return { ok: true };
    },

    async verify(_root) {
      // Ledger membership is tracked by the hook; sim reports a synthetic record.
      return {
        anchored: true,
        timestamp: Math.floor(Date.now() / 1000),
        submitter: "0x0000000000000000000000000000000000000SIM",
      };
    },
  };
}
