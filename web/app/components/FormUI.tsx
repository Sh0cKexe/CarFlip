"use client";

import { motion } from "framer-motion";

export function Sekce({
  titulek, children, badge,
}: { titulek: string; children: React.ReactNode; badge?: { text: string; tone: "green" | "zinc" } }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="glass mb-6 rounded-2xl border border-border p-6 transition-shadow duration-300 hover:shadow-glow"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-100">{titulek}</h2>
        {badge && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              badge.tone === "green" ? "bg-accent/15 text-accent" : "bg-zinc-700/40 text-zinc-300"
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>
      {children}
    </motion.section>
  );
}

export function Pole({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-zinc-300">{label}</label>
      {children}
    </div>
  );
}

export function Toggle({
  checked, onChange, label,
}: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-200">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${checked ? "bg-accent" : "bg-zinc-700"}`}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
          style={{ left: checked ? "1.375rem" : "0.125rem" }}
        />
      </button>
      {label}
    </label>
  );
}

export const input =
  "w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-accent2/60 focus:ring-2 focus:ring-accent2";

export const btnPrimary =
  "rounded-lg bg-gradient-to-r from-accent to-accent2 px-6 py-2.5 text-sm font-semibold text-white shadow-glow transition-all duration-200 hover:brightness-110 hover:shadow-glow-lg active:scale-[0.97] disabled:opacity-60 disabled:active:scale-100";

export const btnGhost =
  "rounded-lg border border-accent2/50 px-4 py-2 text-sm text-accent2 transition-all duration-200 hover:bg-accent2/10 hover:border-accent2 active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100";

export const btnDanger =
  "rounded-lg border border-red-500/40 px-3 py-1.5 text-sm text-red-400 transition-all duration-200 hover:bg-red-500/10 hover:border-red-500/70 active:scale-[0.97]";
