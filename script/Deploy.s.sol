// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Script.sol";
import {IHeroProofAnchor} from "../src/IHeroProofAnchor.sol";
import {HeroProofAnchor} from "../src/HeroProofAnchor.sol";
import {ConfidentialAuthority} from "../src/ConfidentialAuthority.sol";

/// @notice Deploys ConfidentialAuthority (Solidity, Fhenix CoFHE) against the
///         neutral anchor. The production anchor is the Rust/Stylus contract,
///         deployed separately with `cargo stylus deploy`: pass its address in
///         ANCHOR_ADDRESS. If ANCHOR_ADDRESS is unset (local anvil, where the
///         Stylus runtime is unavailable), the Solidity reference anchor is
///         deployed first so the stack still runs end to end.
contract Deploy is Script {
    function run() external {
        address anchorAddr = vm.envOr("ANCHOR_ADDRESS", address(0));

        vm.startBroadcast();
        if (anchorAddr == address(0)) {
            anchorAddr = address(new HeroProofAnchor());
        }
        ConfidentialAuthority ca = new ConfidentialAuthority(IHeroProofAnchor(anchorAddr));
        vm.stopBroadcast();

        console.log("anchor (Rust/Stylus on Sepolia, or local reference):", anchorAddr);
        console.log("ConfidentialAuthority deployed at:", address(ca));
    }
}
