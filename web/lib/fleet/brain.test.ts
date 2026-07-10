import { describe, it, expect } from "vitest";
import { SimBrain } from "./brain";
import type { Percept } from "./types";

const p = (sensors: Record<string, string>): Percept => ({ robotId: "r", sensors, t: 0 });

describe("SimBrain", () => {
  const brain = new SimBrain();
  it("is deterministic", () => {
    const a = brain.decide(p({ distance: "1.2", zone: "A", allowedZone: "A" }));
    const b = brain.decide(p({ distance: "1.2", zone: "A", allowedZone: "A" }));
    expect(a).toEqual(b);
  });
  it("derives cost from distance and advances when in-scope", () => {
    const d = brain.decide(p({ distance: "1.2", zone: "A", allowedZone: "A" }));
    expect(d.cost).toBe(120);
    expect(d.action).toBe("advance");
    expect(d.withinScope).toBe(true);
  });
  it("holds when out of allowed zone", () => {
    const d = brain.decide(p({ distance: "2.0", zone: "B", allowedZone: "A" }));
    expect(d.action).toBe("hold");
    expect(d.withinScope).toBe(false);
  });
});
