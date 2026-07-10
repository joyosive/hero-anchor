import { describe, it, expect } from "vitest";
import { FLEET, createWorld, tick, perceive } from "./world";

describe("world", () => {
  it("has exactly 3 robots", () => {
    expect(FLEET.map((r) => r.id)).toEqual(["picker", "hauler", "scanner"]);
  });
  it("ticks deterministically", () => {
    let a = createWorld();
    let b = createWorld();
    for (let i = 0; i < 5; i++) {
      a = tick(a);
      b = tick(b);
    }
    expect(a).toEqual(b);
    expect(a.step).toBe(5);
  });
  it("perceive is deterministic for a given step", () => {
    const w = tick(tick(createWorld()));
    expect(perceive(FLEET[0], w)).toEqual(perceive(FLEET[0], w));
  });
  it("scanner script includes an over-budget move (drives the over-authority beat)", () => {
    const scanner = FLEET.find((r) => r.id === "scanner")!;
    const maxCost = Math.max(...scanner.script.map((s) => Math.round(s.distance * 100)));
    expect(maxCost).toBeGreaterThan(scanner.budget);
  });
  it("assigns each robot a distinct zone and a pallet cell", () => {
    expect(FLEET.map((r) => r.zone)).toEqual(["A", "B", "C"]);
    for (const r of FLEET) expect(r.pallet.length).toBe(2);
  });
});
