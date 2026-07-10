import { ethers } from "ethers";
import type { Engine } from "./types";

// ---------------------------------------------------------------------------
// Live path against a deployed ConfidentialAuthority via ethers + cofhejs.
// UNTESTED until the contract is deployed. Confirm the InEuint32 tuple field
// order against @fhenixprotocol/cofhe-contracts@0.1.4 and the cofhejs@0.3.x
// call signatures (encrypt / createPermit / unseal / FheTypes) against the live
// SDK docs before trusting this. Every call degrades gracefully; sim is the
// safe default.
// ---------------------------------------------------------------------------

const IN_EUINT32 =
  "(uint256 ctHash, uint8 securityZone, uint8 utype, bytes signature)";

export const CA_ABI: string[] = [
  `function grantAuthority(bytes32 agentId, ${IN_EUINT32} encLimit)`,
  `function act(bytes32 agentId, ${IN_EUINT32} encAmount, bytes32 proofRoot)`,
  "function revokeAuthority(bytes32 agentId)",
  "function remainingAuthority(address operator, bytes32 agentId) view returns (uint256)",
  "function wasWithinAuthority(bytes32 proofRoot) view returns (uint256)",
  "function verifyAction(bytes32 proofRoot) view returns (bool anchored, uint64 timestamp, address submitter)",
  "function agentInfo(address operator, bytes32 agentId) view returns (address op, uint64 actionCount)",
];

const COFHE_URL = "https://esm.sh/cofhejs@0.3.1";
// Hide the URL import from the bundler so it stays a native runtime ESM import
// in the browser (never bundled, never breaks `next build`).
const runtimeImport = new Function("u", "return import(u)") as (
  u: string,
) => Promise<Record<string, unknown> & { cofhejs: any; Encryptable: any; FheTypes: any }>;

export interface LiveOpts {
  provider: ethers.BrowserProvider;
  signer: ethers.Signer;
  contract: ethers.Contract;
  account: string;
  log: (msg: string, cls?: string) => void;
}

function unwrap(v: unknown): unknown {
  return v && typeof v === "object" && "data" in (v as Record<string, unknown>)
    ? (v as Record<string, unknown>).data
    : v;
}

export function createLiveEngine(opts: LiveOpts): Engine {
  const { contract, provider, signer, account, log } = opts;
  let cofhe: { cofhejs: any; Encryptable: any; FheTypes: any } | null = null;
  let seq = 0;

  async function ensure(): Promise<NonNullable<typeof cofhe>> {
    if (cofhe) return cofhe;
    const mod = (await runtimeImport(COFHE_URL)) as unknown as {
      cofhejs: any;
      Encryptable: any;
      FheTypes: any;
    };
    await mod.cofhejs.initializeWithEthers({
      ethersProvider: provider,
      ethersSigner: signer,
      environment: "TESTNET",
    });
    cofhe = mod;
    return mod;
  }

  return {
    async grant(agentId, limit) {
      try {
        const c = await ensure();
        const [enc] = await c.cofhejs.encrypt([c.Encryptable.uint32(BigInt(limit))]);
        await (await contract.grantAuthority(agentId, enc)).wait();
        return { ok: true, handle: "(encrypted on-chain)" };
      } catch (e) {
        log("live grant: " + errMsg(e), "err");
        return { ok: false, handle: "" };
      }
    },

    async act(agentId, amount, root) {
      try {
        const c = await ensure();
        const [enc] = await c.cofhejs.encrypt([c.Encryptable.uint32(BigInt(amount))]);
        const tx = await contract.act(agentId, enc, root);
        await tx.wait();
        return { within: null, root, sequence: seq++, anchored: true, tx: tx.hash };
      } catch (e) {
        log("live act: " + errMsg(e), "err");
        return { within: null, root, sequence: seq, anchored: false, tx: "" };
      }
    },

    async reveal(agentId) {
      try {
        const c = await ensure();
        const permit = await c.cofhejs.createPermit({ type: "self", issuer: account });
        const handle = await contract.remainingAuthority(account, agentId);
        const clear = await c.cofhejs.unseal(handle, c.FheTypes.Uint32, permit);
        return { remainingClear: Number(unwrap(clear)) };
      } catch (e) {
        log("live reveal: " + errMsg(e), "err");
        return { remainingClear: null };
      }
    },

    async revealWithin(root) {
      try {
        const c = await ensure();
        const permit = await c.cofhejs.createPermit({ type: "self", issuer: account });
        const handle = await contract.wasWithinAuthority(root);
        const w = await c.cofhejs.unseal(handle, c.FheTypes.Bool, permit);
        return { within: Boolean(unwrap(w)) };
      } catch (e) {
        log("live within: " + errMsg(e), "err");
        return { within: null };
      }
    },

    async revoke(agentId) {
      try {
        await (await contract.revokeAuthority(agentId)).wait();
        return { ok: true };
      } catch (e) {
        log("live revoke: " + errMsg(e), "err");
        return { ok: false };
      }
    },

    async verify(root) {
      try {
        const [anchored, timestamp, submitter] = await contract.verifyAction(root);
        return { anchored: Boolean(anchored), timestamp: Number(timestamp), submitter };
      } catch (e) {
        log("live verify: " + errMsg(e), "err");
        return { anchored: false, timestamp: 0, submitter: null };
      }
    },
  };
}

function errMsg(e: unknown): string {
  if (e && typeof e === "object") {
    const o = e as { shortMessage?: string; message?: string };
    return o.shortMessage || o.message || String(e);
  }
  return String(e);
}
