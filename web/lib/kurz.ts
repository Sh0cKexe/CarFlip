"use client";

import { useEffect, useState } from "react";

export type Kurz = { pln_czk: number; eur_czk: number };
export type Mena = "PLN" | "CZK" | "EUR";

// Stejna zalozni hodnota jako kurz.py, pro pripad ze /api/kurz nejede.
export const KURZ_ZALOHA: Kurz = { pln_czk: 5.7, eur_czk: 25.2 };

function naCZK(hodnota: number, mena: Mena, k: Kurz): number {
  if (mena === "CZK") return hodnota;
  if (mena === "PLN") return hodnota * k.pln_czk;
  return hodnota * k.eur_czk;
}

function zCZK(hodnotaCzk: number, mena: Mena, k: Kurz): number {
  if (mena === "CZK") return hodnotaCzk;
  if (mena === "PLN") return hodnotaCzk / k.pln_czk;
  return hodnotaCzk / k.eur_czk;
}

/** Prevede castku z jedne meny do druhe (pres CZK jako pivot). */
export function prevod(hodnota: number, z: Mena, na: Mena, k: Kurz): number {
  if (z === na) return hodnota;
  return zCZK(naCZK(hodnota, z, k), na, k);
}

/** Nacte aktualni kurz (denne cachovany na serveru), do nacteni zalozni hodnota. */
export function useKurz(): Kurz {
  const [k, setK] = useState<Kurz>(KURZ_ZALOHA);
  useEffect(() => {
    fetch("/api/kurz")
      .then((r) => r.json())
      .then((j) => {
        if (j?.pln_czk && j?.eur_czk) setK(j);
      })
      .catch(() => {});
  }, []);
  return k;
}
