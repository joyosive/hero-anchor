"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** A vertical beam above a robot that fades in briefly when it anchors a proof. */
export function ProofBeam({ color, active }: { color: string; active: boolean }) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(() => {
    const m = matRef.current;
    if (!m) return;
    const target = active ? 0.7 : 0;
    m.opacity += (target - m.opacity) * 0.2;
  });
  return (
    <mesh position={[0, 2.3, 0]}>
      <cylinderGeometry args={[0.05, 0.05, 3.6, 8]} />
      <meshBasicMaterial ref={matRef} color={color} transparent opacity={0} />
    </mesh>
  );
}
