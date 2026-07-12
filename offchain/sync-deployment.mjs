#!/usr/bin/env node
// After `make deploy`, write the live addresses into web/lib/deployed.sepolia.json
// so the frontend wires up automatically. The Rust/Stylus anchor is deployed
// separately (cargo stylus) and is not in the forge broadcast, so it comes from
// ANCHOR_ADDRESS; the Solidity ConfidentialAuthority is read from the broadcast.
// Run standalone with `make sync-sepolia` (pass ANCHOR_ADDRESS) too.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHAIN_ID = 421614;
const RPC = "https://sepolia-rollup.arbitrum.io/rpc";

const broadcastPath = join(ROOT, "broadcast", "Deploy.s.sol", String(CHAIN_ID), "run-latest.json");
const outPath = join(ROOT, "web", "lib", "deployed.sepolia.json");

let broadcast;
try {
  broadcast = JSON.parse(readFileSync(broadcastPath, "utf8"));
} catch {
  console.error(`sync-deployment: no broadcast at ${broadcastPath}`);
  console.error("Run `make deploy-verify` first (it writes the broadcast artifact).");
  process.exit(1);
}

const txs = Array.isArray(broadcast.transactions) ? broadcast.transactions : [];
const addrOf = (name) => {
  const tx = txs.find(
    (t) => t.transactionType === "CREATE" && t.contractName === name && t.contractAddress,
  );
  return tx ? tx.contractAddress : null;
};

// The Rust/Stylus anchor is deployed with cargo stylus, so it is not in the
// forge broadcast: take it from ANCHOR_ADDRESS. The CA is a forge deploy.
const anchor = process.env.ANCHOR_ADDRESS || null;
const ca = addrOf("ConfidentialAuthority");

if (!anchor || !ca) {
  console.error("sync-deployment: need ANCHOR_ADDRESS (the Rust/Stylus anchor) plus the CA from the broadcast.");
  console.error(`  anchor (ANCHOR_ADDRESS) -> ${anchor ?? "MISSING"}`);
  console.error(`  ConfidentialAuthority   -> ${ca ?? "MISSING"}`);
  process.exit(1);
}

const out = { anchor, ca, chainId: CHAIN_ID, rpc: RPC };
writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");

console.log("sync-deployment: wrote web/lib/deployed.sepolia.json");
console.log(`  HeroProofAnchor       ${anchor}`);
console.log(`  ConfidentialAuthority ${ca}`);
console.log(`  Arbiscan: https://sepolia.arbiscan.io/address/${anchor}`);
