// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/HeroProofAnchor.sol";

contract HeroProofAnchorTest is Test {
    HeroProofAnchor anchorContract;
    bytes32 constant ROOT = keccak256("proof-of-action-root");

    function setUp() public {
        anchorContract = new HeroProofAnchor();
    }

    function test_AnchorAndVerify() public {
        anchorContract.anchor(ROOT);
        (bool anchored, uint64 ts, address who) = anchorContract.verify(ROOT);
        assertTrue(anchored);
        assertEq(who, address(this));
        assertEq(ts, uint64(block.timestamp));
    }

    function test_UnknownRootIsNotAnchored() public view {
        (bool anchored,,) = anchorContract.verify(keccak256("never-seen"));
        assertFalse(anchored);
    }

    function test_CannotAnchorTwice() public {
        anchorContract.anchor(ROOT);
        vm.expectRevert(abi.encodeWithSelector(HeroProofAnchor.AlreadyAnchored.selector, ROOT));
        anchorContract.anchor(ROOT);
    }

    function test_EmitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit HeroProofAnchor.ProofAnchored(ROOT, address(this), uint64(block.timestamp));
        anchorContract.anchor(ROOT);
    }

    function test_AnchorBatch() public {
        bytes32[] memory roots = new bytes32[](3);
        roots[0] = keccak256("a");
        roots[1] = keccak256("b");
        roots[2] = keccak256("c");
        anchorContract.anchorBatch(roots);
        for (uint256 i = 0; i < roots.length; i++) {
            (bool anchored,,) = anchorContract.verify(roots[i]);
            assertTrue(anchored);
        }
    }

    function test_BatchRevertsOnDuplicate() public {
        bytes32[] memory roots = new bytes32[](2);
        roots[0] = keccak256("dup");
        roots[1] = keccak256("dup");
        vm.expectRevert(abi.encodeWithSelector(HeroProofAnchor.AlreadyAnchored.selector, roots[1]));
        anchorContract.anchorBatch(roots);
    }

    function testFuzz_AnchorAnyRoot(bytes32 root) public {
        anchorContract.anchor(root);
        (bool anchored,,) = anchorContract.verify(root);
        assertTrue(anchored);
    }
}
