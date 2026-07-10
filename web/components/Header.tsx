"use client";

import type { HeroView } from "@/lib/types";
import { Btn, Pill } from "./ui";

// Page toolbar for the /proof walkthrough. Site chrome (logo, tabs, live
// badge) comes from SiteHeader in the root layout — this only carries the
// walkthrough's own status + action.
export function Header({ view, onRun }: { view: HeroView; onRun: () => void }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
      <div>
        <h1 className="font-mono text-[13px] uppercase tracking-[2.6px] text-acid">How the proof works</h1>
        <p className="mt-1 text-[13px] text-muted">
          The full grant → act → prove → reveal cycle, step by step.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <Pill tone={view.mode === "sim" ? "sim" : "live"} dot>
          {view.mode === "live"
            ? "Live · on-chain"
            : view.mode === "local"
              ? "Local · on-chain"
              : "Interactive walkthrough"}
        </Pill>
        <Btn variant="solid" onClick={onRun} disabled={view.running}>
          ▶ Run pitch
        </Btn>
      </div>
    </header>
  );
}
