"use client";

/* eslint-disable @next/next/no-img-element */
import type { HeroView } from "@/lib/types";
import { Btn, Pill } from "./ui";
import { SiteNav } from "./SiteNav";

export function Header({ view, onRun }: { view: HeroView; onRun: () => void }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
      <div className="flex items-center gap-4">
        <img src="/seal.png" alt="Hero seal" className="h-11 w-auto" />
        <div>
          <img src="/word.png" alt="Hero Network" className="h-[22px] w-auto opacity-95" />
          <div className="mt-1.5 font-mono text-[11px] uppercase tracking-[2.5px] text-muted">
            How the proof works
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <Pill tone={view.mode === "sim" ? "sim" : "live"} dot>
          {view.mode === "live"
            ? "Live · on-chain"
            : view.mode === "local"
              ? "Local · on-chain"
              : "Interactive walkthrough"}
        </Pill>
        <SiteNav current="proof" />
        <Btn variant="solid" onClick={onRun} disabled={view.running}>
          ▶ Run pitch
        </Btn>
      </div>
    </header>
  );
}
