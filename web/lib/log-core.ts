import { buildRoot } from "./hash";
import type { RecordStep } from "./types";

// Google Apps Script Web App endpoint for the Hero Worker community log. This is
// a NEW, standalone sheet, separate from every other Hero surface. Paste your
// deployed Apps Script /exec URL here after the setup steps in the README. Left
// empty, the page works fully and simply skips the capture POST.
export const SHEET_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbxib5Pyziz6WKfxWVKqjP6IjoHdw1Ehsmbxcb9BeNj6DTx1WXpBOlwy3ZBwS6_F-5lj/exec";

// Pragmatic email shape check. Validation only: the value is contact metadata
// and never enters a receipt, a record, or the exported JSON.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The builder hubs from the deck ("5+ builders across Rust School and Swarm
// Village logging verified tasks now").
export const HUBS = ["Rust School", "Swarm Village", "Other"] as const;

export const TASK_TYPES = [
  "Code",
  "Review",
  "Docs",
  "Design",
  "Community",
  "Robotics",
] as const;

export interface Task {
  hub: string;
  who: string;
  type: string;
  what: string;
  hours?: number;
}

export interface Receipt {
  root: string;
  rec: RecordStep;
  recordedAt: string;
}

/**
 * Tamper-evident record + receipt root for one logged task, computed with the
 * same keccak hash chain the anchor verifies. Edit any field and the root
 * changes. The email is deliberately not part of the record or the root.
 */
export function makeReceipt(task: Task, recordedAt: string): Receipt {
  const rec: RecordStep = {
    step: "worklog",
    fields: {
      hub: task.hub,
      who: task.who,
      type: task.type,
      what: task.what,
      hours: task.hours === undefined ? "" : String(task.hours),
      recordedAt,
    },
  };
  return { root: buildRoot([rec]), rec, recordedAt };
}

/**
 * The day's root over every task logged this session. The team anchors this one
 * root into HeroProofAnchor, so all tasks above become independently verifiable
 * from a single transaction.
 */
export function sessionRoot(recs: RecordStep[]): string {
  return buildRoot(recs);
}
