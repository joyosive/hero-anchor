import { ethers } from "ethers";
import deployment from "./deployed.local.json";
import { ANCHOR_ABI } from "./chainEngine";

export const ANVIL_RPC = "http://127.0.0.1:8545";
// well-known anvil account 0 - PUBLIC, local-only. Never a real key.
export const ANVIL_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

export function loadLocalDeployment(): { anchor: string; chainId: number; rpc: string } | null {
  const d = deployment as { anchor?: string; chainId?: number; rpc?: string };
  return d && d.anchor && ethers.isAddress(d.anchor)
    ? { anchor: d.anchor, chainId: d.chainId ?? 31337, rpc: d.rpc ?? ANVIL_RPC }
    : null;
}

export function makeLocalContract(): ethers.Contract | null {
  const d = loadLocalDeployment();
  if (!d) return null;
  // SAFETY: this signs with the PUBLIC anvil key. Never sign from a production
  // build, and only ever against loopback - a hosted bundle must not transact.
  if (process.env.NODE_ENV === "production") return null;
  if (typeof window !== "undefined") {
    const h = window.location.hostname;
    if (h !== "localhost" && h !== "127.0.0.1") return null;
  }
  // pin the provider to loopback, regardless of what deployed.local.json names
  const wallet = new ethers.Wallet(ANVIL_KEY, new ethers.JsonRpcProvider(ANVIL_RPC));
  return new ethers.Contract(d.anchor, ANCHOR_ABI, wallet);
}
