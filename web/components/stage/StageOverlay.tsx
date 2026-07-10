"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import type { FleetView } from "@/lib/fleet/types";
import type { FleetActions } from "@/lib/fleet/useFleet";
import { stageCaption, totalCostUsd, MEASURED_FEE_ETH, type StageCaption } from "@/lib/stage/captions";
import { EXPLORER } from "@/lib/constants";
import deployed from "@/lib/deployed.sepolia.json";

const short = (h: string) => (h.length > 14 ? `${h.slice(0, 8)}…${h.slice(-4)}` : h);

/**
 * Full-screen, self-narrating stage layer. Built for a non-technical presenter:
 * F = fullscreen, Space = run, R = reset. Captions are state-driven (they can't
 * desync from the 3D scene), the QR points the room at the LIVE contract page.
 */
export function StageOverlay({ view, actions }: { view: FleetView; actions: FleetActions }) {
  const [caption, setCaption] = useState<StageCaption>({ text: "PRESS SPACE — RUN THE SHIFT", tone: "idle" });
  const [qr, setQr] = useState<string | null>(null);
  const prevRef = useRef<FleetView | null>(null);
  const armedRef = useRef(false);

  // arm on-chain mode once (relayer on the hosted site, burner at the booth)
  useEffect(() => {
    if (!armedRef.current) {
      armedRef.current = true;
      void actions.setOnChain(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // state-driven narration — the caption bar carries the alert emphasis;
  // no full-screen effects (this is evidence infrastructure, not a game).
  useEffect(() => {
    const next = stageCaption(view, prevRef.current);
    prevRef.current = view;
    if (next) setCaption(next);
  }, [view]);

  // QR → live contract page on Arbiscan
  useEffect(() => {
    const anchor = (deployed as { anchor?: string | null }).anchor;
    if (!anchor) return;
    void QRCode.toDataURL(`${EXPLORER}/address/${anchor}`, {
      margin: 1,
      width: 220,
      color: { dark: "#0a0b09", light: "#AAFF00" },
    }).then(setQr);
  }, []);

  // presenter keys
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (!view.running) actions.run();
      } else if (e.key === "f" || e.key === "F") {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen();
      } else if (e.key === "r" || e.key === "R") {
        actions.reset();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view.running, actions]);

  const anchors = view.ledger.length;
  const over = view.ledger.filter((r) => r.within === false).length;
  const done = caption.tone === "done";
  const idle = !view.running && anchors === 0;

  return (
    <div className="pointer-events-none absolute inset-0 z-50 select-none">
      {/* scrim while the intro or completion card is up — the scene steps back */}
      {(done || idle) && <div className="absolute inset-0 bg-[rgba(6,7,5,0.68)]" />}

      {/* top bar — brand + live badge */}
      <div className="absolute left-0 right-0 top-0 flex flex-wrap items-start justify-between gap-3 p-[clamp(16px,3vw,32px)]">
        <div>
          <div className="font-mono text-[clamp(20px,2.4vw,28px)] font-bold uppercase tracking-[6px] text-acid">HERO</div>
          <div className="mt-1 font-mono text-[clamp(10px,1.1vw,13px)] uppercase tracking-[3px] text-muted">
            Trust infrastructure for physical AI
          </div>
          <a
            href="/"
            className="pointer-events-auto mt-2 inline-block font-mono text-[10px] uppercase tracking-[1.5px] text-dim hover:text-acid"
          >
            ← Back to overview
          </a>
        </div>
        <div className="rounded-lg border border-line bg-[rgba(10,11,9,0.85)] px-4 py-2 text-right">
          <div
            className={`font-mono text-[clamp(11px,1.2vw,13px)] uppercase tracking-[2px] ${view.onChain ? "text-acid" : "text-amber"}`}
          >
            {view.onChain ? `● LIVE · ${view.chainLabel}` : "○ SIMULATION"}
          </div>
          <div className="font-mono text-[10px] text-dim">every action = one on-chain anchor</div>
        </div>
      </div>

      {/* right rail — live proofs + cost + QR. Hidden below md: on a phone it
          would overlap the scene; the captions + cards carry the numbers there. */}
      <div className="absolute right-[clamp(12px,2.5vw,32px)] top-[clamp(96px,14vh,128px)] hidden w-[clamp(250px,26vw,340px)] flex-col gap-3 md:flex">
        <div className="rounded-xl border border-line bg-[rgba(10,11,9,0.85)] p-4">
          <div className="font-mono text-[11px] uppercase tracking-[2px] text-acid">Evidence · anyone can verify</div>
          <div className="mt-2 flex flex-col gap-1.5">
            {view.ledger.length === 0 ? (
              <div className="font-mono text-[13px] text-dim">awaiting first action…</div>
            ) : (
              view.ledger.slice(-4).reverse().map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-2 font-mono text-[14px]">
                  <span className="text-muted">{r.robotId}·{r.seq + 1}</span>
                  {view.explorer && r.tx ? (
                    <a
                      href={`${view.explorer}/tx/${r.tx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pointer-events-auto text-cyan underline decoration-dotted underline-offset-4"
                    >
                      {short(r.root)} ↗
                    </a>
                  ) : (
                    <span className="text-cyan">{short(r.root)}</span>
                  )}
                  <span className={r.within ? "text-acid" : "text-amber"}>{r.within ? "✓" : "⊘"}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-line bg-[rgba(10,11,9,0.85)] p-4">
          <div className="font-mono text-[11px] uppercase tracking-[2px] text-muted">Cost of proof · measured</div>
          <div className="mt-1 font-mono text-[34px] font-bold leading-none text-acid">{totalCostUsd(anchors)}</div>
          <div className="mt-1 font-mono text-[11px] text-dim">
            {anchors} anchors · {(anchors * MEASURED_FEE_ETH).toFixed(9)} ETH · 49,449 gas @ 0.02 gwei each
          </div>
        </div>

        {qr && (
          <div className="hidden items-center gap-3 rounded-xl border border-line bg-[rgba(10,11,9,0.85)] p-4 md:flex">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR to the live contract on Arbiscan" className="h-[clamp(84px,9vw,110px)] w-[clamp(84px,9vw,110px)] rounded" />
            <div className="font-mono text-[12px] uppercase leading-[1.6] tracking-[1px] text-muted">
              Scan →<br />
              <span className="text-acid">live contract</span>
              <br />
              on Arbiscan
            </div>
          </div>
        )}
      </div>

      {/* caption bar */}
      <div className="absolute bottom-[clamp(16px,4vh,40px)] left-1/2 w-[min(1100px,92vw)] -translate-x-1/2">
        <div
          className={`rounded-2xl border px-[clamp(16px,3vw,32px)] py-[clamp(12px,2.4vh,24px)] text-center backdrop-blur transition-colors duration-300 ${
            caption.tone === "alert"
              ? "border-[rgba(255,176,32,0.65)] bg-[rgba(28,20,6,0.9)]"
              : "border-line bg-[rgba(10,11,9,0.88)]"
          }`}
        >
          <div
            className={`font-mono text-[clamp(15px,2.1vw,26px)] font-bold uppercase leading-[1.35] tracking-[1.5px] ${
              caption.tone === "alert" ? "text-amber" : caption.tone === "idle" ? "text-muted" : "text-acid"
            }`}
          >
            {caption.text}
          </div>
          <div className="mt-2 font-mono text-[clamp(9px,1vw,11px)] uppercase tracking-[2px] text-dim">
            Space — run · F — fullscreen · R — reset {over > 0 && `· over-authority events: ${over}`}
          </div>
        </div>
      </div>

      {/* intro card — tells the room what it's about to watch */}
      {idle && (
        <div className="absolute left-1/2 top-1/2 w-[min(820px,92vw)] -translate-x-1/2 -translate-y-1/2">
          <div className="rounded-2xl border border-line bg-[rgba(10,11,9,0.96)] px-[clamp(24px,5vw,48px)] py-[clamp(24px,5vh,40px)] text-center">
            <div className="font-mono text-[clamp(12px,1.4vw,16px)] uppercase tracking-[3px] text-muted">
              Night shift · autonomous warehouse
            </div>
            <div className="mt-4 font-mono text-[clamp(17px,2.2vw,26px)] font-bold uppercase leading-[1.4] tracking-[1px] text-white">
              Three robots, each under a <span className="text-cyan">sealed mandate</span> — zone, speed, spend.
              <br />
              Every action becomes <span className="text-acid">evidence on Arbitrum</span>.
            </div>
            <div className="mt-4 font-mono text-[clamp(12px,1.4vw,15px)] text-muted">
              The mandate never goes public. The proof never goes away.
            </div>
            <button
              type="button"
              onClick={() => actions.run()}
              className="pointer-events-auto mt-6 rounded-full bg-acid px-8 py-3.5 font-mono text-[clamp(13px,1.5vw,16px)] font-bold uppercase tracking-[1.5px] text-[#0A0B09] transition-opacity hover:opacity-90 active:opacity-80"
            >
              ▶ Start the shift
            </button>
            <div className="mt-3 font-mono text-[10px] uppercase tracking-[2px] text-dim">
              or press Space · F for fullscreen
            </div>
          </div>
        </div>
      )}

      {/* completion card — sits above the scrim, owns the moment */}
      {done && (
        <div className="absolute left-1/2 top-1/2 w-[min(760px,92vw)] -translate-x-1/2 -translate-y-1/2">
          <div className="rounded-2xl border border-acid bg-[rgba(10,11,9,0.96)] px-[clamp(24px,5vw,48px)] py-[clamp(24px,5vh,40px)] text-center">
            <div className="font-mono text-[clamp(12px,1.4vw,16px)] uppercase tracking-[3px] text-muted">Shift complete</div>
            <div className="mt-3 font-mono text-[clamp(28px,4.2vw,44px)] font-bold leading-none text-acid">
              {anchors} actions → {anchors} proofs
            </div>
            <div className="mt-3 font-mono text-[clamp(12px,1.5vw,16px)] text-muted">
              on Arbitrum · total cost {totalCostUsd(anchors)} · verification free, forever
            </div>
            <div className="mt-2 font-mono text-[clamp(11px,1.2vw,13px)] text-dim">
              mandates stayed sealed · {over} violation{over === 1 ? "" : "s"} provable to the insurer, invisible to competitors
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
