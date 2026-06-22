"use client";

import { useEffect, useRef, useState } from "react";

export default function CountUp({ value, formatuj }: { value: number; formatuj: (n: number) => string }) {
  const [zobrazene, setZobrazene] = useState(0);
  const start = useRef<number | null>(null);

  useEffect(() => {
    start.current = null;
    const trvani = 800;
    let frame: number;
    function tick(t: number) {
      if (start.current === null) start.current = t;
      const progres = Math.min((t - start.current) / trvani, 1);
      const eased = 1 - Math.pow(1 - progres, 3);
      setZobrazene(Math.round(value * eased));
      if (progres < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{formatuj(zobrazene)}</>;
}
