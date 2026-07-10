import { describe, it, expect } from "vitest";
import { resolveSepoliaConfig, deployedCaAddress } from "./sepoliaChain";

// A valid (checksummed) address and a well-formed 32-byte hex key.
const ADDR = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const KEY = "0x" + "a".repeat(64);

describe("resolveSepoliaConfig", () => {
  it("returns null when no burner key is present (public build must never sign)", () => {
    // This is the safety invariant: the hosted Netlify bundle has no
    // NEXT_PUBLIC_FLEET_BURNER_KEY, so the Sepolia signing path stays inert.
    expect(resolveSepoliaConfig({ anchor: ADDR, burnerKey: undefined })).toBeNull();
    expect(resolveSepoliaConfig({ anchor: ADDR, burnerKey: null })).toBeNull();
    expect(resolveSepoliaConfig({ anchor: ADDR, burnerKey: "" })).toBeNull();
  });

  it("returns null when the anchor address is missing or invalid", () => {
    expect(resolveSepoliaConfig({ anchor: undefined, burnerKey: KEY })).toBeNull();
    expect(resolveSepoliaConfig({ anchor: null, burnerKey: KEY })).toBeNull();
    expect(resolveSepoliaConfig({ anchor: "not-an-address", burnerKey: KEY })).toBeNull();
    expect(resolveSepoliaConfig({ anchor: "0x1234", burnerKey: KEY })).toBeNull();
  });

  it("returns null when the burner key is malformed (not 32-byte hex)", () => {
    expect(resolveSepoliaConfig({ anchor: ADDR, burnerKey: "0xabc" })).toBeNull();
    expect(resolveSepoliaConfig({ anchor: ADDR, burnerKey: "a".repeat(64) })).toBeNull(); // missing 0x
    expect(resolveSepoliaConfig({ anchor: ADDR, burnerKey: "0x" + "z".repeat(64) })).toBeNull(); // non-hex
  });

  it("returns the config when a valid address and 32-byte key are both present", () => {
    expect(resolveSepoliaConfig({ anchor: ADDR, burnerKey: KEY })).toEqual({ anchor: ADDR, key: KEY });
  });
});

describe("deployedCaAddress", () => {
  it("returns the deployed, checksummed ConfidentialAuthority address", () => {
    // deployed.sepolia.json now carries the live Arbitrum Sepolia deployment
    // (synced by offchain/sync-deployment.mjs); a malformed/absent value must
    // yield "" so the single-agent page falls back to simulation.
    const addr = deployedCaAddress();
    expect(addr).toBe("0x977b112bc9d121c8f2567c8a52fd7b6a4f2cdd95");
  });
});
