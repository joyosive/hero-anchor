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
    <main className="relative h-[100dvh] w-full overflow-hidden bg-bg">
      <div className="absolute inset-0">
        <FleetScene robots={view.robots} ledger={view.ledger} />
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
