import type { Brain, Percept, Decision } from "./types";

// re-export so consumers can `import type { Brain } from "./brain"`
export type { Brain } from "./types";

export class SimBrain implements Brain {
  readonly policyVersion = "sim-v1";
  decide(p: Percept): Decision {
    const distance = Number(p.sensors.distance ?? "0");
    const cost = Math.max(1, Math.round(distance * 100)); // 1.2m -> 120
    const withinScope = p.sensors.zone === p.sensors.allowedZone;
    return {
      action: withinScope ? "advance" : "hold",
      cost,
      policyVersion: this.policyVersion,
      withinScope,
    };
  }
}
