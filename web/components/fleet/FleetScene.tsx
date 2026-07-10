"use client";

import { Canvas } from "@react-three/fiber";
import { Robot3D } from "./Robot3D";
import { Warehouse } from "./Warehouse";
import { Zone } from "./Zone";
import { ProofBoard } from "./ProofBoard";
import type { RobotView, FleetLedgerRow } from "@/lib/fleet/types";

/** Default export so it can be dynamically imported with { ssr: false }. */
export default function FleetScene({ robots, ledger }: { robots: RobotView[]; ledger: FleetLedgerRow[] }) {
  return (
    <Canvas shadows camera={{ position: [0, 7, 11], fov: 50 }} gl={{ alpha: true }}>
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 8, 5]} intensity={1.1} castShadow />

      {/* warehouse floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#0A0B09" />
      </mesh>
      <gridHelper args={[30, 30, "#AAFF00", "#1b1f16"]} />

      <Zone name="A" center={[-4, 0]} color="#AAFF00" />
      <Zone name="B" center={[0, 0]} color="#22D3EE" />
      <Zone name="C" center={[4, 0]} color="#FFB020" />

      <Warehouse />

      <ProofBoard rows={ledger} />

      {robots.map((r) => (
        <Robot3D key={r.id} agent={r} />
      ))}
    </Canvas>
  );
}
