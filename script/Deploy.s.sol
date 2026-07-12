// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Script.sol";
import {IHeroProofAnchor} from "../src/IHeroProofAnchor.sol";
import {ConfidentialAuthority} from "../src/ConfidentialAuthority.sol";

/// @notice Deploys ConfidentialAuthority (Solidity, Fhenix CoFHE) against the
///         Rust/Stylus anchor. Deploy the anchor first with `cargo stylus deploy`,
///         then pass its address so the authority composes with the Rust anchor:
///         ANCHOR_ADDRESS=0x... forge script script/Deploy.s.sol --broadcast ...
///         ANCHOR_ADDRESS is required, so a run can never silently point the
///         authority at the wrong anchor.
contract Deploy is Script {
    function run() external {
        address anchorAddr = vm.envOr("ANCHOR_ADDRESS", address(0));
        require(
            anchorAddr != address(0),
            "ANCHOR_ADDRESS unset: pass the deployed Rust/Stylus anchor address"
        );

        vm.startBroadcast();
        ConfidentialAuthority ca = new ConfidentialAuthority(IHeroProofAnchor(anchorAddr));
        vm.stopBroadcast();

        console.log("anchor (Rust/Stylus):", anchorAddr);
        console.log("ConfidentialAuthority deployed at:", address(ca));
    }
}
