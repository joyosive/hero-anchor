// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {CofheTest}   from "@cofhe/foundry-plugin/contracts/CofheTest.sol";
import {CofheClient} from "@cofhe/foundry-plugin/contracts/CofheClient.sol";
import {InEuint32}   from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import {HeroProofAnchor}       from "../src/HeroProofAnchor.sol";
import {ConfidentialAuthority} from "../src/ConfidentialAuthority.sol";

contract ConfidentialAuthorityTest is CofheTest {
    HeroProofAnchor       internal anchor;
    ConfidentialAuthority internal ca;
    CofheClient           internal op;

    uint256 internal constant OP_PKEY = 0xA11CE;
    bytes32 internal constant AGENT = keccak256("agent-1");

    function setUp() public {
        deployMocks();
        op = createCofheClient();
        op.connect(OP_PKEY);

        anchor = new HeroProofAnchor();
        ca = new ConfidentialAuthority(anchor);
    }

    function _grant(uint32 limit) internal {
        InEuint32 memory inLimit = op.createInEuint32(limit);
        vm.prank(op.account());
        ca.grantAuthority(AGENT, inLimit);
    }

    function _act(uint32 amount, bytes32 root) internal {
        InEuint32 memory inAmt = op.createInEuint32(amount);
        vm.prank(op.account());
        ca.act(AGENT, inAmt, root);
    }

    function test_grant_sets_encrypted_authority() public {
        _grant(1000);
        expectPlaintext(ca.remainingAuthority(op.account(), AGENT), uint32(1000));
    }

    function test_within_authority_decrements_privately_and_anchors() public {
        _grant(1000);
        bytes32 root = keccak256("action-within");
        _act(300, root);

        // remaining decremented on ciphertext, never publicly revealed
        expectPlaintext(ca.remainingAuthority(op.account(), AGENT), uint32(700));
        // encrypted compliance flag says "within authority"
        expectPlaintext(ca.wasWithinAuthority(root), true);
        // public proof was anchored on Arbitrum
        (bool anchored,,) = ca.verifyAction(root);
        assertTrue(anchored);
    }

    function test_over_authority_is_noop_but_still_anchored() public {
        _grant(1000);
        bytes32 root = keccak256("action-over");
        _act(5000, root);

        // budget unchanged — branchless no-op, no revert, no leak
        expectPlaintext(ca.remainingAuthority(op.account(), AGENT), uint32(1000));
        // compliance flag says "outside authority"
        expectPlaintext(ca.wasWithinAuthority(root), false);
        // the action is still recorded as having happened
        (bool anchored,,) = ca.verifyAction(root);
        assertTrue(anchored);
    }

    function test_multiple_actions_accumulate() public {
        _grant(1000);
        _act(200, keccak256("a1"));
        _act(300, keccak256("a2"));
        expectPlaintext(ca.remainingAuthority(op.account(), AGENT), uint32(500));

        (, uint64 count) = ca.agentInfo(op.account(), AGENT);
        assertEq(count, 2);
    }

    function test_revoke_zeroes_authority() public {
        _grant(1000);
        vm.prank(op.account());
        ca.revokeAuthority(AGENT);
        expectPlaintext(ca.remainingAuthority(op.account(), AGENT), uint32(0));
    }

    // --------------------------------------------------------------- authorization

    /// A non-operator cannot act for someone else's agent (fixes: "anyone can act").
    function test_only_operator_can_act() public {
        _grant(1000);
        InEuint32 memory inAmt = op.createInEuint32(100);
        address bob = address(0xB0B);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(ConfidentialAuthority.AgentUnknown.selector, AGENT));
        ca.act(AGENT, inAmt, keccak256("bob-forged-action"));
    }

    /// A non-operator cannot revoke someone else's agent.
    function test_only_operator_can_revoke() public {
        _grant(1000);
        address bob = address(0xB0B);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(ConfidentialAuthority.AgentUnknown.selector, AGENT));
        ca.revokeAuthority(AGENT);
    }

    /// Two operators can use the same agentId label without collision (fixes: squatting).
    function test_agent_ids_are_operator_scoped() public {
        _grant(1000); // op grants AGENT

        CofheClient bob = createCofheClient();
        bob.connect(0xB0B);
        InEuint32 memory bl = bob.createInEuint32(500);
        vm.prank(bob.account());
        ca.grantAuthority(AGENT, bl); // same label, different operator — must succeed

        expectPlaintext(ca.remainingAuthority(op.account(), AGENT), uint32(1000));
        expectPlaintext(ca.remainingAuthority(bob.account(), AGENT), uint32(500));
    }

    /// An attacker pre-anchoring the proofRoot must NOT be able to block the
    /// operator's action (griefing DoS via the permissionless anchor).
    function test_act_survives_frontrun_preanchor() public {
        _grant(1000);
        bytes32 root = keccak256("frontrun-target");

        // attacker pre-anchors the root directly on the neutral anchor
        vm.prank(address(0xBAD));
        anchor.anchor(root);

        // the operator's action must still succeed (not revert) and record
        // the confidential state — the pre-anchor does not block it
        _act(300, root);

        expectPlaintext(ca.remainingAuthority(op.account(), AGENT), uint32(700));
        expectPlaintext(ca.wasWithinAuthority(root), true);
        (, uint64 count) = ca.agentInfo(op.account(), AGENT);
        assertEq(count, 1);
        (bool anchored,,) = ca.verifyAction(root);
        assertTrue(anchored);
    }
}
