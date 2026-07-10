import { describe, it, expect } from "vitest";
import { createSimEngine } from "../simEngine";
import type { Engine } from "../types";
import { FLEET, createWorld, tick } from "./world";
import { SimBrain } from "./brain";
import { runCycle } from "./robot";

// Mirrors the loop useFleet runs: one simEngine per robot, each attested cycle
// routed through act(). Verifies budget depletion + the over-authority no-op.
describe("fleet integration (engines + attested cycles)", () => {
  it("depletes budgets and produces an over-authority no-op for scanner", async () => {
    const brain = new SimBrain();
    const engines = new Map<string, Engine>(
      FLEET.map((s) => {
        const e = createSimEngine();
        void e.grant(s.id, s.budget);
        return [s.id, e] as const;
      }),
    );

    let w = createWorld();
    const verdicts: Record<string, (boolean | null)[]> = { picker: [], hauler: [], scanner: [] };
    const roots = new Set<string>();

    for (let step = 0; step < 6; step++) {
      for (const s of FLEET) {
        const c = runCycle(s, w, brain, step);
        roots.add(c.attestation.root);
        const r = await engines.get(s.id)!.act(s.id, c.cost, c.attestation.root);
        verdicts[s.id].push(r.within);
      }
      w = tick(w);
    }

    // every attested action produced a unique proof root (18 = 3 robots x 6 steps)
    expect(roots.size).toBe(18);
    // scanner over-spends at least once (600 > remaining)
    expect(verdicts.scanner).toContain(false);
    // picker stays within the whole shift (940 total < 1000)
    expect(verdicts.picker.every((v) => v === true)).toBe(true);
    // only reveal() exposes a cleartext remaining
    const rem = await engines.get("scanner")!.reveal("scanner");
    expect(typeof rem.remainingClear).toBe("number");
    expect(rem.remainingClear).toBe(100);
  });
});
