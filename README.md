# Hero Proof Anchor — Arbitrum testnet prototype

The smallest real thing that proves the Hero thesis on-chain: a contract that
anchors a **proof-of-action root** on Arbitrum so anyone can verify it without
trusting the operator. No token, no admin keys.

This maps to the trust ladder:

- **Level 1 (off-chain):** `offchain/anchor.mjs` turns an autonomous system's
  action log into a tamper-evident hash chain and produces a single root.
- **Level 3 (on-chain):** `src/HeroProofAnchor.sol` anchors that root on
  Arbitrum. `verify()` lets anyone check it later.

Everything below is the fastest path to seeing it live on Arbitrum Sepolia
(chain id **421614**).

---

## Route A — fastest, zero install (about 5 minutes)

Best for "is it alive" before committing to a toolchain. Browser only.

1. **Wallet + network.** Install MetaMask. Add Arbitrum Sepolia via
   [chainlist.org/chain/421614](https://chainlist.org/chain/421614) (one click),
   or manually:
   - Network name: Arbitrum Sepolia
   - RPC URL: `https://sepolia-rollup.arbitrum.io/rpc`
   - Chain ID: `421614`
   - Currency: ETH
   - Explorer: `https://sepolia.arbiscan.io`

2. **Get test ETH.** Use a faucet:
   - `https://www.alchemy.com/faucets/arbitrum-sepolia` (fastest, but wants a
     little mainnet history on your wallet)
   - `https://faucet.quicknode.com/arbitrum/sepolia` or
     `https://faucets.chain.link/arbitrum-sepolia` (connect wallet)

3. **Deploy.** Open [remix.ethereum.org](https://remix.ethereum.org), paste
   `src/HeroProofAnchor.sol`, compile (0.8.26), then in the Deploy tab set
   environment to **Injected Provider - MetaMask** (confirm it shows Arbitrum
   Sepolia) and click Deploy. Approve in MetaMask.

4. **Try it.** In Remix, call `anchor` with any 32-byte value, then `verify`
   with the same value. You'll see the timestamp and submitter come back. The
   transaction shows up on arbiscan within a second.

That's a working prototype: a proof anchored on Arbitrum, verifiable by anyone.

---

## Route B — the real repo (Foundry)

Best once you want tests, scripted deploys, and something the team iterates on.

```bash
# 1. install Foundry
curl -L https://foundry.paradigm.xyz | bash && foundryup

# 2. from this folder, install forge-std and build
forge install foundry-rs/forge-std
forge build

# 3. run the tests (all local, no network)
forge test -vv

# 4. deploy to Arbitrum Sepolia
cp .env.example .env        # then edit .env with a THROWAWAY test key
source .env
forge script script/Deploy.s.sol \
  --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast
```

The deploy prints the contract address. Put it in `.env` as `ANCHOR_ADDRESS`.

---

## Run the end-to-end flow

`offchain/anchor.mjs` builds an L1 root from a sample action log and (if env is
set) anchors it on-chain and verifies it.

```bash
npm install
node offchain/anchor.mjs           # offline: just prints the root + tamper demo
# with .env filled in (RPC_URL, PRIVATE_KEY, ANCHOR_ADDRESS):
source .env && node offchain/anchor.mjs   # anchors + verifies on Arbitrum Sepolia
```

You'll see the root change the moment any record in the log is altered. That is
the whole point of the anchor.

---

## What's in here

- `src/HeroProofAnchor.sol` — the anchoring contract (anchor, anchorBatch, verify)
- `test/HeroProofAnchor.t.sol` — Foundry tests
- `script/Deploy.s.sol` — deploy script
- `offchain/anchor.mjs` — L1 hash-chain + L3 anchor/verify demo
- `offchain/HeroProofAnchor.abi.json` — ABI (already compiled)

---

## When you're ready: Stylus (Rust)

This prototype is Solidity because it's the fastest way to stand something up.
The strategic V1 path is **Arbitrum Stylus**, which lets you write the same
contract in Rust (compiled to WASM, fully interoperable with Solidity), which
suits the team's Rust depth and is markedly cheaper for the hash-heavy work the
real proof layer does. Start there once the shape is settled:
`cargo stylus new`, then `cargo stylus deploy` to the same Arbitrum Sepolia RPC.
There's also a live Stylus grant pool worth applying to once you have a demo.

Keep Solidity for this throwaway prototype; move the production anchor to Stylus.

---

*Note: Arbitrum Sepolia inherits Ethereum's Sepolia, which has a planned
end-of-life around Q3 2026 with a successor testnet arriving alongside it.
Nothing to do now, just track it before mainnet.*

---

## The demo page (for Founder House)

`web/index.html` is a single self-contained page (Hero-branded) that does the
whole story live in a browser:

1. Shows an autonomous system's action log (authority, perceive, decide, act),
   fully editable.
2. Computes the proof root in the browser as you type.
3. **Connect wallet** (MetaMask), then **Anchor on Arbitrum** with one click.
4. **Verify proof** reads it back. Edit any field after anchoring and verify
   again to show the tamper-evidence: the altered proof is "not anchored."

To launch it:

1. Deploy `HeroProofAnchor.sol` once (Route A or B above) and copy the address.
2. Either paste the address into the page's **Setup** box, or hardcode it in
   `web/index.html` at `CONFIG.anchorAddress` so it's wired on load.
3. Host the single file anywhere static: drag it into Vercel/Netlify, push to
   GitHub Pages, or just open it locally with MetaMask installed.

That's the demoable moment: a machine acts, the proof forms, it anchors on
Arbitrum, and anyone in the room can verify it.

---

## Verify on Arbiscan + Makefile shortcuts

One Etherscan API key (from etherscan.io) now verifies on Arbiscan too, via the
v2 API. Set `ETHERSCAN_API_KEY` in `.env`, then:

```bash
make install        # forge-std
make test           # run tests
make deploy-verify  # deploy to Arbitrum Sepolia AND publish source on Arbiscan
```

`deploy-verify` deploys and verifies in one pass, so the contract's source and
the Read/Write tabs show up publicly on sepolia.arbiscan.io. To verify a
contract you already deployed:

```bash
make verify ADDRESS=0xyourContract
```

Other shortcuts: `make build`, `make deploy` (no verify),
`make anchor ADDRESS=0x.. ROOT=0x..`, `make help`.

Verifying matters for a trust product: an unverified contract asks people to
trust your bytecode blind. A verified one lets anyone read exactly what anchors
their proofs.

---

## Handoff docs

This repo carries its own context so it can be handed over cleanly:

- **`docs/ARCHITECTURE.md`** — what Hero is, the trust ladder, where this L3
  anchor sits, and the design choices (no token, no admin keys, Stylus later).
  Read this first.
- **`NEXT-STEPS.md`** — what's deliberately not done yet, as explicit todos:
  the Stylus migration, Merkle batching, security review, test and serialization
  gaps, and the guardrails to keep.
- **`.github/workflows/ci.yml`** — runs `forge build` and `forge test` on every
  push and pull request, so regressions show up in CI.

Framing for whoever picks this up: it's a working prototype with a complete
deploy path, not a finished foundation. The how is in this README; the why and
the todos are in the two docs above.
- **`CONTRIBUTING.md`** — setup, branch/PR convention, the guardrails, and a
  step-by-step "good first contribution: propose the Stylus version."
