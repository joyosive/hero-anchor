"use client";

import { Pallet } from "./Pallet";

function Rack({ x }: { x: number }) {
  return (
    <group position={[x, 0, -6]}>
      {[0.4, 1.2, 2.0].map((h) => (
        <mesh key={h} position={[0, h, 0]} castShadow>
          <boxGeometry args={[2.4, 0.08, 1]} />
          <meshStandardMaterial color="#14180f" />
        </mesh>
      ))}
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx, 1.2, 0]}>
          <boxGeometry args={[0.1, 2.4, 1]} />
          <meshStandardMaterial color="#20261a" />
        </mesh>
      ))}
    </group>
  );
}

export function Warehouse() {
  return (
    <group>
      <Rack x={-4} />
      <Rack x={0} />
      <Rack x={4} />
      <Pallet position={[-6, 0, 3]} />
      <Pallet position={[6, 0, 2.5]} />
      <Pallet position={[-1.5, 0, 4]} />
    </group>
  );
}
