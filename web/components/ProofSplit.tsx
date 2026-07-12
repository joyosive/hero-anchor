"use client";

import type { HeroView } from "@/lib/types";
import { EXPLORER } from "@/lib/constants";
import { CipherText } from "./motion/CipherText";
import { Decrypt } from "./motion/Decrypt";
import { Btn } from "./ui";

const kLabel = "mb-1 font-mono text-[9px] uppercase tracking-[1px] text-dim";

function Meter({ on }: { on: number }) {
  return (
    <div className="my-2.5 flex gap-[3px]">
      {Array.from({ length: 10 }).map((_, i) => (
        <span
          key={i}
          className={`h-[7px] flex-1 rounded-[2px] ${
            i < on ? "bg-cyan shadow-[0_0_7px_rgba(34,211,238,.5)]" : "bg-[#1b1f16]"
          }`}
        />
      ))}
    </div>
  );
}

function txCell(tx: string, mode: string) {
  if (!tx) return <span className="text-muted">-</span>;
  const shortTx = `${tx.slice(0, 10)}…${tx.slice(-6)}`;
  if (mode === "live")
    return (
      <a target="_blank" rel="noopener noreferrer" href={`${EXPLORER}/tx/${tx}`}>
        {shortTx} ↗
      </a>
    );
  if (mode === "local") return <span className="text-cyan">local anvil · {shortTx}</span>;
  return <span className="text-muted">sim {shortTx}</span>;
}

export function ProofSplit({
  view,
  onReveal,
  onVerify,
}: {
  view: HeroView;
  onReveal: () => void;
  onVerify: () => void;
}) {
  const p = view.pub;
  return (
    <section className="rounded-[14px] border border-line bg-panel p-[22px]">
      <h2 className="mb-[3px] font-mono text-[11.5px] uppercase tracking-[2.6px] text-acid">The proof</h2>
      <p className="mb-[18px] text-[13.5px] text-muted">
        Same action, two truths: a public proof anyone can verify, and an encrypted state only the operator can open.
      </p>

      <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-line md:grid-cols-2">
        {/* PUBLIC */}
        <div className="border-b border-line bg-panel2 p-4 md:border-b-0 md:border-r">
          <div className="mb-3 flex items-center gap-[7px] font-mono text-[10px] uppercase tracking-[1.8px] text-acid">
            ◇ Public · verifiable
          </div>
          <div className="mb-[11px]">
            <div className={kLabel}>Anchored on Arbitrum</div>
            <div className="font-mono text-[12.5px]">
              {p.anchored ? <span className="text-acid">✓ anchored</span> : <span className="text-muted">awaiting first action</span>}
            </div>
          </div>
          <div className="mb-[11px]">
            <div className={kLabel}>Proof root</div>
            <CipherText value={p.root} className="break-all font-mono text-[11.5px] text-cyan" />
          </div>
          <div className="mb-[11px]">
            <div className={kLabel}>Record</div>
            <div className="font-mono text-[12.5px] text-white">{p.meta}</div>
          </div>
          <div className="mb-[11px]">
            <div className={kLabel}>Transaction</div>
            <div className="break-all font-mono text-[12.5px]">{txCell(p.tx, view.mode)}</div>
          </div>
          <Btn variant="ghost" className="mt-1.5" onClick={onVerify} disabled={view.ledger.length === 0}>
            Verify last proof
          </Btn>
        </div>

        {/* PRIVATE */}
        <div className="bg-[linear-gradient(180deg,rgba(34,211,238,.03),transparent)] p-4">
          <div className="mb-3 flex items-center gap-[7px] font-mono text-[10px] uppercase tracking-[1.8px] text-cyan">
            🔒 Private · encrypted
          </div>
          <div className="mb-[11px]">
            <div className={kLabel}>Remaining authority (ciphertext)</div>
            <CipherText value={view.privHandle} className="break-all font-mono text-[11.5px] text-cyan" />
          </div>
          <Meter on={view.meterOn} />
          <div className="mb-[11px] mt-3">
            <div className={kLabel}>Operator view (unsealed)</div>
            <Decrypt
              value={view.privClear}
              sealedClassName="font-mono text-[20px] tracking-[2px] text-dim"
              clearClassName="font-disp text-[30px] font-bold leading-none tracking-[-.5px] text-acid"
            />
          </div>
          <Btn variant="ghost" className="mt-2.5" onClick={onReveal} disabled={!view.granted}>
            Reveal - operator only
          </Btn>
        </div>
      </div>
    </section>
  );
}
