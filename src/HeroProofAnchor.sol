// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title HeroProofAnchor
/// @notice Minimal Level-3 anchoring contract for Hero "Proof of Action".
///         Off-chain, an autonomous system's activity is recorded as a
///         tamper-evident hash chain (Level 1). The resulting root is anchored
///         here so anyone can verify it later without trusting the operator.
///         No token. No admin keys. No upgradeability. Just neutral anchoring.
contract HeroProofAnchor {
    struct Anchor {
        uint64  timestamp;  // when the root was anchored (0 == not anchored)
        address submitter;  // who anchored it
    }

    mapping(bytes32 => Anchor) private _anchors;

    event ProofAnchored(bytes32 indexed proofRoot, address indexed submitter, uint64 timestamp);

    error AlreadyAnchored(bytes32 proofRoot);

    /// @notice Anchor a single proof root. Reverts if already present.
    function anchor(bytes32 proofRoot) public {
        if (_anchors[proofRoot].timestamp != 0) revert AlreadyAnchored(proofRoot);
        _anchors[proofRoot] = Anchor(uint64(block.timestamp), msg.sender);
        emit ProofAnchored(proofRoot, msg.sender, uint64(block.timestamp));
    }

    /// @notice Anchor many roots in one transaction (e.g. a batch of records).
    function anchorBatch(bytes32[] calldata proofRoots) external {
        for (uint256 i = 0; i < proofRoots.length; i++) {
            anchor(proofRoots[i]);
        }
    }

    /// @notice Verify whether a root has been anchored, and its record.
    function verify(bytes32 proofRoot)
        external
        view
        returns (bool anchored, uint64 timestamp, address submitter)
    {
        Anchor memory a = _anchors[proofRoot];
        return (a.timestamp != 0, a.timestamp, a.submitter);
    }
}
