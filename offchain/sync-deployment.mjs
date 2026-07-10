#!/usr/bin/env node
// After `make deploy-verify`, copy the freshly deployed addresses from forge's
// broadcast artifact into web/lib/deployed.sepolia.json, so the frontend wires
// up automatically: HeroProofAnchor -> fleet anchoring, ConfidentialAuthority ->
// single-agent live path. Run standalone with `make sync-sepolia` too.

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

const anchor = addrOf("HeroProofAnchor");
const ca = addrOf("ConfidentialAuthority");

if (!anchor || !ca) {
  console.error("sync-deployment: could not find both contract addresses in the broadcast.");
  console.error(`  HeroProofAnchor       -> ${anchor ?? "MISSING"}`);
  console.error(`  ConfidentialAuthority -> ${ca ?? "MISSING"}`);
  process.exit(1);
}

const out = { anchor, ca, chainId: CHAIN_ID, rpc: RPC };
writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");

console.log("sync-deployment: wrote web/lib/deployed.sepolia.json");
console.log(`  HeroProofAnchor       ${anchor}`);
console.log(`  ConfidentialAuthority ${ca}`);
console.log(`  Arbiscan: https://sepolia.arbiscan.io/address/${anchor}`);
