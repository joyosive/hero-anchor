// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Script.sol";
import "../src/HeroProofAnchor.sol";
import "../src/ConfidentialAuthority.sol";

/// @notice Deploys the Hero V1 stack to Arbitrum Sepolia:
///         HeroProofAnchor (L3 neutral anchor) + ConfidentialAuthority (L3+ CoFHE moat).
contract Deploy is Script {
    function run() external {
        vm.startBroadcast();

        HeroProofAnchor anchor = new HeroProofAnchor();
        ConfidentialAuthority ca = new ConfidentialAuthority(anchor);

        vm.stopBroadcast();

        console.log("HeroProofAnchor       deployed at:", address(anchor));
        console.log("ConfidentialAuthority deployed at:", address(ca));
    }
}
