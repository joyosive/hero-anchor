"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const ARBISCAN = "https://sepolia.arbiscan.io/address/0x75B1E01222bC1bEFfd023A71762fec796FeE181A";

const TABS = [
  { key: "home", label: "Why Hero", href: "/" },
  { key: "stage", label: "Live Demo", href: "/fleet?stage=1" },
  { key: "fleet", label: "Operator Console", href: "/fleet" },
  { key: "proof", label: "How It Works", href: "/proof" },
] as const;

// The one site header, rendered once from the root layout so it persists across
// navigations. Desktop shows the tabs inline; mobile collapses them into a
// hamburger drawer. Hidden in the stage demo (that view keeps its own chrome).
export function SiteHeader() {
  const pathname = usePathname();
  const stage = useSearchParams().get("stage") === "1";
  const [open, setOpen] = useState(false);

  if (pathname === "/fleet" && stage) return null;

  const current = pathname === "/fleet" ? "fleet" : pathname === "/proof" ? "proof" : "home";
  // inline style guarantees active-pill contrast regardless of global link styles
  const activeStyle = (key: string) =>
    key === current ? { color: "#0A0B09", backgroundColor: "#AAFF00" } : undefined;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-[rgba(10,11,9,0.94)] backdrop-blur">
      <div className="mx-auto flex max-w-[1220px] items-center justify-between gap-4 px-5 py-3 md:px-[26px]">
        {/* brand */}
        <Link href="/" onClick={() => setOpen(false)} className="flex shrink-0 items-center gap-3">
          <img src="/seal.png" alt="Hero" className="h-9 w-auto" />
          <span className="block leading-none">
            <img src="/word.png" alt="Hero Network" className="block h-[18px] w-auto opacity-95" />
            <span className="mt-1 hidden font-mono text-[10px] uppercase tracking-[2px] text-muted sm:block">
              Trust infrastructure for physical AI
            </span>
          </span>
        </Link>

        {/* desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={t.href}
              aria-current={t.key === current ? "page" : undefined}
              style={activeStyle(t.key)}
              className={`rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-[1.2px] transition-colors ${
                t.key === current ? "font-semibold" : "text-muted hover:text-acid"
              }`}
            >
              {t.label}
            </Link>
          ))}
          <a
            href={ARBISCAN}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 hidden items-center gap-2 rounded-full border border-line px-3 py-1.5 font-mono text-[11px] uppercase tracking-[1.2px] text-acid transition-colors hover:border-acid lg:flex"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-acid" /> Live · Arbitrum Sepolia
          </a>
        </nav>

        {/* mobile toggle */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line text-acid md:hidden"
        >
          <span className="relative block h-3.5 w-5">
            <span className={`absolute left-0 h-0.5 w-5 bg-current transition-all duration-200 ${open ? "top-[6px] rotate-45" : "top-0"}`} />
            <span className={`absolute left-0 top-[6px] h-0.5 w-5 bg-current transition-opacity duration-200 ${open ? "opacity-0" : "opacity-100"}`} />
            <span className={`absolute left-0 h-0.5 w-5 bg-current transition-all duration-200 ${open ? "top-[6px] -rotate-45" : "top-[12px]"}`} />
          </span>
        </button>
      </div>

      {/* mobile drawer */}
      {open && (
        <nav className="border-t border-line bg-[rgba(10,11,9,0.98)] px-5 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {TABS.map((t) => (
              <Link
                key={t.key}
                href={t.href}
                onClick={() => setOpen(false)}
                aria-current={t.key === current ? "page" : undefined}
                style={activeStyle(t.key)}
                className={`rounded-lg px-4 py-3 font-mono text-[13px] uppercase tracking-[1.5px] ${
                  t.key === current ? "font-semibold" : "text-muted"
                }`}
              >
                {t.label}
              </Link>
            ))}
            <a
              href={ARBISCAN}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center gap-2 rounded-lg border border-line px-4 py-3 font-mono text-[12px] uppercase tracking-[1.5px] text-acid"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-acid" /> Live · Arbitrum Sepolia
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
