"use client";

import { useRef, useState } from "react";
import { ethers } from "ethers";
import { createSimEngine } from "./simEngine";
import { createLiveEngine, CA_ABI } from "./liveEngine";
import { createChainEngine } from "./chainEngine";
import { makeLocalContract } from "./localChain";
import { deployedCaAddress } from "./sepoliaChain";
import { buildRoot, actRootFor, handleFor } from "./hash";
import { CHAIN_ID, CHAIN_HEX, RPC, EXPLORER } from "./constants";
import type { Engine, HeroView, LedgerEntry, RecordStep } from "./types";

const DEFAULT_RECORD: RecordStep[] = [
  { step: "AUTHORITY", fields: { grant: "move_pallet", scope: "zone-A", expires: "2026-09-01" } },
  { step: "PERCEIVE", fields: { sensor: "lidar", reading: "pallet @ 1.2m" } },
  { step: "DECIDE", fields: { policy: "v0.3", action: "advance" } },
  { step: "ACT", fields: { actuator: "drive", result: "moved 1.2m" } },
];

const cloneRecord = (r: RecordStep[]): RecordStep[] =>
  r.map((s) => ({ step: s.step, fields: { ...s.fields } }));

const time = () => new Date().toLocaleTimeString([], { hour12: false });
const short = (h: string) =>
  !h ? "—" : h.length > 18 ? `${h.slice(0, 10)}…${h.slice(-6)}` : h;
const startsHex = (s: string) => typeof s === "string" && s.startsWith("0x");
const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const errMsg = (e: unknown) => {
  if (e && typeof e === "object") {
    const o = e as { shortMessage?: string; message?: string };
    return o.shortMessage || o.message || String(e);
  }
  return String(e);
};

function initialView(): HeroView {
  const record = cloneRecord(DEFAULT_RECORD);
  return {
    mode: "sim",
    granted: false,
    revoked: false,
    running: false,
    record,
    recordRoot: buildRoot(record),
    amount: 300,
    limit: 1000,
    agentName: "agent-1",
    ledger: [],
    beat: -1,
    privHandle: "—",
    privClear: null,
    meterOn: 0,
    pub: { anchored: false, root: "—", meta: "—", tx: "" },
    // no timestamp on the seed line → no SSR/client hydration mismatch
    log: [{ t: "", msg: "Simulation ready. Press ▶ Run pitch, or drive it yourself." }],
    net: { account: null, chainOk: false },
    // pre-filled from deployed.sepolia.json once the CA is deployed; "" keeps sim
    caAddress: deployedCaAddress(),
  };
}

async function ensureNetwork(eth: { request: (a: unknown) => Promise<unknown> }) {
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_HEX }] });
  } catch (e) {
    if ((e as { code?: number }).code === 4902) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: CHAIN_HEX,
            chainName: "Arbitrum Sepolia",
            rpcUrls: [RPC],
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            blockExplorerUrls: [EXPLORER],
          },
        ],
      });
    } else {
      throw e;
    }
  }
}

