import { ethers } from "ethers";
import type { RecordStep } from "./types";

/**
 * Level-1 tamper-evident hash chain over the action record.
 * h0 = keccak(ZeroHash || rec0); hi = keccak(h(i-1) || reci). Final = root.
 * Editing any field changes the root — that is the tamper-evidence.
 */
export function buildRoot(records: RecordStep[]): string {
  let prev = ethers.ZeroHash;
  for (const rec of records) {
    prev = ethers.keccak256(ethers.concat([prev, ethers.toUtf8Bytes(JSON.stringify(rec))]));
  }
  return prev;
}

/** Per-action anchored root: unique per sequence so multiple acts don't collide. */
export function actRootFor(recordRoot: string, seq: number): string {
  return ethers.keccak256(ethers.concat([recordRoot, ethers.toBeHex(seq, 32)]));
}

/**
 * A deterministic, non-reversible display "handle" that looks like a CoFHE
 * ciphertext handle but never encodes the underlying value. Used in simulation
 * so the DOM shows something ciphertext-shaped without leaking the number.
 */
export function handleFor(salt: string, nonce: number | string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(`hero:${salt}:${nonce}`));
}
