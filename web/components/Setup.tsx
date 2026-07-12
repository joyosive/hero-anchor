"use client";

import { useState } from "react";
import { Btn } from "./ui";

const input =
  "min-w-[260px] flex-1 rounded-md border border-line bg-panel3 px-2.5 py-2.5 font-mono text-[12px] text-white outline-none focus:border-acid";

export function Setup({ onSave, onConnectLocal }: { onSave: (ca: string) => void; onConnectLocal: () => void }) {
  const [ca, setCa] = useState("");
  const [anchor, setAnchor] = useState("");

  return (
    <details className="mt-5 border-t border-line pt-3.5">
      <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[1.4px] text-muted">
        Setup · go live
      </summary>
      <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
        <input
          value={ca}
          onChange={(e) => setCa(e.target.value)}
          placeholder="ConfidentialAuthority contract address (0x…)"
          spellCheck={false}
          aria-label="ConfidentialAuthority contract address"
          className={input}
        />
        <input
          value={anchor}
          onChange={(e) => setAnchor(e.target.value)}
          placeholder="HeroProofAnchor address (optional, 0x…)"
          spellCheck={false}
          aria-label="HeroProofAnchor contract address"
          className={input}
        />
        <Btn variant="ghost" onClick={() => onSave(ca)}>
          Arm live
        </Btn>
      </div>
      <div className="mt-3.5 flex flex-wrap items-center gap-2.5 border-t border-line2 pt-3.5">
        <Btn variant="outline" onClick={onConnectLocal}>Connect local chain</Btn>
        <span className="font-mono text-[10px] uppercase tracking-wide text-dim">anvil + make deploy-local</span>
      </div>
      <div className="mt-2.5 text-[12px] leading-[1.6] text-dim">
        <b className="text-white">Local chain (real, no wallet):</b> run <code>anvil</code> then{" "}
        <code>make deploy-local</code>, and click <b className="text-white">Connect local chain</b> - Act/Verify become
        real on-chain transactions. Confidentiality stays simulated (CoFHE isn&apos;t on local anvil).
        <br />
        <b className="text-white">Testnet (Sepolia):</b> <code>make deploy-verify</code>, paste the{" "}
        <code>ConfidentialAuthority</code> address, connect a wallet on chain 421614.
      </div>
    </details>
  );
}
