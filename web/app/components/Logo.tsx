"use client";

/* eslint-disable @next/next/no-img-element */
import { motion } from "framer-motion";

export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <motion.span
      whileHover={{ scale: 1.06, rotate: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-accent to-accent2 shadow-glow"
      style={{ width: size, height: size }}
    >
      <img src="/auto-logo-white.png" alt="" width={size * 0.78} height={size * 0.78} style={{ objectFit: "contain" }} />
    </motion.span>
  );
}
