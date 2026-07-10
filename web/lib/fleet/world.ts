import type { Percept } from "./types";

export interface RobotSpec {
  id: string;
  name: string;
  color: string; // acid-on-black palette
  zone: "A" | "B" | "C";
  home: [number, number];
  pallet: [number, number]; // where the robot goes to pick up on `act`
  budget: number; // encrypted authority granted per shift
  script: { distance: number; zone: string; allowedZone: string }[];
}

export interface World {
  step: number;
}

export const FLEET: RobotSpec[] = [
  {
    id: "picker",
    name: "Picker",
    color: "#AAFF00",
    zone: "A",
    home: [-4, 1],
    pallet: [-4, -1.5],
    budget: 1000,
    script: [
      { distance: 1.2, zone: "A", allowedZone: "A" },
      { distance: 2.0, zone: "A", allowedZone: "A" },
      { distance: 1.5, zone: "A", allowedZone: "A" },
    ],
  },
  {
    id: "hauler",
    name: "Hauler",
    color: "#22D3EE",
    zone: "B",
    home: [0, 1],
    pallet: [0, -1.5],
    budget: 1200,
    script: [
      { distance: 3.0, zone: "B", allowedZone: "B" },
      { distance: 2.5, zone: "B", allowedZone: "B" },
      { distance: 4.0, zone: "C", allowedZone: "B" }, // out-of-zone → hold (withinScope false)
    ],
  },
  {
    id: "scanner",
    name: "Scanner",
    color: "#FFB020",
    zone: "C",
    home: [4, 1],
    pallet: [4, -1.5],
    budget: 500,
    script: [
      { distance: 1.0, zone: "A", allowedZone: "A" },
      { distance: 6.0, zone: "A", allowedZone: "A" }, // cost 600 > budget 500 → over-authority no-op
      { distance: 2.0, zone: "A", allowedZone: "A" },
    ],
  },
];

export function createWorld(): World {
  return { step: 0 };
}

export function tick(w: World): World {
  return { step: w.step + 1 };
}

export function perceive(spec: RobotSpec, w: World): Percept {
  const i = w.step % spec.script.length;
  const s = spec.script[i];
  return {
    robotId: spec.id,
    sensors: { distance: String(s.distance), zone: s.zone, allowedZone: s.allowedZone },
    t: w.step,
  };
}
