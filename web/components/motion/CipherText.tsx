"use client";

import { useEffect, useRef, useState } from "react";

const HEX = "0123456789abcdef";
const scramble = (len: number) => {
  let s = "";
  for (let i = 0; i < len; i++) s += HEX[Math.floor(Math.random() * 16)];
  return s;
};

/** Shows `value`; on change, animates a hex scramble that settles to it. */
export function CipherText({ value, className }: { value: string; className?: string }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (value === prev.current) return;
    prev.current = value;
    if (!value.startsWith("0x")) {
      setDisplay(value);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }
    const body = value.slice(2);
    const len = body.length;
    let tick = 0;
    const id = setInterval(() => {
      tick++;
      if (tick >= 12) {
        clearInterval(id);
        setDisplay(value);
        return;
      }
      const keep = Math.floor((tick / 12) * len);
      setDisplay("0x" + body.slice(0, keep) + scramble(len - keep));
    }, 34);
    return () => clearInterval(id);
  }, [value]);

  return <span className={className}>{display}</span>;
}
