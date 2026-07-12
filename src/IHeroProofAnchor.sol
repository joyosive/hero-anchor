// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IHeroProofAnchor
/// @notice ABI of the neutral "Proof of Action" anchor. The production anchor
///         is a Rust contract on Arbitrum Stylus (see the `anchor/` crate); the
///         Solidity `HeroProofAnchor` is a reference implementation used for
///         Foundry tests and local anvil. Both expose exactly this ABI, so
///         ConfidentialAuthority composes with either one, Rust or Solidity.
interface IHeroProofAnchor {
    function anchor(bytes32 proofRoot) external;

    function anchorBatch(bytes32[] calldata proofRoots) external;

    function verify(bytes32 proofRoot)
        external
        view
        returns (bool anchored, uint64 timestamp, address submitter);
}
