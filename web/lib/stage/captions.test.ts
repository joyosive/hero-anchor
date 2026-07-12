import { describe, it, expect } from "vitest";
import { stageCaption, MEASURED_FEE_ETH, EST_ETH_USD } from "./captions";
import type { FleetView, FleetLedgerRow } from "../fleet/types";

function view(patch: Partial<FleetView> = {}): FleetView {
  return {
    running: false,
    step: 0,
    onChain: true,
    chainLabel: "Arbitrum Sepolia · relayer",
    explorer: "https://sepolia.arbiscan.io",
    robots: [],
    ledger: [],
    log: [],
    ...patch,
  };
}

const row = (within: boolean | null, i: number): FleetLedgerRow => ({
  robotId: "picker",
  seq: i,
  within,
  root: "0x" + String(i).padStart(2, "0").repeat(32),
  tx: "0xtx" + i,
});

describe("stageCaption - narrates in the deck's evidence vocabulary", () => {
  it("prompts to start when idle with an empty ledger", () => {
    const c = stageCaption(view(), null);
    expect(c).not.toBeNull();
    expect(c!.tone).toBe("idle");
    expect(c!.text).toMatch(/SPACE/);
  });

  it("frames the shift as evidence when it starts running", () => {
    const prev = view();
    const c = stageCaption(view({ running: true }), prev);
    expect(c!.tone).toBe("ok");
    expect(c!.text).toMatch(/EVIDENCE/i);
    expect(c!.text).toMatch(/ARBITRUM/i);
  });

  it("celebrates the first proof", () => {
    const prev = view({ running: true });
    const next = view({ running: true, ledger: [row(true, 0)] });
    const c = stageCaption(next, prev);
    expect(c!.tone).toBe("ok");
    expect(c!.text).toMatch(/FIRST PROOF/i);
  });

  it("counts actions as pieces of evidence", () => {
    const prev = view({ running: true, ledger: [row(true, 0)] });
    const next = view({ running: true, ledger: [row(true, 0), row(true, 1), row(true, 2)] });
    const c = stageCaption(next, prev);
    expect(c!.tone).toBe("ok");
    expect(c!.text).toMatch(/3/);
    expect(c!.text).toMatch(/EVIDENCE/i);
  });

  it("frames an over-mandate action as a provable violation, mandate sealed", () => {
    const prev = view({ running: true, ledger: [row(true, 0)] });
    const next = view({ running: true, ledger: [row(true, 0), row(false, 1)] });
    const c = stageCaption(next, prev);
    expect(c!.tone).toBe("alert");
    expect(c!.text).toMatch(/MANDATE EXCEEDED/);
    expect(c!.text).toMatch(/sealed/i);
  });

  it("summarizes with proofs + total cost when the shift completes", () => {
    const prev = view({ running: true, step: 6, ledger: [row(true, 0), row(false, 1)] });
    const next = view({ running: false, step: 6, ledger: [row(true, 0), row(false, 1)] });
    const c = stageCaption(next, prev);
    expect(c!.tone).toBe("done");
    expect(c!.text).toMatch(/2 ACTIONS/i);
    expect(c!.text).toMatch(/PROOFS/i);
    expect(c!.text).toMatch(/\$/);
  });

  it("returns null when nothing stage-worthy changed", () => {
    const a = view({ running: true, ledger: [row(true, 0)] });
    const b = view({ running: true, ledger: [row(true, 0)] });
    expect(stageCaption(b, a)).toBeNull();
  });
});

describe("constants", () => {
  it("exports the measured per-anchor fee and est ETH price", () => {
    expect(MEASURED_FEE_ETH).toBeCloseTo(0.000000989, 12);
    expect(EST_ETH_USD).toBeGreaterThan(0);
  });
});
