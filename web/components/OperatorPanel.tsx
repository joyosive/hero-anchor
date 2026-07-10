"use client";

import type { HeroView } from "@/lib/types";
import { ActionRecord } from "./ActionRecord";
import { Btn } from "./ui";

const sectLabel = "mb-2.5 mt-5 font-mono text-[10px] uppercase tracking-[2px] text-dim";
const numLabel = "font-mono text-[9.5px] uppercase tracking-[1px] text-dim";
const numInput =
  "w-[120px] rounded-[7px] border border-line bg-panel3 px-2.5 py-2.5 font-mono text-[14px] text-white outline-none focus:border-acid";

export function OperatorPanel({
  view,
  onEdit,
  onLimit,
  onAgent,
  onGrant,
  onAmount,
  onAct,
  onOver,
  onRevoke,
}: {
  view: HeroView;
  onEdit: (i: number, k: string, v: string) => void;
  onLimit: (n: number) => void;
  onAgent: (s: string) => void;
  onGrant: () => void;
  onAmount: (n: number) => void;
  onAct: () => void;
  onOver: () => void;
  onRevoke: () => void;
}) {
  const g = view.granted;
  return (
    <section className="rounded-[14px] border border-line bg-panel p-[22px]">
      <h2 className="mb-[3px] font-mono text-[11.5px] uppercase tracking-[2.6px] text-acid">Operator &amp; agent</h2>
      <p className="mb-[18px] text-[13.5px] text-muted">
        Grant an encrypted budget, then let the agent act. The action record is the tamper-evidence; its hash is what
        anchors.
      </p>

      <ActionRecord record={view.record} recordRoot={view.recordRoot} onEdit={onEdit} />

      <div className={sectLabel}>Grant authority</div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-[5px]">
          <span className={numLabel}>Agent</span>
          <input
            value={view.agentName}
            onChange={(e) => onAgent(e.target.value)}
            spellCheck={false}
            className={numInput}
          />
        </label>
        <label className="flex flex-col gap-[5px]">
          <span className={numLabel}>Encrypted limit</span>
          <input
            type="number"
            min={1}
            value={view.limit}
            onChange={(e) => onLimit(Number(e.target.value))}
            className={numInput}
          />
        </label>
        <Btn variant="ghost" onClick={onGrant}>
          Grant
        </Btn>
      </div>

      <div className={sectLabel}>Agent acts</div>
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between font-mono text-[10px] uppercase tracking-[1px] text-dim">
          <span>Action amount (you know it; the chain won&apos;t)</span>
          <b className="font-semibold text-acid">{view.amount}</b>
        </div>
        <input
          type="range"
          min={0}
          max={Math.max(view.limit, 1)}
          step={10}
          value={Math.min(view.amount, Math.max(view.limit, 1))}
          onChange={(e) => onAmount(Number(e.target.value))}
          aria-label="Action amount"
        />
      </div>
      <div className="mt-3.5 flex flex-wrap gap-2.5">
        <Btn variant="solid" onClick={onAct} disabled={!g}>
          Act
        </Btn>
        <Btn variant="ghost" onClick={onOver} disabled={!g}>
          Over-spend
        </Btn>
        <Btn variant="danger" onClick={onRevoke} disabled={!g}>
          Revoke
        </Btn>
      </div>
    </section>
  );
}
