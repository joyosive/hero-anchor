import type { Metadata } from "next";
import { Suspense } from "react";
import { Space_Grotesk, JetBrains_Mono, Inter } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const disp = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains-mono",
});
const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Hero · Confidential Proof of Action",
  description:
    "An autonomous agent proves it acted within its authority — without revealing the authority or the action. Confidential proof-of-action on Arbitrum.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${disp.variable} ${mono.variable} ${body.variable}`}>
      <body>
        {/* One flex column: sticky header + the page as the flex child.
            Fleet/stage claims the remaining height via flex-1 (no percentage
            chain); scrolling pages grow past the viewport normally. */}
        <div className="flex min-h-dvh flex-col">
          <Suspense fallback={null}>
            <SiteHeader />
          </Suspense>
          {children}
        </div>
      </body>
    </html>
  );
}
