/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";

// The front door tells the CEO-deck story, in the deck's own words.
// The demos live behind the three doors at the top and bottom.

const PROBLEMS = [
  {
    title: "Unverifiable",
    body: "A regulator, insurer, or victim has no way to independently check what a machine did. They must take the operator's word for it.",
  },
  {
    title: "Forgeable",
    body: "The operator's database can be edited, deleted, or selectively disclosed. After an incident, the party with the most to lose controls the evidence.",
  },
  {
    title: "Private or public. Pick one.",
    body: "Publishing operations exposes trade secrets. Keeping them private makes them unauditable. Today there is nothing in between.",
  },
];

const STEPS = [
  { name: "Mandate", body: "Encrypted authority: zones, limits, expiry" },
  { name: "Act", body: "Perceive, decide, act. Every step recorded" },
  { name: "Chain", body: "Hash-chained log. One altered byte breaks it" },
  { name: "Anchor", body: "Root anchored on Arbitrum" },
  { name: "Verify", body: "Anyone checks compliance. Mandate stays sealed" },
];

const ANCHOR_URL = "https://sepolia.arbiscan.io/address/0xb3fa3222130fac54b90e37835dce4f052349571b";
const CA_URL = "https://sepolia.arbiscan.io/address/0x977b112bc9d121c8f2567c8a52fd7b6a4f2cdd95";

