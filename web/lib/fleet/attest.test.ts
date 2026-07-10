import { describe, it, expect } from "vitest";
import { attest, attestRoot, SIM_SIGNER } from "./attest";
import type { ExecRecord } from "./types";

const rec: ExecRecord = {
  robotId: "picker",
  percept: { robotId: "picker", sensors: { distance: "1.2", zone: "A", allowedZone: "A" }, t: 0 },
  decision: { action: "advance", cost: 120, policyVersion: "sim-v1", withinScope: true },
  action: { actuator: "drive", result: "moved 1.2m", cost: 120 },
  policyVersion: "sim-v1",
  seq: 0,
};

describe("attest", () => {
  it("produces a bytes32 root and a deterministic attestation", () => {
    const a = attest(rec);
    expect(a.root).toMatch(/^0x[0-9a-f]{64}$/);
    expect(a.root).toEqual(attestRoot(rec));
    expect(a.signer).toBe(SIM_SIGNER);
    expect(a.sig).toMatch(/^0x[0-9a-f]{64}$/);
    expect(attest(rec)).toEqual(a); // deterministic
  });

  it("binds all three phases — changing any phase changes the root", () => {
    const base = attestRoot(rec);
    expect(attestRoot({ ...rec, decision: { ...rec.decision, cost: 121 } })).not.toEqual(base);
    expect(attestRoot({ ...rec, action: { ...rec.action, result: "x" } })).not.toEqual(base);
    expect(attestRoot({ ...rec, percept: { ...rec.percept, t: 1 } })).not.toEqual(base);
  });
});
