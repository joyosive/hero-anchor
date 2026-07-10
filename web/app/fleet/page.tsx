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
    // flex-1 min-h-0: as the flex child of the layout column, the scene fills
    // the height left by the header (full viewport in stage mode, where the
    // header renders nothing). Avoids the 0-height percentage-chain trap.
    <main className="relative min-h-0 w-full flex-1 overflow-hidden bg-bg">
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
