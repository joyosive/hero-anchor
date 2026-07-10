import { describe, it, expect } from "vitest";
import { runCycle } from "./robot";
import { FLEET, createWorld } from "./world";
import { SimBrain } from "./brain";
import { attestRoot } from "./attest";

describe("runCycle", () => {
  const brain = new SimBrain();
  it("binds perceive→decide→act into an attested record", () => {
    const r = runCycle(FLEET[0], createWorld(), brain, 0);
    expect(r.cost).toBe(120); // distance 1.2 * 100
    expect(r.attestation.root).toEqual(attestRoot(r.execRecord));
    expect(r.execRecord.seq).toBe(0);
    expect(r.execRecord.robotId).toBe("picker");
  });
  it("is deterministic", () => {
    expect(runCycle(FLEET[0], createWorld(), brain, 0)).toEqual(
      runCycle(FLEET[0], createWorld(), brain, 0),
    );
  });
});
