import { describe, it, expect } from "vitest";
import { createSimEngine } from "./simEngine";

const AID = "0xagent";

describe("simEngine", () => {
  it("runs the 5-beat arithmetic with no cleartext except reveal()", async () => {
    const e = createSimEngine();
    const g = await e.grant(AID, 1000);
    expect(g.handle).toMatch(/^0x[0-9a-f]{64}$/);

    let r = await e.act(AID, 300, "0xr0");
    expect(r.within).toBe(true);
    expect(r.anchored).toBe(true);

    r = await e.act(AID, 400, "0xr1");
    expect(r.within).toBe(true);

    r = await e.act(AID, 500, "0xr2");
    expect(r.within).toBe(false); // over-spend: no-op on budget, still anchored
    expect(r.anchored).toBe(true);

    // act results never carry the cleartext remaining
    expect(JSON.stringify(r)).not.toContain("300");

    const rev = await e.reveal(AID);
    expect(rev.remainingClear).toBe(300); // 1000 - 300 - 400, over-spend left it
  });

  it("revoke zeroes the budget and blocks draw-down", async () => {
    const e = createSimEngine();
    await e.grant(AID, 500);
    await e.act(AID, 100, "0xa");
    await e.revoke(AID);
    const r = await e.act(AID, 50, "0xb");
    expect(r.within).toBe(false);
    expect((await e.reveal(AID)).remainingClear).toBe(0);
  });

  it("assigns increasing sequence numbers", async () => {
    const e = createSimEngine();
    await e.grant(AID, 100);
    expect((await e.act(AID, 1, "0x1")).sequence).toBe(0);
    expect((await e.act(AID, 1, "0x2")).sequence).toBe(1);
  });
});
