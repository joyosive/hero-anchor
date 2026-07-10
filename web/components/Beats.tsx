import { Fragment } from "react";
import { BEATS } from "@/lib/constants";

export function Beats({ beat }: { beat: number }) {
  return (
    <>
      <div className="mb-2 flex justify-between font-mono text-[9.5px] uppercase tracking-[1.2px] text-dim">
        <span>Pitch timeline</span>
        <span>{beat < 0 ? "idle" : `${beat + 1}/5 · ${BEATS[beat]}`}</span>
      </div>
      <div className="mb-[18px] mt-1.5 flex items-center">
        {BEATS.map((b, i) => (
          <Fragment key={`${b}-${i}`}>
            {i > 0 && <span className={`h-px flex-1 ${i <= beat ? "bg-acidsoft" : "bg-line2"}`} />}
            <span
              title={b}
              className={`h-[11px] w-[11px] flex-none rounded-full ${
                i <= beat ? "bg-acid shadow-[0_0_12px_rgba(170,255,0,.8)]" : "bg-dim"
              }`}
            />
          </Fragment>
        ))}
      </div>
    </>
  );
}
