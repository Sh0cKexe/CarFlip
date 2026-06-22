"use client";

/* eslint-disable @next/next/no-img-element */
import { motion } from "framer-motion";

export default function Logo({ height = 32 }: { height?: number }) {
  return (
    <motion.span
      whileHover={{ scale: 1.04 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="flex shrink-0 items-center"
      style={{ height }}
    >
      <img src="/logo-flipnito.png" alt="FlipniTo" draggable={false} style={{ height, width: "auto" }} />
    </motion.span>
  );
}
