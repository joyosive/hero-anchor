import { describe, it, expect, vi } from "vitest";
import type { Contract } from "ethers";
import { createChainEngine } from "./chainEngine";

function mockContract() {
  const anchor = vi.fn(async () => ({ hash: "0xdeadbeef", wait: async () => ({}) }));
  const verify = vi.fn(async () => [true, 123n, "0xabc"]);
  return { anchor, verify } as unknown as Contract & {
    anchor: ReturnType<typeof vi.fn>;
    verify: ReturnType<typeof vi.fn>;
  };
}

describe("chainEngine", () => {
  it("fires a real anchor() on act and mirrors the sim within/over check", async () => {
    const c = mockContract();
    const e = createChainEngine({ contract: c, log: () => {} });
    await e.grant("r", 1000);
    const r1 = await e.act("r", 300, "0xr0");
    expect(c.anchor).toHaveBeenCalledWith("0xr0");
    expect(r1.within).toBe(true);
    expect(r1.anchored).toBe(true);
    expect(r1.tx).toBe("0xdeadbeef");

    const r2 = await e.act("r", 5000, "0xr1"); // over budget
    expect(r2.within).toBe(false);
    expect(r2.anchored).toBe(true); // still anchored on-chain
  });

  it("verify() reads the chain", async () => {
    const c = mockContract();
    const e = createChainEngine({ contract: c, log: () => {} });
    const v = await e.verify("0xroot");
    expect(c.verify).toHaveBeenCalledWith("0xroot");
    expect(v.anchored).toBe(true);
    expect(v.timestamp).toBe(123);
  });
});
