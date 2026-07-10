import type { FleetView } from "../fleet/types";

// Measured on Arbitrum Sepolia, 2026-07-09: 49,449 gas × 0.02 gwei per anchor.
export const MEASURED_FEE_ETH = 0.000000989;
export const EST_ETH_USD = 3000; // display estimate; labeled "est." in the UI

export type StageTone = "idle" | "ok" | "alert" | "done";
export interface StageCaption {
  text: string;
  tone: StageTone;
}

export function totalCostUsd(anchors: number): string {
  const usd = anchors * MEASURED_FEE_ETH * EST_ETH_USD;
  return usd < 0.01 ? `$${usd.toFixed(4)}` : `$${usd.toFixed(2)}`;
}

/**
 * Pure, state-driven stage narration. Returns a NEW caption only on a
 * transition between `prev` and `view`; null = keep showing the current one.
 * Driven by fleet state (never timers) so narration cannot desync from what
 * the room is watching.
 */
export function stageCaption(view: FleetView, prev: FleetView | null): StageCaption | null {
  const prevLedger = prev?.ledger.length ?? 0;
  const newRows = view.ledger.slice(prevLedger);
  const shiftJustEnded = prev?.running === true && !view.running && view.step >= 6;

  // priority: done > alert > first anchor > count > armed > idle
  if (shiftJustEnded) {
    const n = view.ledger.length;
    return {
      tone: "done",
      text: `SHIFT COMPLETE — ${n} ACTIONS, ALL ANCHORED ON ARBITRUM · TOTAL COST ${totalCostUsd(n)}`,
    };
  }

  if (newRows.some((r) => r.within === false)) {
    return {
      tone: "alert",
      text: "AUTHORITY EXCEEDED — action still proven · budget untouched · nothing leaked",
    };
  }

  if (newRows.length > 0 && prevLedger === 0) {
    return { tone: "ok", text: "FIRST ACTION ANCHORED ON ARBITRUM — a real transaction, verify it live" };
  }

  if (newRows.length > 0) {
    return { tone: "ok", text: `${view.ledger.length} ACTIONS · EVERY ONE A REAL TX ON ARBITRUM` };
  }

  if (view.running && prev?.running !== true) {
    return { tone: "ok", text: "FLEET ARMED — EVERY ACTION ANCHORS ON ARBITRUM" };
  }

  if (!view.running && view.ledger.length === 0 && (prev === null || prev.ledger.length > 0 || prev.running)) {
    return { tone: "idle", text: "PRESS SPACE — RUN THE SHIFT" };
  }

  return null;
}
