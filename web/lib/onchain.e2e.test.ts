import { describe, it, expect, beforeAll } from "vitest";
import { ethers } from "ethers";
import { makeLocalContract, ANVIL_RPC } from "./localChain";
import { createChainEngine } from "./chainEngine";

// Real end-to-end against a running anvil (with `make deploy-local`). Skips
// gracefully when anvil isn't reachable, so the normal suite stays green.
let up = false;
beforeAll(async () => {
  try {
    await new ethers.JsonRpcProvider(ANVIL_RPC).getBlockNumber();
    up = true;
  } catch {
    up = false;
  }
});

describe("on-chain e2e (requires anvil + make deploy-local)", () => {
  it("anchors + verifies a root through the real chainEngine", async () => {
    if (!up) {
      console.warn("[e2e] anvil not reachable at " + ANVIL_RPC + " - skipping (this is fine locally/CI)");
      return;
    }
    const contract = makeLocalContract();
    if (!contract) {
      console.warn("[e2e] no deployment in deployed.local.json - run `make deploy-local` - skipping");
      return;
    }
    const e = createChainEngine({ contract, log: () => {} });
    await e.grant("r", 1000);
    // unique root so re-runs don't hit AlreadyAnchored
    const root = ethers.keccak256(ethers.toUtf8Bytes("e2e-" + Date.now()));
    const r = await e.act("r", 100, root);
    expect(r.anchored).toBe(true);
    expect(r.within).toBe(true);
    const v = await e.verify(root);
    expect(v.anchored).toBe(true);
    expect(v.timestamp).toBeGreaterThan(0);

    // replay the SAME root (already on-chain) - the AlreadyAnchored recovery must
    // report anchored:true, NOT a hard failure. This is the "second run" case.
    const again = await e.act("r", 100, root);
    expect(again.anchored).toBe(true);
  });
});
