import { ethers } from "ethers";
import deployment from "./deployed.sepolia.json";
import { ANCHOR_ABI } from "./chainEngine";
import { RPC, EXPLORER, CHAIN_ID } from "./constants";

const KEY_RE = /^0x[0-9a-fA-F]{64}$/;

/**
 * Pure guard for the fleet's Arbitrum Sepolia signing path. Returns a usable
 * config only when BOTH a valid deployed anchor address and a well-formed
 * 32-byte burner key are present.
 *
 * The burner key comes from NEXT_PUBLIC_FLEET_BURNER_KEY, which is only ever set
 * in a local booth build — the public Netlify bundle has none, so this returns
 * null there and the fleet stays in simulation. The invariant: never sign
 * without a funded throwaway key we deliberately supplied.
 */
export function resolveSepoliaConfig(opts: {
  anchor?: string | null;
  burnerKey?: string | null;
}): { anchor: string; key: string } | null {
  const { anchor, burnerKey } = opts;
  if (!anchor || !ethers.isAddress(anchor)) return null;
  if (!burnerKey || !KEY_RE.test(burnerKey)) return null;
  return { anchor, key: burnerKey };
}

/**
 * The deployed ConfidentialAuthority address for the single-agent live path, or
 * "" if not deployed yet. Pre-fills the setup field so the booth operator only
 * needs to connect a wallet — no hand-pasting. The address is public and safe to
 * ship; an empty value keeps the page in simulation until the deploy fills it.
 */
export function deployedCaAddress(): string {
  const d = deployment as { ca?: string | null };
  return d?.ca && ethers.isAddress(d.ca) ? d.ca : "";
}

export interface SepoliaChain {
  contract: ethers.Contract;
  label: string;
  explorer: string;
  chainId: number;
}

/**
 * Build a fleet anchor contract that signs with a funded burner key on Arbitrum
 * Sepolia. The fleet already sends anchors sequentially (one shared wallet, one
 * tx at a time), so a single burner key is nonce-safe. Returns null — caller
 * falls back to local anvil, then sim — whenever the burner key or a deployed
 * address is absent (see resolveSepoliaConfig).
 */
export function makeSepoliaContract(): SepoliaChain | null {
  const d = deployment as { anchor?: string | null };
  const cfg = resolveSepoliaConfig({
    anchor: d?.anchor ?? null,
    burnerKey: process.env.NEXT_PUBLIC_FLEET_BURNER_KEY ?? null,
  });
  if (!cfg) return null;

  const wallet = new ethers.Wallet(cfg.key, new ethers.JsonRpcProvider(RPC));
  const contract = new ethers.Contract(cfg.anchor, ANCHOR_ABI, wallet);
  return { contract, label: "Arbitrum Sepolia", explorer: EXPLORER, chainId: CHAIN_ID };
}
