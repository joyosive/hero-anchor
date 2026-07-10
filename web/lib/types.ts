// Shared types for the Hero confidential proof-of-action demo.

export interface RecordStep {
  step: string;
  fields: Record<string, string>;
}

export interface LedgerEntry {
  seq: number;
  within: boolean | null; // true = within authority, false = over, null = sealed (live, pre-unseal)
  root: string;
  tx: string;
}

export interface GrantResult {
  ok: boolean;
  handle: string;
}

export interface ActResult {
  within: boolean | null;
  root: string;
  sequence: number;
  anchored: boolean;
  tx: string;
}

export interface RevealResult {
  remainingClear: number | null;
}

export interface WithinResult {
  within: boolean | null;
}

export interface RevokeResult {
  ok: boolean;
}

export interface VerifyResult {
  anchored: boolean;
  timestamp: number;
  submitter: string | null;
}

/**
 * The engine boundary. simEngine (default) keeps the true numbers in its own
 * closure; liveEngine talks to the deployed ConfidentialAuthority via ethers +
 * cofhejs. The UI is engine-agnostic.
 */
export interface Engine {
  grant(agentId: string, limit: number): Promise<GrantResult>;
  act(agentId: string, amount: number, root: string): Promise<ActResult>;
  reveal(agentId: string): Promise<RevealResult>;
  revealWithin(root: string): Promise<WithinResult>;
  revoke(agentId: string): Promise<RevokeResult>;
  verify(root: string): Promise<VerifyResult>;
}

// ---- view state (owned by useHero, rendered by components) ----

export type Mode = "sim" | "live" | "local";

export interface LogLine {
  t: string;
  msg: string;
  cls?: string;
}

export interface PubState {
  anchored: boolean;
  root: string;
  meta: string;
  tx: string;
}

export interface NetState {
  account: string | null;
  chainOk: boolean;
}

export interface HeroView {
  mode: Mode;
  granted: boolean;
  revoked: boolean;
  running: boolean;
  record: RecordStep[];
  recordRoot: string;
  amount: number;
  limit: number;
  agentName: string;
  ledger: LedgerEntry[];
  beat: number;
  privHandle: string;
  privClear: string | null;
  meterOn: number; // 0..10 filled meter segments; only truthful after reveal
  pub: PubState;
  log: LogLine[];
  net: NetState;
  caAddress: string;
}
