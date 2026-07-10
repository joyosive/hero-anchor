"use client";

import { useEffect } from "react";
import { useHero } from "@/lib/useHero";
import { Header } from "@/components/Header";
import { Lede } from "@/components/Lede";
import { OperatorPanel } from "@/components/OperatorPanel";
import { ProofSplit } from "@/components/ProofSplit";
import { Ledger } from "@/components/Ledger";
import { Beats } from "@/components/Beats";
import { ConsoleLog } from "@/components/ConsoleLog";
import { Setup } from "@/components/Setup";

export default function Home() {
  const { view, actions } = useHero();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") actions.reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // actions.reset reads live state via ref; safe to bind once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto max-w-[1220px] px-[26px] pb-16 pt-[26px]">
      <Header view={view} onConnect={actions.connect} onRun={actions.runPitch} />
      <Lede />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.05fr_1fr]">
        <OperatorPanel
          view={view}
          onEdit={actions.editRecord}
          onLimit={actions.setLimit}
          onAgent={actions.setAgentName}
          onGrant={actions.grant}
          onAmount={actions.setAmount}
          onAct={actions.act}
          onOver={actions.overSpend}
          onRevoke={actions.revoke}
        />
        <ProofSplit view={view} onReveal={actions.reveal} onVerify={actions.verify} />
      </div>

      <section className="mt-5 rounded-[14px] border border-line bg-panel p-[22px]">
        <h2 className="mb-[3px] font-mono text-[11.5px] uppercase tracking-[2.6px] text-acid">
          Action ledger &amp; proof timeline
        </h2>
        <p className="mb-[18px] text-[13.5px] text-muted">
          Every action anchors a public proof; the amounts and budget stay encrypted. Over-authority actions are a
          silent no-op — still anchored, nothing leaked.
        </p>
        <Beats beat={view.beat} />
        <Ledger view={view} />
        <ConsoleLog log={view.log} />
        <Setup onSave={actions.saveSetup} onConnectLocal={actions.connectLocal} />
      </section>

      <footer className="mt-10 flex flex-wrap justify-between gap-2.5 border-t border-line pt-[18px] font-mono text-[11px] uppercase tracking-[1.3px] text-dim">
        <span>Hero · Confidential proof-of-action on Arbitrum</span>
        <span>Arbitrum Sepolia · 421614</span>
      </footer>
    </main>
  );
}
