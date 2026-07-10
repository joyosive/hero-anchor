-include .env
export

RPC ?= $(RPC_URL)
ADDRESS ?= $(ANCHOR_ADDRESS)

# Local chain (anvil). ANVIL_KEY is the well-known anvil account 0 — public, local only.
ANVIL_RPC ?= http://127.0.0.1:8545
ANVIL_KEY ?= 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

.PHONY: help install build test gas deploy deploy-verify deploy-local verify anchor sync-sepolia clean

help:
	@echo "Hero Proof Anchor"
	@echo "  make install        install deps (forge-std + CoFHE packages)"
	@echo "  make build          compile"
	@echo "  make test           run tests"
	@echo "  make gas            measure anchor vs anchorBatch gas + print cost table"
	@echo "  make deploy         deploy to Arbitrum Sepolia"
	@echo "  make deploy-verify  deploy + verify on Arbiscan"
	@echo "  make verify ADDRESS=0x...           verify an existing deployment"
	@echo "  make anchor ADDRESS=0x... ROOT=0x... anchor a root via cast"

install:
	forge install foundry-rs/forge-std
	npm install -D @cofhe/foundry-plugin@0.6.0 @cofhe/mock-contracts@0.6.0 @fhenixprotocol/cofhe-contracts@0.1.4 @openzeppelin/contracts

build:
	forge build

test:
	forge test -vv

# Measure real execution gas, then render the per-action USD cost table.
# Pass live prices post-deploy: make gas GAS_ARGS="--gas-price 0.1 --eth 3000"
gas:
	forge test --match-contract GasBench -vv
	@node offchain/gas-table.mjs $(GAS_ARGS)

deploy:
	forge script script/Deploy.s.sol --rpc-url $(RPC) --private-key $(PRIVATE_KEY) --broadcast
	@node offchain/sync-deployment.mjs

deploy-verify:
	forge script script/Deploy.s.sol --rpc-url $(RPC) --private-key $(PRIVATE_KEY) --broadcast \
		--verify --etherscan-api-key $(ETHERSCAN_API_KEY)
	@node offchain/sync-deployment.mjs

# Re-sync web/lib/deployed.sepolia.json from the last broadcast (no redeploy).
sync-sepolia:
	@node offchain/sync-deployment.mjs

verify:
	forge verify-contract $(ADDRESS) src/HeroProofAnchor.sol:HeroProofAnchor \
		--chain 421614 --etherscan-api-key $(ETHERSCAN_API_KEY) --watch

anchor:
	cast send $(ADDRESS) "anchor(bytes32)" $(ROOT) --rpc-url $(RPC) --private-key $(PRIVATE_KEY)

deploy-local:
	@addr=$$(forge create src/HeroProofAnchor.sol:HeroProofAnchor \
		--rpc-url $(ANVIL_RPC) --private-key $(ANVIL_KEY) --broadcast --json \
		| node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>process.stdout.write(JSON.parse(s).deployedTo))") ; \
	node -e "const fs=require('fs');fs.writeFileSync('web/lib/deployed.local.json',JSON.stringify({anchor:'$$addr',chainId:31337,rpc:'$(ANVIL_RPC)'},null,2)+'\n')" ; \
	echo "HeroProofAnchor (local) -> $$addr"

clean:
	forge clean
