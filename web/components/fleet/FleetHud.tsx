"use client";

import type { FleetView } from "@/lib/fleet/types";
import type { FleetActions } from "@/lib/fleet/useFleet";
import { Btn } from "../ui";
import { CipherText } from "../motion/CipherText";
import { Decrypt } from "../motion/Decrypt";

const short = (h: string) => (h.length > 18 ? `${h.slice(0, 10)}…${h.slice(-6)}` : h);

export function FleetHud({ view, actions }: { view: FleetView; actions: FleetActions }) {
  const within = view.ledger.filter((r) => r.within === true).length;
  const over = view.ledger.filter((r) => r.within === false).length;

  return (
    <div className="pointer-events-none absolute inset-0 p-5">
      <div className="pointer-events-auto flex max-h-full w-[380px] max-w-[92vw] flex-col gap-3 overflow-auto rounded-[14px] border border-line bg-[rgba(10,11,9,0.86)] p-4 backdrop-blur">
        {/* header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[2.4px] text-acid">FLEET COMPLIANCE · LIVE</div>
            <div className="mt-0.5 max-w-[260px] font-mono text-[10px] leading-[1.4] text-muted">
              Each robot proves it acted within its encrypted authority. Anchored on Arbitrum; the authority and action
              stay private.
            </div>
          </div>
          <span className="font-mono text-[10px] text-dim">step {view.step}</span>
        </div>

        {/* controls */}
        <div className="flex flex-wrap gap-2">
          {view.running ? (
            <Btn variant="danger" onClick={actions.stop}>Stop</Btn>
          ) : (
            <Btn variant="solid" onClick={actions.run}>▶ Run shift</Btn>
          )}
          <Btn variant="ghost" onClick={actions.step} disabled={view.running}>Step</Btn>
          <Btn variant="ghost" onClick={actions.reset}>Reset</Btn>
        </div>

        {/* current status - always visible near the top, so it isn't buried in
            the console at the bottom of the scrolling panel */}
        {view.log.length > 0 &&
          (() => {
            const last = view.log[view.log.length - 1];
            const cls =
              last.cls === "ok"
                ? "text-acid"
                : last.cls === "err"
                  ? "text-err"
                  : last.cls === "pending"
                    ? "text-cyan"
                    : "text-white";
            return (
              <div className="rounded-lg border border-line2 bg-panel2 px-2.5 py-2 font-mono text-[10.5px] leading-[1.5]">
                <span className="mr-1.5 uppercase tracking-wide text-dim">status</span>
                <span className={cls}>{last.msg}</span>
              </div>
            );
          })()}

        {/* on-chain toggle */}
        <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wide text-muted">
          <input
            type="checkbox"
            checked={view.onChain}
            disabled={view.running}
            onChange={(e) => actions.setOnChain(e.target.checked)}
            className="accent-[#AAFF00]"
          />
          ⛓ On-chain {view.onChain && <span className="text-acid">· {view.chainLabel} · real anchor tx per action</span>}
        </label>

        {/* stats */}
        <div className="flex gap-4 font-mono text-[11px]">
          <span className="text-muted">anchored <b className="text-white">{view.ledger.length}</b></span>
          <span className="text-acid">within {within}</span>
          <span className="text-amber">over {over}</span>
        </div>

        {/* legend */}
        <div className="font-mono text-[9px] uppercase tracking-wide text-dim">
          glow = acting · beam = proof anchored · ✓ within · ⊘ over
        </div>

        {/* over-spend callout */}
        {view.ledger.some((r) => r.within === false) && (
          <div className="rounded-lg border border-line2 bg-panel2 px-2.5 py-2 font-mono text-[10.5px] leading-[1.5] text-amber">
            ⚠ A robot exceeded its authority - the action is still proven and anchored, its budget is untouched, and
            nothing leaked. That&apos;s the moat.
          </div>
        )}

        {/* robots */}
        <div className="flex flex-col gap-1.5">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-wide text-cyan">Encrypted · operator-only</div>
            <div className="font-mono text-[9px] text-dim">only the operator can unseal a budget</div>
          </div>
          {view.robots.map((r) => (
            <div key={r.id} className="rounded-lg border border-line2 bg-panel2 p-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-mono text-[12px]" style={{ color: r.color }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                  {r.name}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wide text-dim">
                  {r.lastWithin === null ? "idle" : r.lastWithin ? "within ✓" : "over ⊘"}
                </span>
              </div>
              <div className="mt-1.5 font-mono text-[9px] uppercase tracking-wide text-dim">encrypted budget</div>
              <CipherText value={r.budgetHandle} className="block break-all font-mono text-[10.5px] text-cyan" />
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <Decrypt
                  value={r.budgetClear != null ? String(r.budgetClear) : null}
                  sealedClassName="font-mono text-[11px] tracking-wide text-dim"
                  clearClassName="font-mono text-[15px] font-semibold text-acid"
                />
                <Btn variant="ghost" className="!px-2.5 !py-1.5 !text-[10px]" onClick={() => actions.revealRobot(r.id)}>
                  Reveal
                </Btn>
              </div>
            </div>
          ))}
        </div>

        {/* recent proofs */}
        <div className="rounded-lg border border-line2">
          <div className="border-b border-line2 bg-panel2 px-2.5 py-1.5">
            <div className="font-mono text-[9px] uppercase tracking-wide text-acid">Public · verifiable</div>
            <div className="font-mono text-[9px] text-dim">anyone can verify these on-chain</div>
          </div>
          <div className="max-h-[120px] overflow-auto">
            {view.ledger.length === 0 ? (
              <div className="px-2.5 py-2 font-mono text-[10.5px] text-dim">no actions yet</div>
            ) : (
              view.ledger.slice(-8).reverse().map((row, i) => {
                const href = view.explorer && row.tx ? `${view.explorer}/tx/${row.tx}` : null;
                return (
                  <div key={i} className="grid grid-cols-[70px_1fr_28px] gap-2 px-2.5 py-1.5 font-mono text-[10.5px]">
                    <span className="text-muted">{row.robotId}·{row.seq + 1}</span>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-cyan underline decoration-dotted underline-offset-2"
                        title="View this anchor on Arbiscan"
                      >
                        {short(row.root)} ↗
                      </a>
                    ) : (
                      <span className="break-all text-cyan">{short(row.root)}</span>
                    )}
                    <span className={row.within ? "text-acid" : "text-amber"}>{row.within ? "✓" : "⊘"}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* console */}
        <div className="max-h-[120px] overflow-auto rounded-lg border border-line bg-[#070806] p-2.5 font-mono text-[10.5px] leading-[1.6]">
          {view.log.map((ln, i) => (
            <div
              key={i}
              className={`break-all ${
                ln.cls === "ok" ? "text-acid" : ln.cls === "err" ? "text-err" : ln.cls === "pending" ? "text-cyan" : "text-muted"
              }`}
            >
              {ln.t && <span className="mr-1.5 text-dim">{ln.t}</span>}
              {ln.msg}
            </div>
          ))}
        </div>

        <div className="font-mono text-[9px] leading-[1.5] text-dim">
          Simulated attestation - an L2 stand-in for a TEE quote (roadmap). With <b className="text-white">On-chain</b>,
          each action anchors a REAL tx on <b className="text-white">{view.chainLabel}</b>
          {view.explorer && <> (verify every anchor on Arbiscan)</>}; the encrypted-authority check stays simulated
          (CoFHE is not in this anchor path). Only the operator can unseal a budget.
        </div>
      </div>
    </div>
  );
}
