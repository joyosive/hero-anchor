"use client";

import { useEffect, useRef, useState } from "react";
import type { Contract } from "ethers";
import { createSimEngine } from "../simEngine";
import { createChainEngine } from "../chainEngine";
import { createRelayEngine, probeRelay } from "../relay";
import { makeLocalContract } from "../localChain";
import { makeSepoliaContract } from "../sepoliaChain";
import { EXPLORER } from "../constants";
import type { Engine } from "../types";
import { handleFor } from "../hash";
import { FLEET, createWorld, tick, type World } from "./world";
import { SimBrain } from "./brain";
import { runCycle } from "./robot";
import type { FleetView, FleetLedgerRow, RobotView } from "./types";

const MAX_STEPS = 6; // two full script rounds — enough to show within/over per robot
const time = () => new Date().toLocaleTimeString([], { hour12: false });
const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const homeById = new Map(FLEET.map((s) => [s.id, s.home] as const));

// The armed on-chain target. Resolved once (async) when the toggle is armed,
// then reused by ensureEngines/reset so the mode survives shift resets.
type FleetChain =
  | { kind: "burner" | "anvil"; contract: Contract; label: string; explorer: string | null }
  | { kind: "relay"; label: string; explorer: string };

// Resolution order: local booth burner (real Sepolia, key on this machine) →
// hosted relayer (real Sepolia, key server-side) → local anvil → null = sim.
async function resolveFleetChain(): Promise<FleetChain | null> {
  const sep = makeSepoliaContract();
  if (sep) return { kind: "burner", contract: sep.contract, label: sep.label, explorer: sep.explorer };
  if (await probeRelay()) return { kind: "relay", label: "Arbitrum Sepolia · relayer", explorer: EXPLORER };
  const local = makeLocalContract();
  if (local) return { kind: "anvil", contract: local, label: "local anvil", explorer: null };
  return null;
}

function initialRobots(): RobotView[] {
  return FLEET.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
    zone: s.zone,
    x: s.home[0],
    y: s.home[1],
    targetX: s.home[0],
    targetY: s.home[1],
    status: "idle",
    phase: "idle",
    carrying: false,
    seq: 0,
    lastWithin: null,
    budgetHandle: handleFor("rem:" + s.id, 0),
    budgetClear: null,
    justAnchored: false,
  }));
}

function initialFleetView(): FleetView {
  return {
    running: false,
    step: 0,
    onChain: false,
    chainLabel: "local anvil",
    explorer: null,
    robots: initialRobots(),
    ledger: [],
    // no timestamp on the seed line → no SSR/client hydration mismatch
    log: [{ t: "", msg: "Fleet idle. Press Run to start the shift." }],
  };
}

