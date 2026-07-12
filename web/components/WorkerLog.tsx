"use client";

// Hero Worker: the community work log. Real builders log a task; each becomes a
// tamper-evident receipt computed with the same keccak hash chain the anchor
// verifies. Keys never touch this page: people log, the team anchors the day's
// collected root into HeroProofAnchor on-chain.
//
// Security: every user input is rendered ONLY as a React {value}. There is no
// dangerouslySetInnerHTML and no HTML is built from input, so stored/reflected
// XSS is impossible by construction. A hidden honeypot drops bots, input lengths
// are capped, and the required email is validated but never enters a receipt or
// the export.

import { useMemo, useRef, useState } from "react";
import {
  EMAIL_RE,
  HUBS,
  SHEET_ENDPOINT,
  TASK_TYPES,
  makeReceipt,
  sessionRoot,
  type Receipt,
  type Task,
} from "@/lib/log-core";
import type { RecordStep } from "@/lib/types";
import { EXPLORER } from "@/lib/constants";
import deployment from "@/lib/deployed.sepolia.json";

const ANCHOR = (deployment as { anchor: string }).anchor;

const inputCls =
  "w-full rounded-lg border border-line bg-panel2 px-3 py-[11px] font-body text-[15px] text-white placeholder:text-dim transition-colors focus:border-acid focus:outline-none focus-visible:border-acid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid";

const labelCls =
  "mb-1.5 mt-4 block font-mono text-[11px] uppercase tracking-[1px] text-muted";

