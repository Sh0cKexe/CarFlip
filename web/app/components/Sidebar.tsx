"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { T, type Trh } from "@/lib/i18n";
import Logo from "@/app/components/Logo";

export default function Sidebar({ email, trh, userId }: { email: string; trh?: Trh; userId?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const t = T(trh);
  const [dnyDoVyprseni, setDnyDoVyprseni] = useState<number | null>(null);
  const [otevreno, setOtevreno] = useState(false);
  const [infoOtevreno, setInfoOtevreno] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase.from("pristup").select("pristup_do").eq("user_id", userId).single().then(({ data }) => {
      if (!data) return;
      const ms = new Date(data.pristup_do).getTime() - Date.now();
      setDnyDoVyprseni(Math.ceil(ms / (1000 * 60 * 60 * 24)));
    });
  }, [userId, supabase]);

  useEffect(() => {
    setOtevreno(false);
  }, [pathname]);

  async function odhlasit() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function zmenitTrh(novy: Trh) {
    if (!userId) return;
    await supabase.from("nastaveni").update({ trh: novy }).eq("user_id", userId);
    router.refresh();
  }

  const polozky = [
    { href: "/dashboard", ikona: "📊", text: t.prehled, presne: true },
    { href: "/dashboard/ai", ikona: "🤖", text: t.aiRozborNadpis, presne: true },
    { href: "/dashboard/ai-inzerat", ikona: "📝", text: t.aiInzeratNadpis, presne: true },
    { href: "/dashboard/ai-mechanik", ikona: "🔧", text: t.aiMechanikNadpis, presne: true },
    { href: "/dashboard/bot", ikona: "🛠️", text: t.nastaveniBota, presne: true },
    { href: "/dashboard/filtry", ikona: "🔍", text: t.filtryHledani, presne: true },
    { href: "/auta", ikona: "📋", text: t.mojeAuta },
  ];

  return (
    <>
      <div
        style={{ touchAction: "pan-y" }}
        className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-sidebar2 bg-sidebar px-4 md:hidden"
      >
        <Link href="/dashboard" className="flex items-center">
          <Logo height={26} />
        </Link>
        <button
          onClick={() => setOtevreno(!otevreno)}
          aria-label="Menu"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-2xl text-zinc-200 transition hover:bg-sidebar2"
        >
          {otevreno ? "✕" : "☰"}
        </button>
      </div>

      <AnimatePresence>
        {otevreno && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOtevreno(false)}
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        style={{ touchAction: "pan-y" }}
        className={`fixed top-0 z-50 flex h-screen w-72 shrink-0 flex-col overflow-x-hidden overflow-y-auto overscroll-contain border-r border-sidebar2 bg-sidebar text-zinc-200 transition-transform duration-300 md:sticky md:z-auto md:w-60 md:translate-x-0 ${
          otevreno ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link href="/dashboard" className="hidden items-center px-5 py-6 transition hover:opacity-90 md:flex">
          <Logo height={30} />
        </Link>
        <div className="h-14 shrink-0 md:hidden" />
        <nav className="space-y-1 px-3 pt-3 md:flex-1">
          {polozky.map((p) => {
            const aktivni = p.presne ? pathname === p.href : pathname.startsWith(p.href);
            return (
              <Link
                key={p.href}
                href={p.href}
                onClick={() => setOtevreno(false)}
                className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  aktivni ? "font-medium text-white" : "text-zinc-200 hover:bg-sidebar2 hover:text-white"
                }`}
              >
                {aktivni && (
                  <motion.span
                    layoutId="sidebar-active"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-accent to-accent2 shadow-glow"
                  />
                )}
                <span className="relative z-10">{p.ikona}</span>
                <span className="relative z-10">{p.text}</span>
              </Link>
            );
          })}
        </nav>
        <div className="shrink-0 border-t border-sidebar2 bg-sidebar2/40 px-5 py-4">
          <div className="mb-3">
            <div className="group relative mb-1 flex items-center gap-1.5">
              <span className="text-xs text-zinc-300">{t.trh}</span>
              <button
                type="button"
                onClick={() => setInfoOtevreno(!infoOtevreno)}
                className="flex h-4 w-4 items-center justify-center rounded-full border border-zinc-400 text-[10px] text-zinc-300"
              >
                i
              </button>
              <div
                className={`absolute bottom-full left-0 z-10 mb-2 w-56 rounded-lg bg-sidebar2 p-3 text-sm leading-relaxed text-zinc-100 shadow-lg transition ${
                  infoOtevreno ? "visible opacity-100" : "invisible opacity-0 group-hover:visible group-hover:opacity-100"
                }`}
              >
                {t.trhInfo}
              </div>
            </div>
            <select
              className="w-full rounded-lg border border-zinc-600 bg-sidebar2 px-2.5 py-2 text-sm text-white outline-none transition focus:border-accent2/60"
              value={trh ?? "cz"}
              onChange={(e) => zmenitTrh(e.target.value as Trh)}
            >
              <option value="cz">{t.trhKratceCz}</option>
              <option value="sk">{t.trhKratceSk}</option>
            </select>
          </div>
          <p className="mb-1 truncate text-xs text-zinc-300">{email}</p>
          {dnyDoVyprseni !== null && (
            <p className={`mb-2 text-xs font-medium ${dnyDoVyprseni <= 3 ? "text-red-400" : "text-zinc-400"}`}>
              {dnyDoVyprseni <= 0 ? t.vyprsiDnes : `${dnyDoVyprseni} ${t.dniDoVyprseniPredlozka}`}
            </p>
          )}
          <button
            onClick={odhlasit}
            className="w-full rounded-lg border border-zinc-600 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-sidebar2 hover:text-white active:scale-[0.98]"
          >
            {t.odhlasit}
          </button>
        </div>
      </aside>
    </>
  );
}
