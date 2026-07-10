"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { RobotView } from "@/lib/fleet/types";
import { ProofBeam } from "./ProofBeam";
import { Pallet } from "./Pallet";

/** An acid-on-black robot (reskin of the reference PixelAgent). y is the floor plane's z. */
export function Robot3D({ agent }: { agent: RobotView }) {
  const groupRef = useRef<THREE.Group>(null);
  const acting = agent.phase === "acting" || agent.justAnchored;

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    g.position.x += (agent.targetX - g.position.x) * 0.1;
    g.position.z += (agent.targetY - g.position.z) * 0.1;
    const bob = acting ? Math.sin(state.clock.elapsedTime * 5) * 0.08 : 0;
    g.position.y = 0.5 + bob;
  });

  return (
    <group ref={groupRef} position={[agent.x, 0.5, agent.y]}>
      {acting && (
        <mesh position={[0, -0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.72, 32]} />
          <meshBasicMaterial color={agent.color} transparent opacity={0.6} />
        </mesh>
      )}

      {/* body */}
      <mesh castShadow>
        <boxGeometry args={[0.7, 0.9, 0.7]} />
        <meshStandardMaterial
          color={agent.color}
          emissive={agent.color}
          emissiveIntensity={acting ? 0.5 : 0.12}
        />
      </mesh>

      {/* eyes */}
      <mesh position={[-0.14, 0.14, 0.36]}>
        <boxGeometry args={[0.12, 0.12, 0.02]} />
        <meshBasicMaterial color="#0A0B09" />
      </mesh>
      <mesh position={[0.14, 0.14, 0.36]}>
        <boxGeometry args={[0.12, 0.12, 0.02]} />
        <meshBasicMaterial color="#0A0B09" />
      </mesh>

      {/* front sensor bar */}
      <mesh position={[0, -0.06, 0.36]}>
        <boxGeometry args={[0.5, 0.07, 0.03]} />
        <meshStandardMaterial
          color="#0A0B09"
          emissive={acting ? "#AAFF00" : "#4C4F47"}
          emissiveIntensity={acting ? 0.9 : 0.2}
        />
      </mesh>

      {/* antenna */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.06, 0.25, 0.06]} />
        <meshStandardMaterial color={agent.color} emissive={agent.color} emissiveIntensity={acting ? 0.6 : 0.15} />
      </mesh>
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshBasicMaterial color={acting ? "#AAFF00" : "#4C4F47"} />
      </mesh>

      {/* carried pallet */}
      {agent.carrying && <Pallet position={[0, 0.75, 0.1]} />}

      {/* stacked label card via DOM overlay (no font fetch) */}
      <Html position={[0, 0.95, 0]} center distanceFactor={9} style={{ pointerEvents: "none" }}>
        <div
          style={{
            fontFamily: "monospace",
            whiteSpace: "nowrap",
            textAlign: "center",
            background: "rgba(10,11,9,.85)",
            border: `1px solid ${agent.color}`,
            borderRadius: 4,
            padding: "4px 8px",
          }}
        >
          <div style={{ fontSize: 11, color: "#ECEEE6", textShadow: "0 0 4px #000" }}>{agent.name}</div>
          <div
            style={{
              fontSize: 10,
              marginTop: 2,
              color: agent.phase === "acting" ? "#AAFF00" : "#4C4F47",
              fontWeight: agent.phase === "acting" ? "bold" : "normal",
            }}
          >
            SENSE · DECIDE · ACT
          </div>
          {agent.lastWithin !== null && (
            <div
              style={{
                fontSize: 10,
                marginTop: 2,
                color: agent.lastWithin ? "#AAFF00" : "#FFB020",
              }}
            >
              {agent.lastWithin ? `within ✓ · proof #${agent.seq}` : `over ⊘ · proof #${agent.seq}`}
            </div>
          )}
        </div>
      </Html>

      <ProofBeam color={agent.color} active={agent.justAnchored} />
    </group>
  );
}