export function useFleet() {
  const [view, setViewState] = useState<FleetView>(initialFleetView);
  const ref = useRef<FleetView>(view);
  function setView(patch: Partial<FleetView> | ((v: FleetView) => FleetView)) {
    const next = typeof patch === "function" ? patch(ref.current) : { ...ref.current, ...patch };
    ref.current = next;
    setViewState(next);
  }
  function log(msg: string, cls?: string) {
    setView((v) => ({ ...v, log: [...v.log, { t: time(), msg, cls }] }));
  }

  const worldRef = useRef<World>(createWorld());
  const brainRef = useRef(new SimBrain());
  const enginesRef = useRef<Map<string, Engine>>(new Map());
  const initedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const busyRef = useRef(false); // guards against overlapping sends on the shared anvil wallet

  const chainRef = useRef<FleetChain | null>(null); // armed target, set by setOnChain

  function ensureEngines() {
    if (initedRef.current) return;
    const chain = ref.current.onChain ? chainRef.current : null;
    for (const s of FLEET) {
      // on-chain: an engine per robot, all sharing one wallet (burner/anvil) or
      // the relay endpoint; anchors are sent sequentially (see stepOnce), so a
      // single shared signer is nonce-safe.
      const e = !chain
        ? createSimEngine()
        : chain.kind === "relay"
          ? createRelayEngine({ log })
          : createChainEngine({ contract: chain.contract, log });
      void e.grant(s.id, s.budget); // grant sets the local budget closure synchronously
      enginesRef.current.set(s.id, e);
    }
    initedRef.current = true;
  }

  async function stepOnce() {
    if (busyRef.current) return; // don't overlap sends on the one shared anvil wallet
    busyRef.current = true;
    try {
      ensureEngines();
      const w = worldRef.current;
      const robots = [...ref.current.robots];
      const ledger: FleetLedgerRow[] = [...ref.current.ledger];
      const logs = [...ref.current.log];

      for (let i = 0; i < FLEET.length; i++) {
        const spec = FLEET[i];
        const rv = robots[i];
        const seq = rv.seq;
        const c = runCycle(spec, w, brainRef.current, seq);
        const engine = enginesRef.current.get(spec.id)!;
        const r = await engine.act(spec.id, c.cost, c.attestation.root);

        // only render/record an action that ACTUALLY anchored (on-chain mode can fail)
        if (!r.anchored) {
          robots[i] = { ...rv, status: "blocked", phase: "idle", carrying: false };
          logs.push({ t: time(), msg: `${spec.name} · action NOT anchored (chain error)`, cls: "err" });
          continue;
        }

        robots[i] = {
          ...rv,
          status: "anchored",
          phase: "acting",
          carrying: true,
          lastWithin: r.within,
          seq: seq + 1,
          budgetHandle: handleFor("rem:" + spec.id, seq + 1),
          justAnchored: true,
          // route to the pallet cell where the robot picks up
          targetX: spec.pallet[0],
          targetY: spec.pallet[1],
        };
        ledger.push({ robotId: spec.id, seq, within: r.within, root: c.attestation.root, tx: r.tx });
        const v = r.within === true ? "within ✓" : r.within === false ? "over ⊘" : "sealed";
        logs.push({
          t: time(),
          msg: `${spec.name} · attested + anchored ${c.attestation.root.slice(0, 10)}… · ${v}`,
          cls: r.within === false ? "pending" : "ok",
        });
      }

      worldRef.current = tick(w);
      setView({ robots, ledger, log: logs, step: worldRef.current.step });
    } finally {
      busyRef.current = false;
    }

    // clear the anchor pulse shortly after (drives ProofBeam), and send the robot home
    setTimeout(() => {
      setView((s) => ({
        ...s,
        robots: s.robots.map((rr) => {
          const home = homeById.get(rr.id) ?? [rr.x, rr.y];
          return {
            ...rr,
            justAnchored: false,
            status: "idle",
            phase: "idle",
            carrying: false,
            targetX: home[0],
            targetY: home[1],
          };
        }),
      }));
    }, 400);
  }

  function run() {
    if (ref.current.running) return;
    ensureEngines();
    setView({ running: true });
    intervalRef.current = setInterval(() => {
      if (worldRef.current.step >= MAX_STEPS) {
        stop();
        setView((s) => ({
          ...s,
          log: [...s.log, { t: time(), msg: "Shift complete. Every action attested + anchored; only the operator can unseal budgets.", cls: "ok" }],
        }));
        return;
      }
      void stepOnce();
    }, reduced() ? 250 : 1300);
  }

  function stop() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setView({ running: false });
  }

  function step() {
    if (ref.current.running) return;
    if (worldRef.current.step >= MAX_STEPS) return;
    void stepOnce();
  }

  function reset() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    worldRef.current = createWorld();
    enginesRef.current = new Map();
    initedRef.current = false;
    ensureEngines();
    // preserve the armed on-chain target across a reset
    setView({
      ...initialFleetView(),
      onChain: ref.current.onChain,
      chainLabel: ref.current.chainLabel,
      explorer: ref.current.explorer,
    });
  }

  async function setOnChain(v: boolean) {
    const chain = v ? await resolveFleetChain() : null;
    chainRef.current = chain;
    if (v && !chain) {
      setView({ onChain: false });
      log(
        "No on-chain target — relayer offline and no local burner/anvil. Staying in sim.",
        "err",
      );
      return;
    }
    setView({ onChain: v, chainLabel: chain?.label ?? "local anvil", explorer: chain?.explorer ?? null });
    reset(); // rebuild engines against the new mode
    log(
      v
        ? `Fleet armed on-chain (${chain!.label}). Every action anchors a REAL tx.`
        : "Fleet back in simulation.",
      v ? "ok" : "pending",
    );
  }

  async function revealRobot(id: string) {
    ensureEngines();
    const engine = enginesRef.current.get(id);
    if (!engine) return;
    const r = await engine.reveal(id);
    setView((s) => ({
      ...s,
      robots: s.robots.map((rr) => (rr.id === id ? { ...rr, budgetClear: r.remainingClear } : rr)),
    }));
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { view, actions: { run, stop, step, reset, revealRobot, setOnChain } };
}

export type FleetActions = ReturnType<typeof useFleet>["actions"];
