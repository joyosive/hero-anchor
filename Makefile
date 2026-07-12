-include .env
export

RPC ?= $(RPC_URL)
STYLUS_RPC ?= https://sepolia-rollup.arbitrum.io/rpc

# Local chain (anvil). ANVIL_KEY is the well-known anvil account 0 - public, local only.
ANVIL_RPC ?= http://127.0.0.1:8545
ANVIL_KEY ?= 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

.PHONY: help install build test test-anchor gas deploy-anchor deploy verify-ca sync-sepolia anchor deploy-local clean

help:
	@echo "Hero: Rust/Stylus anchor + Solidity Fhenix authority (Arbitrum Sepolia)"
	@echo "  make install                       deps (forge-std + CoFHE packages)"
	@echo "  make build                         compile the Solidity contracts"
	@echo "  make test                          forge suite (authority, reference anchor, gas bench)"
	@echo "  make test-anchor                   the Rust/Stylus anchor tests (cargo + TestVM)"
	@echo "  make deploy-anchor                 deploy the Rust anchor to Arbitrum Sepolia (prints its address)"
	@echo "  make deploy ANCHOR_ADDRESS=0x...   deploy ConfidentialAuthority against that anchor + sync web/"
	@echo "  make verify-ca ADDRESS=0x... ANCHOR_ADDRESS=0x...  verify the CA on Arbiscan"
	@echo "  make anchor ADDRESS=0x... ROOT=0x...               anchor a root via cast"

install:
	forge install foundry-rs/forge-std
	npm install -D @cofhe/foundry-plugin@0.6.0 @cofhe/mock-contracts@0.6.0 @fhenixprotocol/cofhe-contracts@0.1.4 @openzeppelin/contracts

build:
	forge build

test:
	forge test -vv

# The production anchor is Rust on Arbitrum Stylus; it has its own suite.
test-anchor:
	cd anchor && cargo test --features stylus-test

# Gas of the Solidity reference anchor. The Rust/Stylus gas is measured on-chain.
gas:
	forge test --match-contract GasBench -vv
	@node offchain/gas-table.mjs $(GAS_ARGS)

# 1) Deploy the production anchor: Rust on Arbitrum Stylus. Note the printed
#    "deployed code at address: 0x..." and pass it as ANCHOR_ADDRESS below.
deploy-anchor:
	cd anchor && cargo stylus deploy -e $(STYLUS_RPC) --private-key $(PRIVATE_KEY) --no-verify --max-fee-per-gas-gwei 1

# 2) Deploy ConfidentialAuthority (Solidity, Fhenix CoFHE) against the anchor,
#    then sync addresses into the web app. ANCHOR_ADDRESS is required, so the
#    authority can never silently target the wrong anchor.
deploy:
	ANCHOR_ADDRESS=$(ANCHOR_ADDRESS) forge script script/Deploy.s.sol \
		--rpc-url $(RPC) --private-key $(PRIVATE_KEY) --broadcast
	@node offchain/sync-deployment.mjs

# Re-sync web/lib/deployed.sepolia.json from the last broadcast + ANCHOR_ADDRESS.
sync-sepolia:
	@node offchain/sync-deployment.mjs

# Verify the Solidity ConfidentialAuthority on Arbiscan. The Rust anchor is a
# Stylus contract; source-verify it with `cargo stylus verify` once the 0.10.8
# reproducible-build image is published to Docker Hub.
verify-ca:
	forge verify-contract $(ADDRESS) src/ConfidentialAuthority.sol:ConfidentialAuthority \
		--chain 421614 --etherscan-api-key $(ETHERSCAN_API_KEY) \
		--constructor-args $$(cast abi-encode "constructor(address)" $(ANCHOR_ADDRESS)) --watch

anchor:
	cast send $(ADDRESS) "anchor(bytes32)" $(ROOT) --rpc-url $(RPC) --private-key $(PRIVATE_KEY)

# Local anvil: deploy the Solidity reference anchor (Stylus cannot run in anvil).
deploy-local:
	@addr=$$(forge create src/HeroProofAnchor.sol:HeroProofAnchor \
		--rpc-url $(ANVIL_RPC) --private-key $(ANVIL_KEY) --broadcast --json \
		| node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>process.stdout.write(JSON.parse(s).deployedTo))") ; \
	node -e "const fs=require('fs');fs.writeFileSync('web/lib/deployed.local.json',JSON.stringify({anchor:'$$addr',chainId:31337,rpc:'$(ANVIL_RPC)'},null,2)+'\n')" ; \
	echo "HeroProofAnchor (local reference) -> $$addr"

clean:
	forge clean
