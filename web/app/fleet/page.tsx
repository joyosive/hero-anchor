"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useFleet } from "@/lib/fleet/useFleet";
import { FleetHud } from "@/components/fleet/FleetHud";
import { StageOverlay } from "@/components/stage/StageOverlay";

// 3D scene is client-only — never touches SSR.
const FleetScene = dynamic(() => import("@/components/fleet/FleetScene"), { ssr: false });

function Fleet() {
  const { view, actions } = useFleet();
  // ?stage=1 → full-screen presentation mode (self-narrating, presenter keys)
  const stage = useSearchParams().get("stage") === "1";
  return (
    // h-full: the root layout owns the viewport (header + flex-1 content),
    // so the scene fills whatever height remains — full screen in stage mode.
    <main className="relative h-full w-full overflow-hidden bg-bg">
      {/* isolate: the 3D scene's floating labels use very high z-indexes —
          containing them here keeps every overlay above the scene */}
      <div className="absolute inset-0 isolate z-0">
        <FleetScene robots={view.robots} ledger={view.ledger} showBoard={!stage} />
      </div>
      {stage ? <StageOverlay view={view} actions={actions} /> : <FleetHud view={view} actions={actions} />}
    </main>
  );
}

export default function FleetPage() {
  return (
    <Suspense>
      <Fleet />
    </Suspense>
  );
}
