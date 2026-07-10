#!/usr/bin/env node
// Live CoFHE round trip against the deployed ConfidentialAuthority on
// Arbitrum Sepolia: encrypt a budget → grant → act (encrypted amount) →
// unseal the remaining budget. Puts real AuthorityGranted/ActionAnchored
// events on the contract — the encrypted check running for real, end to end.
//
// Run from repo root: node offchain/cofhe-roundtrip.cjs
// Reads PRIVATE_KEY (hero_user testnet burner) from ./.env.
//
// STATUS 2026-07-09: blocked upstream. cofhejs@0.3.1 (latest) fails in
// initializeWithEthers fetching the coprocessor's FHE public key:
//   Error serializing public key: Custom("invalid value: integer
//   7809075072243073024, expected usize")
// i.e. the Arbitrum Sepolia CoFHE key server's format has drifted ahead of
// the newest released client. Re-run this script unchanged when Fhenix ships
// a compatible cofhejs; the contract side is deployed, verified, and fully
// unit-tested against the CoFHE mocks.

const { readFileSync } = require("node:fs");
const { ethers } = require("ethers");
const { cofhejs, Encryptable, FheTypes } = require("cofhejs/node");

const RPC = "https://sepolia-rollup.arbitrum.io/rpc";
const EXPLORER = "https://sepolia.arbiscan.io";
const CA = JSON.parse(readFileSync(__dirname + "/../web/lib/deployed.sepolia.json", "utf8")).ca;

const IN_EUINT32 = "(uint256 ctHash, uint8 securityZone, uint8 utype, bytes signature)";
const CA_ABI = [
  `function grantAuthority(bytes32 agentId, ${IN_EUINT32} encLimit)`,
  `function act(bytes32 agentId, ${IN_EUINT32} encAmount, bytes32 proofRoot)`,
  "function remainingAuthority(address operator, bytes32 agentId) view returns (uint256)",
  "function wasWithinAuthority(bytes32 proofRoot) view returns (uint256)",
  "function agentInfo(address operator, bytes32 agentId) view returns (address op, uint64 actionCount)",
];

const env = Object.fromEntries(
  readFileSync(__dirname + "/../.env", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const unwrap = (label, r) => {
  if (r && typeof r === "object" && "success" in r) {
    if (!r.success) throw new Error(`${label}: ${r.error?.message ?? JSON.stringify(r.error)}`);
    return r.data;
  }
  return r;
};

const main = async () => {
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(env.PRIVATE_KEY, provider);
  const me = await wallet.getAddress();
  console.log(`operator ${me} · CA ${CA}`);

  console.log("1/5 init cofhejs (TESTNET)…");
  unwrap("init", await cofhejs.initializeWithEthers({
    ethersProvider: provider,
    ethersSigner: wallet,
    environment: "TESTNET",
  }));

  const contract = new ethers.Contract(CA, CA_ABI, wallet);
  // fresh agent id per run — grantAuthority reverts on AgentExists
  const agentId = ethers.id(`openhouse-live-${Date.now()}`);
  console.log(`agentId ${agentId.slice(0, 18)}…`);

  console.log("2/5 encrypt budget 1000 + grantAuthority…");
  const [encLimit] = unwrap("encrypt limit", await cofhejs.encrypt([Encryptable.uint32(1000n)]));
  const tx1 = await contract.grantAuthority(agentId, encLimit);
  await tx1.wait();
  console.log(`   granted  ${EXPLORER}/tx/${tx1.hash}`);

  console.log("3/5 encrypt amount 300 + act…");
  const root = ethers.id(`openhouse-proof-${Date.now()}`);
  const [encAmount] = unwrap("encrypt amount", await cofhejs.encrypt([Encryptable.uint32(300n)]));
  const tx2 = await contract.act(agentId, encAmount, root);
  await tx2.wait();
  console.log(`   acted    ${EXPLORER}/tx/${tx2.hash}`);

  console.log("4/5 permit + unseal remaining (expect 700)…");
  const permit = unwrap("permit", await cofhejs.createPermit({ type: "self", issuer: me }));
  const handle = await contract.remainingAuthority(me, agentId);
  const remaining = unwrap("unseal", await cofhejs.unseal(handle, FheTypes.Uint32, permit.issuer, permit.getHash()));
  console.log(`   remaining = ${remaining}`);

  console.log("5/5 unseal compliance flag (expect true)…");
  const flagHandle = await contract.wasWithinAuthority(root);
  const within = unwrap("unseal flag", await cofhejs.unseal(flagHandle, FheTypes.Bool, permit.issuer, permit.getHash()));
  console.log(`   within = ${within}`);

  const [, count] = await contract.agentInfo(me, agentId);
  console.log(`\nDONE — real encrypted round trip on Arbitrum Sepolia.`);
  console.log(`grant: ${EXPLORER}/tx/${tx1.hash}`);
  console.log(`act:   ${EXPLORER}/tx/${tx2.hash}`);
  console.log(`agent actionCount=${count} · remaining=${remaining} · within=${within}`);
  if (Number(remaining) !== 700 || !(within === true || within === 1n || within === 1)) {
    console.log("⚠ values differ from expectation — inspect before quoting");
    process.exitCode = 1;
  }
};

main().catch((e) => {
  console.error("FAILED:", e.message ?? e);
  process.exit(1);
});
