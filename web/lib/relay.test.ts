import { describe, it, expect, vi, afterEach } from "vitest";
import { isValidRoot, TokenBucket, IpBuckets, createRelayEngine } from "./relay";

describe("isValidRoot", () => {
  it("accepts a 32-byte 0x hex string", () => {
    expect(isValidRoot("0x" + "ab".repeat(32))).toBe(true);
    expect(isValidRoot("0x" + "AB".repeat(32))).toBe(true); // case-insensitive
  });
  it("rejects everything else", () => {
    const bad = ["", "0x12", "ab".repeat(32), "0x" + "zz".repeat(32), 42, null, undefined, {}, "0x" + "ab".repeat(33)];
    for (const b of bad) expect(isValidRoot(b as unknown)).toBe(false);
  });
});

describe("TokenBucket", () => {
  it("allows capacity takes then refuses (no refill)", () => {
    const b = new TokenBucket(3, 0);
    expect([b.take(), b.take(), b.take(), b.take()]).toEqual([true, true, true, false]);
  });
});

describe("IpBuckets — one hostile client cannot starve the stage demo", () => {
  it("rate-limits per IP: exhausting one IP leaves another untouched", () => {
    const b = new IpBuckets(2, 0); // 2 takes per IP, no refill
    expect(b.take("attacker")).toBe(true);
    expect(b.take("attacker")).toBe(true);
    expect(b.take("attacker")).toBe(false); // attacker starved
    expect(b.take("stage-laptop")).toBe(true); // demo unaffected
    expect(b.take("stage-laptop")).toBe(true);
  });

  it("caps tracked IPs so the map cannot grow unbounded", () => {
    const b = new IpBuckets(1, 0, 3); // track at most 3 IPs
    for (let i = 0; i < 10; i++) b.take(`ip-${i}`);
    expect(b.size).toBeLessThanOrEqual(3);
  });
});

describe("createRelayEngine", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("act() POSTs the root and mirrors within/over locally", async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ ok: true, tx: "0xtx1" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const e = createRelayEngine({ log: () => {} });
    await e.grant("r", 1000);

    const r = await e.act("r", 300, "0x" + "11".repeat(32));
    expect(fetchMock).toHaveBeenCalledWith("/api/relay-anchor", expect.objectContaining({ method: "POST" }));
    expect(r.anchored).toBe(true);
    expect(r.tx).toBe("0xtx1");
    expect(r.within).toBe(true);

    const over = await e.act("r", 5000, "0x" + "22".repeat(32)); // over budget
    expect(over.within).toBe(false);
    expect(over.anchored).toBe(true); // still anchored on-chain
  });

  it("act() returns anchored:false when the relay errors, without draining the budget", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ ok: false, error: "rate limited" }), { status: 429 })),
    );
    const log = vi.fn();
    const e = createRelayEngine({ log });
    await e.grant("r", 1000);
    const r = await e.act("r", 300, "0x" + "33".repeat(32));
    expect(r.anchored).toBe(false);
    expect(log).toHaveBeenCalled();
    // budget untouched by the failed action: a follow-up 1000 spend is still within
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ ok: true, tx: "0xtx2" }), { status: 200 })));
    const next = await e.act("r", 1000, "0x" + "44".repeat(32));
    expect(next.within).toBe(true);
  });

  it("act() survives fetch throwing (network down)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    const e = createRelayEngine({ log: () => {} });
    await e.grant("r", 1000);
    const r = await e.act("r", 300, "0x" + "55".repeat(32));
    expect(r.anchored).toBe(false);
  });
});
