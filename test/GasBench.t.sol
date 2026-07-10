// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Test.sol";
import "../src/HeroProofAnchor.sol";

/// @notice Measured gas for the two anchoring paths, so the cost story is
///         measured, not asserted.
///
///         These are EXECUTION gas numbers — they exclude the 21,000 intrinsic
///         tx cost, calldata, and any L2 data fee. That's deliberate: execution
///         gas is the part batching does NOT change (each anchored root is one
///         cold SSTORE either way). The batching win comes from amortizing the
///         21k intrinsic + calldata across N roots, which offchain/gas-table.mjs
///         models. The real end-to-end per-tx cost is measured on Sepolia after
///         deploy (a real `anchor` / `anchorBatch` tx receipt), which folds in
///         intrinsic, calldata, and Arbitrum's L1 data component.
///
///         Run: forge test --match-contract GasBench -vv
contract GasBenchTest is Test {
    HeroProofAnchor anchor;

    function setUp() public {
        anchor = new HeroProofAnchor();
        // warm the contract address so the measurement below reflects the
        // SSTORE + event, not a one-off cold-account access charge.
        anchor.anchor(keccak256("warmup"));
    }

    /// Execution gas for a single anchor() into a fresh (cold) slot.
    function test_gas_singleAnchor() public {
        bytes32 root = keccak256("single-root");
        uint256 g0 = gasleft();
        anchor.anchor(root);
        uint256 used = g0 - gasleft();
        emit log_named_uint("anchor() execution gas", used);
        // one cold SSTORE + one event, comfortably under 80k
        assertLt(used, 80_000);
    }

    /// Execution gas per anchor when batched via anchorBatch(N).
    function test_gas_batchPerAnchor() public {
        uint256 n = 20;
        bytes32[] memory roots = new bytes32[](n);
        for (uint256 i = 0; i < n; i++) roots[i] = keccak256(abi.encode("batch-root", i));

        uint256 g0 = gasleft();
        anchor.anchorBatch(roots);
        uint256 used = g0 - gasleft();
        uint256 perAnchor = used / n;

        emit log_named_uint("anchorBatch(20) total execution gas", used);
        emit log_named_uint("anchorBatch execution gas per anchor", perAnchor);

        // Batching adds no per-item storage cost, so per-anchor execution gas
        // stays in the same band as a standalone anchor. The savings are in the
        // intrinsic/calldata amortization (see gas-table.mjs), not here.
        assertLt(perAnchor, 80_000);
    }
}
