"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { SiteNav, type SiteTab } from "./SiteNav";

// The one site header, rendered once from the root layout so it persists
// across client navigations. Stage mode (/fleet?stage=1) renders nothing —
// the projector view keeps its own minimal chrome.
export function SiteHeader() {
  const pathname = usePathname();
  const stage = useSearchParams().get("stage") === "1";

  if (pathname === "/fleet" && stage) return null;

  const current: SiteTab = pathname === "/fleet" ? "fleet" : pathname === "/proof" ? "proof" : "home";

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[rgba(10,11,9,0.92)] backdrop-blur">
      <div className="mx-auto flex max-w-[1220px] flex-wrap items-center justify-between gap-4 px-[26px] py-4">
        <Link href="/" className="flex items-center gap-4">
          <img src="/seal.png" alt="Hero seal" className="h-10 w-auto" />
          <div>
            <img src="/word.png" alt="Hero Network" className="h-[20px] w-auto opacity-95" />
            <div className="mt-1 font-mono text-[10.5px] uppercase tracking-[2.5px] text-muted">
              Trust infrastructure for physical AI
            </div>
          </div>
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <SiteNav current={current} />
          <a
            href="https://sepolia.arbiscan.io/address/0xb3fa3222130fac54b90e37835dce4f052349571b"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-full border border-line px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[1.5px] text-acid transition-colors hover:border-acid lg:flex"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-acid" /> Live · Arbitrum Sepolia
          </a>
        </div>
      </div>
    </header>
  );
}
