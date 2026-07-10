"use client";

import { Html } from "@react-three/drei";
import type { FleetLedgerRow } from "@/lib/fleet/types";

const short = (h: string) => h.slice(0, 8) + "…";

/** A standing board that stacks the latest anchored proofs — anchoring made visible. */
export function ProofBoard({ rows }: { rows: FleetLedgerRow[] }) {
  const latest = rows.slice(-6).reverse();

  return (
    <group position={[7, 1.6, -3]} rotation={[0, -0.5, 0]}>
      {/* dark board */}
      <mesh castShadow>
        <boxGeometry args={[3.2, 2.4, 0.12]} />
        <meshStandardMaterial color="#0A0B09" emissive="#14180f" emissiveIntensity={0.3} />
      </mesh>
      {/* acid frame edge */}
      <mesh position={[0, 0, 0.061]}>
        <planeGeometry args={[3.2, 2.4]} />
        <meshBasicMaterial color="#AAFF00" transparent opacity={0.05} />
      </mesh>

      <Html position={[0, 0, 0.07]} transform distanceFactor={6} style={{ pointerEvents: "none" }}>
        <div
          style={{
            width: 260,
            fontFamily: "monospace",
            background: "rgba(10,11,9,.92)",
            border: "1px solid #AAFF00",
            borderRadius: 6,
            padding: "10px 12px",
          }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: 1.5,
              color: "#AAFF00",
              fontWeight: "bold",
              marginBottom: 8,
              whiteSpace: "nowrap",
            }}
          >
            PUBLIC LEDGER · Arbitrum
          </div>

          {latest.length === 0 ? (
            <div style={{ fontSize: 11, color: "#4C4F47" }}>no proofs yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {latest.map((row, i) => (
                <div
                  key={`${row.robotId}-${row.seq}-${i}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 11,
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ color: "#ECEEE6" }}>#{row.seq + 1}</span>
                  <span style={{ color: "#ECEEE6" }}>{row.robotId}</span>
                  <span
                    style={{
                      color: row.within === null ? "#8A8D82" : row.within ? "#AAFF00" : "#FFB020",
                      fontWeight: "bold",
                    }}
                  >
                    {row.within === null ? "·" : row.within ? "✓" : "⊘"}
                  </span>
                  <span style={{ color: "#22D3EE", fontFamily: "monospace" }}>{short(row.root)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}
