"use client";

import Link from "next/link";

// One visible navigation for the product surfaces — no magic routes.
const TABS = [
  { key: "home", label: "Why Hero", href: "/" },
  { key: "stage", label: "Live Demo", href: "/fleet?stage=1" },
  { key: "fleet", label: "Operator Console", href: "/fleet" },
  { key: "proof", label: "How It Works", href: "/proof" },
] as const;

export type SiteTab = (typeof TABS)[number]["key"];

export function SiteNav({ current, className = "" }: { current: SiteTab; className?: string }) {
  return (
    <nav
      aria-label="Primary"
      className={`flex flex-wrap items-center gap-1 rounded-full border border-line bg-[rgba(10,11,9,0.88)] p-1 backdrop-blur ${className}`}
    >
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={current === t.key ? "page" : undefined}
          // inline style guarantees label contrast on the active pill,
          // regardless of any global anchor styling
          style={current === t.key ? { color: "#0A0B09", backgroundColor: "#AAFF00" } : undefined}
          className={`rounded-full px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[1.5px] transition-colors ${
            current === t.key ? "font-semibold" : "text-muted hover:text-acid"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
