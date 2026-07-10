#!/usr/bin/env node
// Hero anchoring cost table — turns measured gas into per-action USD.
//
// Execution-gas defaults come from `forge test --match-contract GasBench`
// (single anchor 29,597 · batched-per-anchor 24,835). The full per-tx cost adds
// the 21,000 intrinsic + calldata; batching's win is amortizing those across N
// roots. AnyTrust L3 removes the L1 data-availability cost via a DAC, leaving
// ~the SSTORE.
//
// After deploy, replace the modeled numbers with REAL Arbitrum Sepolia tx gas
// (a real `anchor` / `anchorBatch` receipt captures Arbitrum's L1 data fee too):
//   node offchain/gas-table.mjs --gas-price <gwei> --eth <usd> \
//        --single-gas <measured> --batch-gas <measured-total> --batch 20
//
// All money numbers are only as real as --gas-price and --eth. Defaults are
// placeholders — pass live values at demo time.

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, tok, i, arr) => {
    if (tok.startsWith("--")) acc.push([tok.slice(2), arr[i + 1]]);
    return acc;
  }, []),
);
const num = (k, d) => (args[k] !== undefined ? Number(args[k]) : d);

// --- measured execution gas (forge GasBench) --------------------------------
const SINGLE_EXEC = num("single-exec", 29_597); // anchor() execution gas
const BATCH_EXEC_PER = num("batch-exec", 24_835); // anchorBatch per-anchor execution gas

// --- per-tx overhead the execution number excludes --------------------------
const INTRINSIC = 21_000; // base cost every standalone tx pays once
const CALLDATA_ANCHOR = 552; // selector + 32-byte root, ~16 gas/nonzero byte
const CALLDATA_ROOT = 512; // 32-byte root inside a batch (array overhead amortized)

const N = num("batch", 20); // roots per batch tx

// --- prices (PLACEHOLDERS — pass live values) -------------------------------
const GAS_PRICE_GWEI = num("gas-price", 0.1); // Arbitrum Sepolia L2 gas price
const ETH_USD = num("eth", 3000);
const L3_GAS_PRICE_GWEI = num("l3-gas-price", 0.01); // projected AnyTrust L3

// If real total gas was measured on-chain, prefer it over the model.
const singleMeasuredTotal = args["single-gas"] ? Number(args["single-gas"]) : null;
const batchMeasuredTotal = args["batch-gas"] ? Number(args["batch-gas"]) : null;

const usd = (gas, gwei = GAS_PRICE_GWEI) => (gas * gwei * ETH_USD) / 1e9;
const fmtGas = (g) => Math.round(g).toLocaleString("en-US");
const fmtUsd = (u) => (u < 0.01 ? `$${u.toExponential(2)}` : `$${u.toFixed(4)}`);

// per-action gas for each strategy
const plainGas = singleMeasuredTotal ?? INTRINSIC + SINGLE_EXEC + CALLDATA_ANCHOR;
const batchGas =
  (batchMeasuredTotal ?? INTRINSIC + N * (BATCH_EXEC_PER + CALLDATA_ROOT)) / N;
const l3Gas = BATCH_EXEC_PER; // SSTORE only; DA ~0 via DAC

const rows = [
  ["Plain anchor (1 root / tx)", plainGas, usd(plainGas)],
  [`Batched anchorBatch (${N} roots / tx)`, batchGas, usd(batchGas)],
  ["Projected AnyTrust L3 (DAC, DA≈0)", l3Gas, usd(l3Gas, L3_GAS_PRICE_GWEI)],
];

const src = singleMeasuredTotal || batchMeasuredTotal ? "measured on-chain" : "modeled from forge execution gas";
console.log(`\nHero anchoring cost per action  (${src})`);
console.log(`gas price ${GAS_PRICE_GWEI} gwei · ETH $${ETH_USD} · L3 @ ${L3_GAS_PRICE_GWEI} gwei\n`);
console.log("| Strategy | Gas / action | USD / action |");
console.log("|---|--:|--:|");
for (const [label, gas, u] of rows) {
  console.log(`| ${label} | ${fmtGas(gas)} | ${fmtUsd(u)} |`);
}
const save = ((plainGas - batchGas) / plainGas) * 100;
console.log(`\nBatching cuts per-action gas ${save.toFixed(0)}% vs plain (amortized 21k intrinsic + calldata over ${N}).`);
console.log("Note: on Arbitrum the L1 data component is folded into on-chain gasUsed — the");
console.log("measured Sepolia receipt is authoritative; the model above is a pre-deploy preview.\n");