export default function Home() {
  return (
    <main className="mx-auto max-w-[1220px] px-[26px] pb-16 pt-[26px]">
      {/* top bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <div className="flex items-center gap-4">
          <img src="/seal.png" alt="Hero seal" className="h-11 w-auto" />
          <div>
            <img src="/word.png" alt="Hero Network" className="h-[22px] w-auto opacity-95" />
            <div className="mt-1.5 font-mono text-[11px] uppercase tracking-[2.5px] text-muted">
              Trust infrastructure for physical AI
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SiteNav current="home" />
          <span className="hidden items-center gap-2 rounded-full border border-line px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[1.5px] text-acid sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-acid" /> Live on Arbitrum
          </span>
        </div>
      </header>

      {/* hero */}
      <section className="py-[clamp(40px,7vh,72px)]">
        <div className="font-mono text-[12px] uppercase tracking-[3px] text-acid">The problem</div>
        <h1 className="mt-4 max-w-[900px] text-[clamp(34px,5.2vw,58px)] font-bold leading-[1.06] tracking-[-0.5px] text-white">
          Machines are leaving the sandbox. <span className="text-acid">Their record of behaviour hasn&apos;t.</span>
        </h1>
        <p className="mt-6 max-w-[820px] text-[clamp(15px,1.5vw,17.5px)] leading-[1.65] text-muted">
          Robot fleets, delivery drones, warehouse automatons, autonomous vehicles: machines now take physical actions
          on human infrastructure. When something goes wrong, the only record of what happened is the operator&apos;s
          own logs.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/fleet?stage=1"
            className="rounded-lg bg-acid px-6 py-3 font-mono text-[13px] font-bold uppercase tracking-[1.5px] text-[#0A0B09] transition-opacity hover:opacity-90"
          >
            ▶ Watch the live demo
          </Link>
          <Link
            href="/fleet"
            className="rounded-lg border border-line px-6 py-3 font-mono text-[13px] uppercase tracking-[1.5px] text-white transition-colors hover:border-acid hover:text-acid"
          >
            Operator console
          </Link>
          <Link
            href="/proof"
            className="rounded-lg border border-line px-6 py-3 font-mono text-[13px] uppercase tracking-[1.5px] text-white transition-colors hover:border-acid hover:text-acid"
          >
            How the proof works
          </Link>
        </div>
        <div className="mt-6 font-mono text-[12px] uppercase tracking-[1.5px] text-dim">
          Live on Arbitrum Sepolia · contracts verified on Arbiscan · $0.003 per proof, measured
        </div>
      </section>

      {/* problem trio */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PROBLEMS.map((p) => (
          <div key={p.title} className="rounded-[14px] border border-line bg-panel p-6">
            <div className="font-mono text-[12px] uppercase tracking-[2px] text-acid">{p.title}</div>
            <p className="mt-3 text-[14.5px] leading-[1.65] text-muted">{p.body}</p>
          </div>
        ))}
      </section>

      {/* why different */}
      <section className="mt-14">
        <div className="font-mono text-[12px] uppercase tracking-[3px] text-acid">Why this is different</div>
        <h2 className="mt-3 max-w-[820px] text-[clamp(24px,3.2vw,36px)] font-bold leading-[1.15] text-white">
          You can revert a transaction. <span className="text-acid">You cannot revert an action.</span>
        </h2>
        <p className="mt-4 max-w-[820px] text-[15px] leading-[1.65] text-muted">
          For physical AI, mistakes are permanent and logs are legal evidence: they must survive the operator, stay
          tamper-evident, and be independently checkable — while operations remain trade secrets. Verification has to
          work on <span className="text-white">encrypted</span> behaviour. That is evidence infrastructure, not agent
          tooling with servos.
        </p>
      </section>

      {/* solution: proof of action */}
      <section className="mt-14 rounded-[14px] border border-line bg-panel p-[clamp(20px,3vw,32px)]">
        <div className="font-mono text-[12px] uppercase tracking-[3px] text-acid">The solution</div>
        <h2 className="mt-3 text-[clamp(24px,3.2vw,36px)] font-bold leading-[1.15] text-white">
          Proof of Action. <span className="text-muted">A verifiable record of authority and behaviour.</span>
        </h2>
        <p className="mt-4 max-w-[900px] text-[15px] leading-[1.65] text-muted">
          A warehouse fleet, concretely: each robot holds a <span className="text-cyan">sealed mandate</span> (zone A,
          pallets only, near-human speed cap, expires Friday). Every action folds into a tamper-evident chain. One
          root anchors per epoch. <span className="text-white">An insurer verifies compliance in seconds. The mandate
          never goes public.</span>
        </p>
        <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s, i) => (
            <div
              key={s.name}
              className={`rounded-xl border p-4 ${i === STEPS.length - 1 ? "border-acid" : "border-line2"} bg-panel2`}
            >
              <div className={`font-mono text-[12px] uppercase tracking-[2px] ${i === STEPS.length - 1 ? "text-acid" : "text-acid"}`}>
                {s.name}
              </div>
              <p className="mt-2 text-[13px] leading-[1.55] text-muted">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[11.5px] uppercase tracking-[1.5px]">
          <span><span className="text-acid">No token</span> <span className="text-dim">— neutrality engineered in, not sold</span></span>
          <span><span className="text-acid">No admin keys</span> <span className="text-dim">— an anchor an admin can edit is not a trust anchor</span></span>
          <span><span className="text-acid">Roots only on-chain</span> <span className="text-dim">— raw telemetry never leaves the operator</span></span>
        </div>
      </section>

      {/* measured numbers */}
      <section className="mt-14">
        <div className="font-mono text-[12px] uppercase tracking-[3px] text-acid">Measured, not asserted</div>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-[14px] border border-line bg-panel p-6">
            <div className="font-mono text-[34px] font-bold leading-none text-acid">$0.003</div>
            <div className="mt-2 font-mono text-[12px] uppercase tracking-[1.5px] text-muted">per proof · measured on Arbitrum Sepolia</div>
            <div className="mt-1 font-mono text-[11px] text-dim">49,449 gas · real transaction receipts</div>
          </div>
          <div className="rounded-[14px] border border-line bg-panel p-6">
            <div className="font-mono text-[34px] font-bold leading-none text-acid">~$0.04<span className="text-[18px] text-muted">/day</span></div>
            <div className="mt-2 font-mono text-[12px] uppercase tracking-[1.5px] text-muted">a 1,000-robot fleet, batched</div>
            <div className="mt-1 font-mono text-[11px] text-dim">Merkle epochs ≈ halve per-action gas</div>
          </div>
          <div className="rounded-[14px] border border-line bg-panel p-6">
            <div className="font-mono text-[34px] font-bold leading-none text-acid">Free</div>
            <div className="mt-2 font-mono text-[12px] uppercase tracking-[1.5px] text-muted">verification · for anyone · forever</div>
            <div className="mt-1 font-mono text-[11px] text-dim">reading the chain costs nothing</div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[12px] uppercase tracking-[1.5px]">
          <a href={ANCHOR_URL} target="_blank" rel="noopener noreferrer" className="text-acid underline decoration-dotted underline-offset-4 hover:opacity-80">
            HeroProofAnchor — verified source ↗
          </a>
          <a href={CA_URL} target="_blank" rel="noopener noreferrer" className="text-acid underline decoration-dotted underline-offset-4 hover:opacity-80">
            ConfidentialAuthority (FHE) — verified source ↗
          </a>
        </div>
      </section>

      {/* closing doors */}
      <section className="mt-16 rounded-[14px] border border-acid bg-panel p-[clamp(24px,4vw,40px)] text-center">
        <div className="text-[clamp(24px,3.4vw,38px)] font-bold text-white">
          Everything that acts, <span className="text-acid">provable.</span>
        </div>
        <p className="mx-auto mt-3 max-w-[560px] text-[14.5px] leading-[1.6] text-muted">
          Hero is the neutral proof layer for autonomous action. Physical AI first. Built on Arbitrum.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/fleet?stage=1"
            className="rounded-lg bg-acid px-6 py-3 font-mono text-[13px] font-bold uppercase tracking-[1.5px] text-[#0A0B09] transition-opacity hover:opacity-90"
          >
            ▶ Watch the live demo
          </Link>
          <Link
            href="/proof"
            className="rounded-lg border border-line px-6 py-3 font-mono text-[13px] uppercase tracking-[1.5px] text-white transition-colors hover:border-acid hover:text-acid"
          >
            How the proof works
          </Link>
        </div>
      </section>

      <footer className="mt-10 flex flex-wrap justify-between gap-2.5 border-t border-line pt-[18px] font-mono text-[11px] uppercase tracking-[1.3px] text-dim">
        <span>Hero Network · an H.E.R. DAO project · trust made physical</span>
        <span>Founder House · London · 2026 · Arbitrum Sepolia 421614</span>
      </footer>
    </main>
  );
}
