"use client";

export function Pallet({ position = [0, 0, 0] as [number, number, number], color = "#6b5b3a" }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.6, 0.4, 0.6]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[0.64, 0.06, 0.64]} />
        <meshStandardMaterial color="#8a7748" />
      </mesh>
    </group>
  );
}
