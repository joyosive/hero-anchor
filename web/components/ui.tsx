import type { ButtonHTMLAttributes } from "react";

const base =
  "font-mono text-[12.5px] uppercase tracking-wide cursor-pointer rounded-lg px-4 py-2.5 transition " +
  "disabled:opacity-30 disabled:cursor-not-allowed disabled:border-dim disabled:text-dim disabled:bg-transparent " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan focus-visible:outline-offset-2";

export const variants = {
  ghost: `${base} border border-line text-muted hover:bg-panel hover:text-white`,
  solid: `${base} border border-acid bg-acid text-[#0A0B09] hover:brightness-110 hover:shadow-[0_0_22px_rgba(170,255,0,.45)]`,
  outline: `${base} border border-acid text-acid hover:bg-acid hover:text-[#0A0B09]`,
  danger: `${base} border border-[rgba(255,84,112,.5)] text-err hover:bg-err hover:text-[#0A0B09]`,
} as const;

export function Btn({
  variant = "ghost",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return <button className={`${variants[variant]} ${className}`} {...props} />;
}

const pillBase =
  "font-mono text-[11.5px] uppercase tracking-[1.2px] rounded-full px-3.5 py-[7px] " +
  "flex items-center gap-2 whitespace-nowrap border";

export function Pill({
  tone = "idle",
  dot,
  children,
}: {
  tone?: "idle" | "ok" | "warn" | "live" | "sim";
  dot?: boolean;
  children: React.ReactNode;
}) {
  const toneCls =
    tone === "ok"
      ? "border-line text-white"
      : tone === "warn"
        ? "border-err text-err"
        : tone === "live"
          ? "border-acid text-acid"
          : "border-line text-muted";
  const dotCls =
    tone === "ok"
      ? "bg-acid"
      : tone === "warn"
        ? "bg-err"
        : tone === "live"
          ? "bg-acid shadow-[0_0_8px_var(--color-acid)]"
          : tone === "sim"
            ? "bg-cyan"
            : "bg-dim";
  return (
    <span className={`${pillBase} ${toneCls}`}>
      {dot && <span className={`h-[7px] w-[7px] rounded-full ${dotCls}`} />}
      {children}
    </span>
  );
}
