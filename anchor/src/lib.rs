//! Hero Proof Anchor: neutral, permissionless anchoring for "Proof of Action".
//!
//! Off-chain, an autonomous system's activity is recorded as a tamper-evident
//! hash chain. The resulting 32-byte root is anchored here so anyone can verify
//! it later without trusting the operator. No token, no admin keys, no
//! upgradeability: a first-write-wins registry of roots, each stamped with the
//! block time and the submitter, plus a public read.
//!
//! Rust on Arbitrum Stylus. The Solidity ConfidentialAuthority calls this
//! contract through a minimal interface, so a Rust contract and a Solidity
//! contract compose on the same chain. The deployed ABI is identical to the
//! previous Solidity anchor, so nothing downstream has to change.

#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
extern crate alloc;

use alloc::vec::Vec;
use stylus_sdk::{
    alloy_primitives::{Address, B256, U64},
    alloy_sol_types::sol,
    prelude::*,
};

sol! {
    /// Emitted once, when a root is first anchored.
    event ProofAnchored(bytes32 indexed proofRoot, address indexed submitter, uint64 timestamp);

    /// A root can only be anchored once. Re-anchoring reverts with this.
    error AlreadyAnchored(bytes32 proofRoot);
}

/// Solidity-compatible error surface for this contract.
#[derive(SolidityError)]
pub enum AnchorError {
    AlreadyAnchored(AlreadyAnchored),
}

impl core::fmt::Debug for AnchorError {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        match self {
            AnchorError::AlreadyAnchored(_) => f.write_str("AlreadyAnchored"),
        }
    }
}

sol_storage! {
    #[entrypoint]
    pub struct HeroProofAnchor {
        /// proofRoot -> record. A zero timestamp means "not anchored".
        mapping(bytes32 => Record) anchors;
    }

    pub struct Record {
        uint64 timestamp;
        address submitter;
    }
}

#[public]
impl HeroProofAnchor {
    /// Anchor a single proof root. First write wins: anchoring a root that is
    /// already present reverts with AlreadyAnchored.
    pub fn anchor(&mut self, proof_root: B256) -> Result<(), AnchorError> {
        self.anchor_one(proof_root)
    }

    /// Anchor many roots in one transaction, e.g. a batch of records. Reverts
    /// (rolling the whole batch back) if any root is already anchored, which
    /// keeps batch and single-anchor semantics identical.
    pub fn anchor_batch(&mut self, proof_roots: Vec<B256>) -> Result<(), AnchorError> {
        for root in proof_roots {
            self.anchor_one(root)?;
        }
        Ok(())
    }

    /// Whether a root has been anchored, and its record. Neutral public read:
    /// returns (anchored, timestamp, submitter).
    pub fn verify(&self, proof_root: B256) -> (bool, u64, Address) {
        let record = self.anchors.getter(proof_root);
        let timestamp = record.timestamp.get().to::<u64>();
        let submitter = record.submitter.get();
        (timestamp != 0, timestamp, submitter)
    }
}

impl HeroProofAnchor {
    /// The single anchoring step, shared by `anchor` and `anchor_batch`.
    fn anchor_one(&mut self, proof_root: B256) -> Result<(), AnchorError> {
        if !self.anchors.getter(proof_root).timestamp.get().is_zero() {
            return Err(AnchorError::AlreadyAnchored(AlreadyAnchored {
                proofRoot: proof_root,
            }));
        }

        let now = self.vm().block_timestamp();
        let submitter = self.vm().msg_sender();

        let mut record = self.anchors.setter(proof_root);
        record.timestamp.set(U64::from(now));
        record.submitter.set(submitter);
        drop(record);

        self.vm().log(ProofAnchored {
            proofRoot: proof_root,
            submitter,
            timestamp: now,
        });
        Ok(())
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use alloc::vec;
    use stylus_sdk::testing::*;

    fn root(tag: &str) -> B256 {
        stylus_sdk::crypto::keccak(tag.as_bytes())
    }

    #[test]
    fn anchor_then_verify() {
        let vm = TestVM::default();
        vm.set_block_timestamp(1_700_000_000); // on Arbitrum, never zero
        let mut c = HeroProofAnchor::from(&vm);
        let r = root("action-1");

        let (anchored, ts, who) = c.verify(r);
        assert!(!anchored);
        assert_eq!(ts, 0);
        assert_eq!(who, Address::ZERO);

        c.anchor(r).unwrap();
        let (anchored, ts, who) = c.verify(r);
        assert!(anchored);
        assert_eq!(ts, vm.block_timestamp());
        assert_eq!(who, vm.msg_sender());
    }

    #[test]
    fn double_anchor_reverts() {
        let vm = TestVM::default();
        vm.set_block_timestamp(1_700_000_000);
        let mut c = HeroProofAnchor::from(&vm);
        let r = root("action-1");
        c.anchor(r).unwrap();
        assert!(c.anchor(r).is_err());
    }

    #[test]
    fn record_captures_caller_and_time() {
        let vm = TestVM::default();
        let mut c = HeroProofAnchor::from(&vm);
        let agent = Address::from([7u8; 20]);
        vm.set_sender(agent);
        vm.set_block_timestamp(1_700_000_000);

        let r = root("action-2");
        c.anchor(r).unwrap();
        let (anchored, ts, who) = c.verify(r);
        assert!(anchored);
        assert_eq!(ts, 1_700_000_000);
        assert_eq!(who, agent);
    }

    #[test]
    fn batch_anchors_every_root() {
        let vm = TestVM::default();
        vm.set_block_timestamp(1_700_000_000);
        let mut c = HeroProofAnchor::from(&vm);
        let (a, b, d) = (root("a"), root("b"), root("d"));
        c.anchor_batch(vec![a, b, d]).unwrap();
        assert!(c.verify(a).0);
        assert!(c.verify(b).0);
        assert!(c.verify(d).0);
    }

    #[test]
    fn batch_reverts_on_any_duplicate() {
        let vm = TestVM::default();
        vm.set_block_timestamp(1_700_000_000);
        let mut c = HeroProofAnchor::from(&vm);
        let a = root("a");
        c.anchor(a).unwrap();
        // a batch that re-anchors an existing root is refused wholesale
        assert!(c.anchor_batch(vec![root("fresh"), a]).is_err());
        // a duplicate within the same batch is also refused
        let mut c2 = HeroProofAnchor::from(&vm);
        assert!(c2.anchor_batch(vec![root("x"), root("x")]).is_err());
    }
}
