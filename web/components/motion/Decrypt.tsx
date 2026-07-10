"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The operator-only cleartext. `null` → shows a sealed placeholder; a value →
 * scramble-resolves digits into the real number (the reveal punchline).
 */
export function Decrypt({
  value,
  sealedClassName,
  clearClassName,
}: {
  value: string | null;
  sealedClassName?: string;
  clearClassName?: string;
}) {
  const [display, setDisplay] = useState<string>(value ?? "•sealed•");
  const [sealed, setSealed] = useState<boolean>(value == null);
  const prev = useRef<string | null>(value);

  useEffect(() => {
    if (value === prev.current) return;
    prev.current = value;
    if (value == null) {
      setSealed(true);
      setDisplay("•sealed•");
      return;
    }
    setSealed(false);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }
    const total = 14;
    let tick = 0;
    const id = setInterval(() => {
      tick++;
      if (tick >= total) {
        clearInterval(id);
        setDisplay(value);
        return;
      }
      let s = "";
      for (let i = 0; i < value.length; i++) {
        s += i < (tick / total) * value.length ? value[i] : String(Math.floor(Math.random() * 10));
      }
      setDisplay(s);
    }, 34);
    return () => clearInterval(id);
  }, [value]);

  return <span className={sealed ? sealedClassName : clearClassName}>{display}</span>;
}
