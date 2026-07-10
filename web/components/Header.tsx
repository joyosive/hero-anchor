"use client";

/* eslint-disable @next/next/no-img-element */
import type { HeroView } from "@/lib/types";
import { Btn, Pill } from "./ui";

export function Header({
  view,
  onConnect,
  onRun,
}: {
  view: HeroView;
  onConnect: () => void;
  onRun: () => void;
}) {
  const acct = view.net.account;
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
      <div className="flex items-center gap-4">
        <img src="/seal.png" alt="Hero seal" className="h-11 w-auto" />
        <div>
          <img src="/word.png" alt="Hero Network" className="h-[22px] w-auto opacity-95" />
          <div className="mt-1.5 font-mono text-[11px] uppercase tracking-[2.5px] text-muted">
            Confidential Proof of Action
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <Pill tone={view.mode === "sim" ? "sim" : "live"} dot>
          {view.mode === "live" ? "Live · on-chain" : view.mode === "local" ? "Local · on-chain" : "Simulation"}
        </Pill>
        <Pill tone={view.net.account ? (view.net.chainOk ? "ok" : "warn") : "idle"} dot>
          {view.net.account ? (view.net.chainOk ? "Arbitrum Sepolia" : "Wrong network") : "Not connected"}
        </Pill>
        <a
          href="/fleet"
          className="font-mono text-[11px] uppercase tracking-wide text-acid hover:underline"
        >
          Level 2 · Fleet →
        </a>
        <Btn variant="ghost" onClick={onConnect}>
          {acct ? `${acct.slice(0, 6)}…${acct.slice(-4)}` : "Connect wallet"}
        </Btn>
        <Btn variant="solid" onClick={onRun} disabled={view.running}>
          ▶ Run pitch
        </Btn>
      </div>
    </header>
  );
}
