"use client";

import { useEffect, useRef } from "react";
import type { LogLine } from "@/lib/types";

const toneCls = (c?: string) =>
  c === "ok" ? "text-acid" : c === "err" ? "text-err" : c === "pending" ? "text-cyan" : "text-muted";

export function ConsoleLog({ log }: { log: LogLine[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [log]);

  return (
    <div
      ref={ref}
      className="max-h-[220px] min-h-[120px] overflow-auto rounded-[10px] border border-line bg-[#070806] p-3.5 font-mono text-[12px] leading-[1.65]"
    >
      {log.map((ln, i) => (
        <div key={i} className={`break-all ${toneCls(ln.cls)}`}>
          {ln.t && <span className="mr-2 text-dim">{ln.t}</span>}
          {ln.msg}
        </div>
      ))}
    </div>
  );
}
