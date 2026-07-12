// L2 attested robot fleet - shared types. Zero external deps.

export interface Percept {
  robotId: string;
  sensors: Record<string, string>; // e.g. { distance:"1.2", zone:"A", allowedZone:"A" }
  t: number;
}

export interface Decision {
  action: "advance" | "hold";
  cost: number; // energy/movement cost of the action
  policyVersion: string;
  withinScope: boolean; // was the sensed zone allowed
}

export interface Action {
  actuator: string;
  result: string;
  cost: number;
}

export interface ExecRecord {
  robotId: string;
  percept: Percept;
  decision: Decision;
  action: Action;
  policyVersion: string;
  seq: number;
}

export interface Attestation {
  root: string; // keccak over the bound ExecRecord
  signer: string; // sim: fixed placeholder; real: TEE identity
  sig: string; // sim: deterministic hash; real: TEE quote
}

export interface CycleResult {
  execRecord: ExecRecord;
  attestation: Attestation;
  cost: number;
}

/** A robot's decision policy. Deterministic in sim; an LLM adapter could implement this later. */
export interface Brain {
  readonly policyVersion: string;
  decide(p: Percept): Decision;
}

export type RobotStatus = "idle" | "acting" | "anchored" | "blocked";

export interface RobotView {
  id: string;
  name: string;
  color: string;
  zone: "A" | "B" | "C";
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  status: RobotStatus;
  phase: "idle" | "acting";
  carrying: boolean;
  seq: number;
  lastWithin: boolean | null;
  budgetHandle: string; // ciphertext-looking display handle
  budgetClear: number | null; // only set after reveal
  justAnchored: boolean; // pulse trigger for ProofBeam
}

export interface FleetLedgerRow {
  robotId: string;
  seq: number;
  within: boolean | null;
  root: string;
  tx?: string; // anchor tx hash (on-chain modes); enables a block-explorer link
}

export interface FleetView {
  running: boolean;
  step: number;
  onChain: boolean; // when true, each action anchors a real tx on the target chain
  chainLabel: string; // "local anvil" | "Arbitrum Sepolia" - the armed on-chain target
  explorer: string | null; // block-explorer base (e.g. arbiscan); null when there's none (anvil/sim)
  robots: RobotView[];
  ledger: FleetLedgerRow[];
  log: { t: string; msg: string; cls?: string }[];
}
