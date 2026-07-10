// Hero Proof of Action — off-chain (L1) -> on-chain anchor (L3) demo.
// Run with no env vars to just compute the root (offline).
// Set RPC_URL + PRIVATE_KEY + ANCHOR_ADDRESS to actually anchor on Arbitrum Sepolia.
import { ethers } from "ethers";
import fs from "fs";

// 1) A toy "action log" for one autonomous system: perceive -> decide -> act,
//    plus the authority it was operating under. In production these are signed,
//    attested records; here they're plain objects to show the shape.
const actionLog = [
  { t: 0, type: "authority", grant: "move_pallet", scope: "zone-A", expires: 1730000000 },
  { t: 1, type: "perceive",  sensor: "lidar",  reading: "pallet@1.2m" },
  { t: 2, type: "decide",    policy: "v0.3",   action: "advance", withinScope: true },
  { t: 3, type: "act",       actuator: "drive", result: "moved 1.2m", ok: true },
];

// 2) Level 1: build a tamper-evident hash chain over the log.
//    h0 = keccak(rec0); hi = keccak(h(i-1) || reci). The final hash is the root.
function buildRoot(records) {
  let prev = ethers.ZeroHash;
  for (const rec of records) {
    const encoded = ethers.toUtf8Bytes(JSON.stringify(rec));
    prev = ethers.keccak256(ethers.concat([prev, encoded]));
  }
  return prev;
}

const root = buildRoot(actionLog);
console.log("Proof-of-Action root (L1):", root);

// Tamper check: change one byte and the root changes -> that's the point.
const tampered = structuredClone(actionLog);
tampered[3].ok = false;
console.log("If the 'act' record is altered, root becomes:", buildRoot(tampered));

// 3) Level 3: anchor the root on Arbitrum Sepolia (only if env is set).
const { RPC_URL, PRIVATE_KEY, ANCHOR_ADDRESS } = process.env;
if (RPC_URL && PRIVATE_KEY && ANCHOR_ADDRESS) {
  const abi = JSON.parse(fs.readFileSync(new URL("./HeroProofAnchor.abi.json", import.meta.url)));
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const c = new ethers.Contract(ANCHOR_ADDRESS, abi, wallet);

  console.log("\nAnchoring on Arbitrum Sepolia...");
  const tx = await c.anchor(root);
  console.log("  tx:", tx.hash);
  await tx.wait();

  const [anchored, timestamp, submitter] = await c.verify(root);
  console.log("  verified:", anchored, "| at:", new Date(Number(timestamp) * 1000).toISOString(), "| by:", submitter);
  console.log("  explorer: https://sepolia.arbiscan.io/tx/" + tx.hash);
} else {
  console.log("\n(Set RPC_URL, PRIVATE_KEY, ANCHOR_ADDRESS to anchor this root on-chain.)");
}
