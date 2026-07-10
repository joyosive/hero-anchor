"use client";

import dynamic from "next/dynamic";
import { useFleet } from "@/lib/fleet/useFleet";
import { FleetHud } from "@/components/fleet/FleetHud";

// 3D scene is client-only — never touches SSR.
const FleetScene = dynamic(() => import("@/components/fleet/FleetScene"), { ssr: false });

export default function FleetPage() {
  const { view, actions } = useFleet();
  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-bg">
      <div className="absolute inset-0">
        <FleetScene robots={view.robots} ledger={view.ledger} />
      </div>
      <FleetHud view={view} actions={actions} />
    </main>
  );
}
