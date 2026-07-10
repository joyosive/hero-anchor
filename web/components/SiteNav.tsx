"use client";

import Link from "next/link";

// One visible navigation for the three product surfaces — no magic routes.
const TABS = [
  { key: "agent", label: "Agent Proof", href: "/" },
  { key: "fleet", label: "Fleet Ops", href: "/fleet" },
  { key: "stage", label: "Stage Demo", href: "/fleet?stage=1" },
] as const;

export type SiteTab = (typeof TABS)[number]["key"];

export function SiteNav({ current, className = "" }: { current: SiteTab; className?: string }) {
  return (
    <nav
      aria-label="Primary"
      className={`flex items-center gap-1 rounded-full border border-line bg-[rgba(10,11,9,0.88)] p-1 backdrop-blur ${className}`}
    >
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={current === t.key ? "page" : undefined}
          className={`rounded-full px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[1.5px] transition-colors ${
            current === t.key ? "bg-acid font-semibold text-[#0A0B09]" : "text-muted hover:text-acid"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
