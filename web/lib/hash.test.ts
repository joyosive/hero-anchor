import { describe, it, expect } from "vitest";
import { buildRoot, actRootFor, handleFor } from "./hash";

describe("hash", () => {
  it("produces bytes32 roots", () => {
    expect(buildRoot([{ step: "A", fields: { ok: "true" } }])).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("changes the root when a field changes (tamper-evidence)", () => {
    const a = buildRoot([{ step: "A", fields: { ok: "true" } }]);
    const b = buildRoot([{ step: "A", fields: { ok: "false" } }]);
    expect(a).not.toEqual(b);
  });

  it("gives unique act roots per sequence", () => {
    const r = buildRoot([{ step: "A", fields: {} }]);
    expect(actRootFor(r, 0)).not.toEqual(actRootFor(r, 1));
    expect(actRootFor(r, 0)).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("handleFor is 0x + 64 hex and does not encode the input value", () => {
    const h = handleFor("rem", 0);
    expect(h).toMatch(/^0x[0-9a-f]{64}$/);
    expect(h).not.toContain("rem");
  });
});