export function useHero() {
  const [view, setViewState] = useState<HeroView>(initialView);
  const ref = useRef<HeroView>(view);

  // setView keeps ref.current in lock-step so async sequences read fresh state.
  function setView(patch: Partial<HeroView> | ((v: HeroView) => HeroView)) {
    const next = typeof patch === "function" ? patch(ref.current) : { ...ref.current, ...patch };
    ref.current = next;
    setViewState(next);
  }
  function log(msg: string, cls?: string) {
    setView((v) => ({ ...v, log: [...v.log, { t: time(), msg, cls }] }));
  }

  const simRef = useRef<Engine>(createSimEngine());
  const engineRef = useRef<Engine>(simRef.current);
  const liveRefs = useRef<{ provider?: ethers.BrowserProvider; signer?: ethers.Signer }>({});

  function connectLocal() {
    const contract = makeLocalContract();
    if (!contract) {
      log("No local deployment found. Run `anvil`, then `make deploy-local`.", "err");
      return;
    }
    engineRef.current = createChainEngine({ contract, log });
    if (ref.current.granted) {
      void engineRef.current.grant(ethers.id(ref.current.agentName), ref.current.limit);
    }
    setView({ mode: "local" });
    log("Connected to local Arbitrum (anvil). Actions now anchor on-chain for real — confidentiality stays simulated.", "ok");
  }

  function pickMode() {
    // once connected to the local chain, don't let wallet/setup changes clobber it
    if (ref.current.mode === "local") return;
    const v = ref.current;
    const wantLive =
      ethers.isAddress(v.caAddress) &&
      !!v.net.account &&
      v.net.chainOk &&
      !!liveRefs.current.signer &&
      !!liveRefs.current.provider;
    if (wantLive && liveRefs.current.provider && liveRefs.current.signer) {
      const contract = new ethers.Contract(v.caAddress, CA_ABI, liveRefs.current.signer);
      engineRef.current = createLiveEngine({
        provider: liveRefs.current.provider,
        signer: liveRefs.current.signer,
        contract,
        account: v.net.account as string,
        log,
      });
      setView({ mode: "live" });
    } else {
      engineRef.current = simRef.current;
      setView({ mode: "sim" });
    }
  }

  async function grant() {
    const v = ref.current;
    if (!(v.limit > 0)) return log("Enter a positive limit to grant.", "err");
    log(
      v.mode === "live"
        ? "Encrypting limit client-side, granting on-chain…"
        : "Granting encrypted authority — the limit never appears in the clear.",
      "pending",
    );
    const r = await engineRef.current.grant(ethers.id(v.agentName), v.limit);
    if (!r.ok) return log("Grant failed.", "err");
    setView((s) => ({
      ...s,
      granted: true,
      revoked: false,
      privHandle: startsHex(r.handle) ? r.handle : handleFor("rem", 0),
      privClear: null,
      meterOn: 10,
      amount: Math.min(s.amount, s.limit),
    }));
    log("Authority granted · budget encrypted. Public side is still empty — nothing has acted yet.", "ok");
  }

  async function doAct(amount: number) {
    const v = ref.current;
    if (!v.granted) return log("Grant an authority first.", "err");
    const seq = v.ledger.length;
    const aRoot = actRootFor(v.recordRoot, seq);
    log(`Agent acts · amount encrypted · anchoring proof ${short(aRoot)}…`, "pending");
    const r = await engineRef.current.act(ethers.id(v.agentName), amount, aRoot);
    if (!r.anchored) return log("Action was not anchored.", "err");
    const entry: LedgerEntry = { seq, within: r.within, root: aRoot, tx: r.tx };
    setView((s) => ({
      ...s,
      ledger: [...s.ledger, entry],
      privClear: null,
      privHandle: handleFor("rem", seq + 1),
      pub: {
        anchored: true,
        root: aRoot,
        meta: `seq ${seq} · ${s.mode === "live" ? "Arbitrum Sepolia" : s.mode === "local" ? "local anvil" : "simulated"}`,
        tx: r.tx,
      },
    }));
    const verdict =
      r.within === true
        ? "within authority ✓"
        : r.within === false
          ? "OVER authority ⊘ — no-op on budget, still anchored, nothing leaked"
          : "sealed 🔒";
    log(`Anchored ${short(aRoot)} · ${verdict}`, r.within === false ? "pending" : "ok");
  }

  const act = () => doAct(ref.current.amount);
  const overSpend = () => doAct(ref.current.limit + 1);

  async function reveal() {
    const v = ref.current;
    if (!v.granted) return log("Nothing to reveal yet.", "err");
    log(
      v.mode === "live"
        ? "Operator creates a permit and unseals remaining…"
        : "Operator unseals remaining — only the permit holder can.",
      "pending",
    );
    const r = await engineRef.current.reveal(ethers.id(v.agentName));
    if (r.remainingClear == null) return log("Reveal unavailable.", "err");
    const remaining = r.remainingClear;
    setView((s) => ({
      ...s,
      privClear: String(remaining),
      meterOn: Math.max(0, Math.round((remaining / (s.limit || remaining || 1)) * 10)),
    }));
    log(
      `Remaining authority = ${remaining} — visible to the operator, still encrypted to everyone else.`,
      "ok",
    );
  }

  async function revoke() {
    const v = ref.current;
    if (!v.granted) return;
    log("Revoking authority · zeroing the encrypted budget…", "pending");
    const r = await engineRef.current.revoke(ethers.id(v.agentName));
    if (!r.ok) return;
    setView((s) => ({
      ...s,
      revoked: true,
      privClear: null,
      meterOn: 0,
      privHandle: handleFor("rev", s.ledger.length),
    }));
    log("Revoked. The next action can draw down nothing.", "ok");
  }

  async function verify() {
    const v = ref.current;
    const last = v.ledger[v.ledger.length - 1];
    if (!last) return log("No proof to verify yet.", "err");
    const r = await engineRef.current.verify(last.root);
    if (r.anchored)
      log(
        `Verified on ${v.mode === "live" ? "Arbitrum" : v.mode === "local" ? "local anvil" : "sim"}: proof ${short(last.root)} is anchored${
          r.submitter ? ` by ${short(r.submitter)}` : ""
        }.`,
        "ok",
      );
    else log(`Proof ${short(last.root)} is NOT anchored.`, "err");
  }

  function reset() {
    simRef.current = createSimEngine();
    if (ref.current.mode === "sim") engineRef.current = simRef.current;
    setView((s) => ({
      ...initialView(),
      mode: s.mode,
      net: s.net,
      caAddress: s.caAddress,
      record: s.record,
      recordRoot: s.recordRoot,
      agentName: s.agentName,
      limit: s.limit,
      amount: s.amount,
    }));
  }

  async function runPitch() {
    if (ref.current.running) return;
    reset();
    setView({ running: true });
    const sleep = (ms: number) =>
      new Promise((res) => setTimeout(res, reducedMotion() ? Math.min(ms, 120) : ms));
    try {
      log("▶ Running the pitch — five beats.", "pending");
      setView({ beat: 0, limit: 1000 });
      await grant();
      await sleep(1300);
      setView({ beat: 1, amount: 300 });
      await doAct(300);
      await sleep(1300);
      setView({ beat: 2, amount: 400 });
      await doAct(400);
      await sleep(1300);
      setView({ beat: 3 });
      await overSpend();
      await sleep(1400);
      setView({ beat: 4 });
      await reveal();
      await sleep(1400);
      await revoke();
      log("Pitch complete. The room saw proofs; only the operator saw the numbers. That gap is the moat.", "ok");
    } finally {
      setView({ running: false });
    }
  }

  async function connect() {
    const eth = (window as unknown as { ethereum?: { request: (a: unknown) => Promise<unknown> } }).ethereum;
    if (!eth) return log("No wallet found — simulation still works. Install MetaMask for live mode.", "pending");
    try {
      const provider = new ethers.BrowserProvider(eth as ethers.Eip1193Provider);
      await provider.send("eth_requestAccounts", []);
      await ensureNetwork(eth);
      const signer = await provider.getSigner();
      const account = await signer.getAddress();
      const net = await provider.getNetwork();
      const chainOk = Number(net.chainId) === CHAIN_ID;
      liveRefs.current = { provider, signer };
      setView({ net: { account, chainOk } });
      log(`Wallet connected: ${account.slice(0, 6)}…${account.slice(-4)}`, "ok");
      if (!chainOk) log("Switch to Arbitrum Sepolia for live mode.", "err");
      pickMode();
    } catch (e) {
      log(`Connect failed: ${errMsg(e)}`, "err");
    }
  }

  function saveSetup(ca: string) {
    setView({ caAddress: ca.trim() });
    pickMode();
    const v = ref.current;
    if (v.mode === "live") log(`Live armed · ConfidentialAuthority ${short(v.caAddress)}`, "ok");
    else log("Saved. Live needs a valid contract + wallet on Arbitrum Sepolia — staying in simulation.", "pending");
  }

  function editRecord(stepIdx: number, key: string, val: string) {
    setView((s) => {
      const record = s.record.map((rec, i) =>
        i === stepIdx ? { ...rec, fields: { ...rec.fields, [key]: val } } : rec,
      );
      return { ...s, record, recordRoot: buildRoot(record) };
    });
  }

  const setAmount = (n: number) => setView({ amount: n });
  const setLimit = (n: number) => setView({ limit: n });
  const setAgentName = (s: string) => setView({ agentName: s });

  return {
    view,
    actions: {
      grant,
      act,
      overSpend,
      revoke,
      reveal,
      verify,
      runPitch,
      reset,
      connect,
      connectLocal,
      saveSetup,
      setAmount,
      setLimit,
      setAgentName,
      editRecord,
    },
  };
}

export type HeroActions = ReturnType<typeof useHero>["actions"];