async function postToSheet(fields: Record<string, unknown>) {
  if (!SHEET_ENDPOINT) return;
  try {
    await fetch(SHEET_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
  } catch {
    // Never block the UI on capture.
  }
}

interface Logged {
  task: Task;
  root: string;
  rec: RecordStep;
}

export function WorkerLog() {
  const [hub, setHub] = useState<string>(HUBS[0]);
  const [type, setType] = useState<string>(TASK_TYPES[0]);
  const [who, setWho] = useState("");
  const [email, setEmail] = useState("");
  const [hours, setHours] = useState("");
  const [what, setWhat] = useState("");
  const [company, setCompany] = useState(""); // honeypot: humans never see it

  const [emailError, setEmailError] = useState<string | null>(null);
  const [last, setLast] = useState<Receipt | null>(null);
  const [session, setSession] = useState<Logged[]>([]);
  const [copied, setCopied] = useState(false);

  const whoRef = useRef<HTMLInputElement | null>(null);
  const copyTimer = useRef<number | null>(null);

  const dayRoot = useMemo(
    () => sessionRoot(session.map((s) => s.rec)),
    [session],
  );

  function record() {
    // Honeypot: a filled hidden field means a bot. Treat as done, drop it.
    if (company.trim() !== "") {
      setWhat("");
      setHours("");
      whoRef.current?.focus();
      return;
    }

    const em = email.trim();
    if (em === "") {
      setEmailError("Email is required.");
      return;
    }
    if (!EMAIL_RE.test(em)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setEmailError(null);

    const task: Task = {
      hub,
      who: who.trim(),
      type,
      what: what.trim(),
      hours: hours === "" ? undefined : Number(hours),
    };
    const recordedAt = new Date().toISOString();
    const r = makeReceipt(task, recordedAt);

    setLast(r);
    setSession((prev) => [...prev, { task, root: r.root, rec: r.rec }]);

    // Contact capture. Email rides here as metadata only; it is never in the
    // task, the receipt, or the exported JSON.
    void postToSheet({
      ts: recordedAt,
      hub: task.hub,
      who: task.who,
      email: em,
      type: task.type,
      what: task.what,
      hours: task.hours === undefined ? "" : task.hours,
      root: r.root,
    });

    // Reset so the next entry starts clean.
    setType(TASK_TYPES[0]);
    setWho("");
    setEmail("");
    setHours("");
    setWhat("");
    whoRef.current?.focus();
  }

  function copyDay() {
    const payload = JSON.stringify(
      {
        dayRoot,
        count: session.length,
        tasks: session.map((s) => ({ root: s.root, rec: s.rec })),
      },
      null,
      2,
    );
    const done = () => {
      setCopied(true);
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 1600);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(payload).then(done, done);
    } else {
      done();
    }
  }

  const has = session.length > 0;

  return (
    <main className="mx-auto max-w-[760px] px-4 pb-16 pt-7 md:px-6">
      <p className="mb-2.5 mt-2 font-mono text-[11px] uppercase tracking-[2px] text-acid">
        We are our own first customer
      </p>
      <h1 className="mb-3 font-disp text-[25px] font-bold leading-[1.15] tracking-[-0.3px] text-white sm:text-[30px]">
        Hero Worker: log your verified work.
      </h1>
      <p className="mb-4 max-w-[62ch] text-[15px] text-muted">
        Our own agent records community work, and every task becomes a
        tamper-evident receipt. The day&apos;s root anchors on-chain into the
        same Rust on Arbitrum Stylus contract behind the fleet, so anyone can
        verify the work happened without trusting us. Builders across Rust
        School and Swarm Village are logging now.
      </p>

      <div className="mb-[26px] flex items-start gap-2.5 rounded-[10px] border border-line border-l-2 border-l-acid bg-panel2 px-3.5 py-3 text-[13px] text-muted">
        <span aria-hidden="true">&bull;</span>
        <span>
          <b className="font-semibold text-white">Keys never touch this page.</b>{" "}
          You log; the team anchors the collected root on Arbitrum. Your email is
          contact only, never in a receipt.
        </span>
      </div>

      <form
        className="rounded-xl border border-line bg-panel p-5"
        onSubmit={(e) => {
          e.preventDefault();
          record();
        }}
      >
        <div className="flex flex-col gap-x-3 sm:flex-row">
          <div className="min-w-0 flex-1">
            <label htmlFor="hub" className={labelCls}>
              Hub
            </label>
            <select
              id="hub"
              value={hub}
              onChange={(e) => setHub(e.target.value)}
              className={inputCls}
            >
              {HUBS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0 flex-1">
            <label htmlFor="type" className={labelCls}>
              Task type
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={inputCls}
            >
              {TASK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label htmlFor="who" className={labelCls}>
          Who
        </label>
        <input
          id="who"
          ref={whoRef}
          value={who}
          onChange={(e) => setWho(e.target.value)}
          maxLength={80}
          placeholder="your name or handle"
          autoComplete="off"
          className={inputCls}
        />

        <div className="flex flex-col gap-x-3 sm:flex-row">
          <div className="min-w-0 flex-[2]">
            <label htmlFor="email" className={labelCls}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              maxLength={120}
              placeholder="you@example.com"
              autoComplete="off"
              aria-invalid={emailError ? true : undefined}
              aria-describedby={emailError ? "email-err" : undefined}
              className={inputCls}
            />
          </div>
          <div className="min-w-0 flex-1">
            <label htmlFor="hours" className={labelCls}>
              Hours
            </label>
            <input
              id="hours"
              type="number"
              step="0.5"
              min="0"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="1.5"
              className={inputCls}
            />
          </div>
        </div>

        {emailError && (
          <p
            id="email-err"
            role="alert"
            className="mt-1.5 font-mono text-[12px] text-err"
          >
            {emailError}
          </p>
        )}

        <label htmlFor="what" className={labelCls}>
          What did you do?
        </label>
        <input
          id="what"
          value={what}
          onChange={(e) => setWhat(e.target.value)}
          maxLength={200}
          placeholder="Shipped the Stylus anchor port"
          autoComplete="off"
          className={inputCls}
        />

        {/* Honeypot: visually hidden, off the tab order, hidden from AT. */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "-9999px",
            width: "1px",
            height: "1px",
            overflow: "hidden",
          }}
        >
          <label htmlFor="company">Company</label>
          <input
            id="company"
            name="company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="mt-5 w-full rounded-lg border border-acid bg-acid px-4 py-[13px] font-mono text-[13px] font-bold uppercase tracking-[1px] text-bg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid"
        >
          Log task
        </button>

        {last && (
          <div
            role="status"
            aria-live="polite"
            className="mt-[18px] rounded-[10px] border border-line bg-panel2 p-3.5 text-[14px]"
          >
            <span className="font-bold text-acid">
              RECORDED · tamper-evident receipt
            </span>
            <div className="mt-2 break-all font-mono text-[11px] text-muted">
              receipt: {last.root}
            </div>
          </div>
        )}
      </form>

      <div className="mb-1 mt-[30px] flex items-center justify-between gap-2.5">
        <h2 className="m-0 font-disp text-[15px] font-medium text-white">
          This session
        </h2>
        {has && (
          <span className="rounded-full border border-line px-3 py-1 font-mono text-[11px] uppercase tracking-[1px] text-muted">
            {session.length} {session.length === 1 ? "task" : "tasks"}
          </span>
        )}
      </div>

      {has && (
        <ul className="mt-2 list-none p-0">
          {session.map((s, i) => (
            <li
              key={i}
              className="flex items-center gap-2 border-t border-line2 py-[9px] text-[13px] text-muted"
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-acid"
                aria-hidden="true"
              />
              <span className="text-white">{s.task.who || "anon"}</span> ·{" "}
              {s.task.hub} · {s.task.type}
              {s.task.what ? <> · {s.task.what}</> : null} ·{" "}
              <span className="font-mono text-[11px] text-dim">
                {s.root.slice(0, 14)}&hellip;
              </span>
            </li>
          ))}
        </ul>
      )}

      {has && (
        <div className="mt-[18px]">
          <label className={labelCls}>Day root (the team anchors this)</label>
          <div className="mt-1.5 break-all rounded-lg border border-line bg-panel2 px-3 py-[11px] font-mono text-[12px] text-acid">
            {dayRoot}
          </div>
          <button
            type="button"
            onClick={copyDay}
            className="mt-4 w-full rounded-lg border border-line bg-transparent px-4 py-[13px] font-mono text-[13px] font-bold uppercase tracking-[1px] text-acid transition-colors hover:border-acid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid"
          >
            {copied ? "Copied" : "Copy day JSON"}
          </button>
          <p className="mt-3 text-[12px] leading-relaxed text-muted">
            What happens next: the team anchors this one root into{" "}
            <a
              href={`${EXPLORER}/address/${ANCHOR}`}
              target="_blank"
              rel="noreferrer"
              className="text-acid underline decoration-dim underline-offset-4 hover:decoration-acid"
            >
              HeroProofAnchor
            </a>{" "}
            on Arbitrum. Every task above is then independently verifiable,
            forever, from one transaction. You keep your receipt; the chain keeps
            the proof.
          </p>
        </div>
      )}

      <p className="mt-10 border-t border-line2 pt-4 font-mono text-[9.5px] uppercase tracking-[0.14em] text-dim">
        Hero Worker · Arbitrum Sepolia · no wallet, no signature on this page ·
        tamper evident
      </p>
    </main>
  );
}
