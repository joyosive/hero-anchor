"use client";

import type { HeroView } from "@/lib/types";
import { EXPLORER } from "@/lib/constants";

const short = (h: string) => (h.length > 18 ? `${h.slice(0, 10)}…${h.slice(-6)}` : h);

function verdict(within: boolean | null) {
  if (within === true) return <span className="text-acid">within ✓</span>;
  if (within === false) return <span className="text-amber">over ⊘</span>;
  return <span className="text-dim">🔒 sealed</span>;
}

function anchorCell(tx: string, mode: string) {
  if (!tx) return <span className="text-muted">—</span>;
  if (mode === "live")
    return (
      <a target="_blank" rel="noopener noreferrer" href={`${EXPLORER}/tx/${tx}`}>
        arbiscan ↗
      </a>
    );
  if (mode === "local") return <span className="text-cyan">local ✓</span>;
  return <span className="text-muted">sim</span>;
}

const cols = "grid grid-cols-[44px_1fr_140px_84px] gap-2.5 px-3.5 py-2.5";

export function Ledger({ view }: { view: HeroView }) {
  return (
    <div className="mb-4 overflow-hidden rounded-[10px] border border-line2">
      <div className={`${cols} border-b border-line2 bg-panel2 font-mono text-[9.5px] uppercase tracking-[1.4px] text-dim`}>
        <span>#</span>
        <span>proof root</span>
        <span>verdict</span>
        <span>anchor</span>
      </div>
      {view.ledger.length === 0 ? (
        <div className="px-3.5 py-4 font-mono text-[11.5px] text-dim">
          No actions yet — encrypted budget is untouched.
        </div>
      ) : (
        view.ledger.map((e) => (
          <div key={e.seq} className={`${cols} border-b border-line2 font-mono text-[11.5px] last:border-b-0`}>
            <span className="text-muted">{e.seq}</span>
            <span className="break-all text-cyan">{short(e.root)}</span>
            <span>{verdict(e.within)}</span>
            <span>{anchorCell(e.tx, view.mode)}</span>
          </div>
        ))
      )}
    </div>
  );
}
