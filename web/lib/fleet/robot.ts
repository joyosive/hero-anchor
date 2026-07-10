import type { RobotSpec, World } from "./world";
import { perceive } from "./world";
import type { Brain } from "./brain";
import { attest } from "./attest";
import type { Action, CycleResult, ExecRecord } from "./types";

/** One robot cycle: perceive → decide → act → attest, bound into an ExecRecord. */
export function runCycle(spec: RobotSpec, world: World, brain: Brain, seq: number): CycleResult {
  const percept = perceive(spec, world);
  const decision = brain.decide(percept);
  const action: Action = {
    actuator: "drive",
    result: decision.action === "advance" ? `moved ${percept.sensors.distance}m` : "held (out of zone)",
    cost: decision.cost,
  };
  const execRecord: ExecRecord = {
    robotId: spec.id,
    percept,
    decision,
    action,
    policyVersion: decision.policyVersion,
    seq,
  };
  return { execRecord, attestation: attest(execRecord), cost: decision.cost };
}
