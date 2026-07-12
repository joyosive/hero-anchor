"use client";

import type { RecordStep } from "@/lib/types";

export function ActionRecord({
  record,
  recordRoot,
  onEdit,
}: {
  record: RecordStep[];
  recordRoot: string;
  onEdit: (stepIdx: number, key: string, val: string) => void;
}) {
  return (
    <div>
      <div className="mb-2.5 mt-[18px] font-mono text-[10px] uppercase tracking-[2px] text-dim">
        Action record - edit any field
      </div>
      {record.map((rec, i) => (
        <div key={rec.step} className="mb-2.5 rounded-[10px] border border-line2 bg-panel2 px-3.5 py-3">
          <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[2px] text-acid">{rec.step}</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(rec.fields).map(([key, val]) => (
              <label key={key} className="flex flex-col gap-[3px]">
                <span className="font-mono text-[9px] uppercase tracking-[1px] text-dim">
                  {key.replace(/_/g, " ")}
                </span>
                <input
                  value={val}
                  onChange={(e) => onEdit(i, key, e.target.value)}
                  spellCheck={false}
                  className="min-w-[74px] rounded-md border border-line2 bg-panel3 px-2 py-1.5 font-mono text-[12px] text-white outline-none focus:border-acid"
                  style={{ width: `${Math.max(8, val.length) + 2}ch` }}
                />
              </label>
            ))}
          </div>
        </div>
      ))}
      <div className="mt-3.5 border-t border-dashed border-line pt-3">
        <div className="flex justify-between font-mono text-[10px] uppercase tracking-[1.6px] text-muted">
          <span>Record hash (preview)</span>
          <span>computed in your browser</span>
        </div>
        <div className="mt-[7px] break-all font-mono text-[12.5px] leading-[1.55] text-cyan">{recordRoot}</div>
      </div>
    </div>
  );
}
