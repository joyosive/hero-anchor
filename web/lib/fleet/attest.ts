import { ethers } from "ethers";
import type { ExecRecord, Attestation } from "./types";

// Sim stand-in for a hardware attester identity. Real L2 = a TEE quote.
export const SIM_SIGNER = "0x0000000000000000000000000000000000000L2";

/** The L2 bound record: hash over perceive+decide+act as one unit. */
export function attestRoot(rec: ExecRecord): string {
  return ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(rec)));
}

/** Simulated attestation: deterministic, non-secret. Real = TEE quote over `root`. */
export function attest(rec: ExecRecord): Attestation {
  const root = attestRoot(rec);
  const sig = ethers.keccak256(ethers.toUtf8Bytes(`attest:${SIM_SIGNER}:${root}`));
  return { root, signer: SIM_SIGNER, sig };
}
