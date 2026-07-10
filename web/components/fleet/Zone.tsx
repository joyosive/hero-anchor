"use client";

import { Html } from "@react-three/drei";
import * as THREE from "three";

export function Zone({ name, center, color }: { name: string; center: [number, number]; color: string }) {
  return (
    <group position={[center[0], 0.01, center[1]]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.2, 5.2]} />
        <meshBasicMaterial color={color} transparent opacity={0.06} />
      </mesh>
      {/* border ring */}
      <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(5.2, 5.2)]} />
        <lineBasicMaterial color={color} transparent opacity={0.35} />
      </lineSegments>
      <Html position={[-2.2, 0, -2.2]} distanceFactor={12} style={{ pointerEvents: "none" }}>
        <div style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: 2, color, opacity: 0.8, whiteSpace: "nowrap" }}>
          ZONE-{name}
        </div>
      </Html>
    </group>
  );
}
