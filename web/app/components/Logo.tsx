"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const SIRKA_PUVODNI = 585;
const VYSKA_PUVODNI = 192;

export default function Logo({ height = 32 }: { height?: number }) {
  const width = Math.round((height * SIRKA_PUVODNI) / VYSKA_PUVODNI);
  return (
    <motion.span
      whileHover={{ scale: 1.04 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="flex shrink-0 items-center"
      style={{ height }}
    >
      <Image src="/logo-flipnito.png" alt="FlipniTo" width={width} height={height} draggable={false} priority />
    </motion.span>
  );
}
