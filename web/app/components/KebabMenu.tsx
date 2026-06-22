"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function KebabMenu({ children }: { children: React.ReactNode }) {
  const [otevreno, setOtevreno] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!otevreno) return;
    function zavrit(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOtevreno(false);
    }
    window.addEventListener("click", zavrit);
    return () => window.removeEventListener("click", zavrit);
  }, [otevreno]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOtevreno(!otevreno);
        }}
        aria-label="Možnosti"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-lg text-zinc-400 transition hover:bg-sidebar2 hover:text-white"
      >
        ⋮
      </button>
      <AnimatePresence>
        {otevreno && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOtevreno(false)}
            className="glass absolute right-0 top-full z-20 mt-1 min-w-[150px] overflow-hidden rounded-lg border border-border py-1 shadow-glow-lg"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function KebabPolozka({
  onClick, danger = false, children,
}: { onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full px-3 py-2 text-left text-sm transition hover:bg-sidebar2 ${
        danger ? "text-red-400" : "text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}
