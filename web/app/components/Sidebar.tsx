"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { T, type Trh } from "@/lib/i18n";

export default function Sidebar({ email, trh, userId }: { email: string; trh?: Trh; userId?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const t = T(trh);

  async function odhlasit() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function zmenitTrh(novy: Trh) {
    if (!userId) return;
    await supabase.from("nastaveni").update({ trh: novy }).eq("user_id", userId);
    router.refresh();
  }

  const polozky = [
    { href: "/dashboard/bot", ikona: "🤖", text: t.nastaveniBota },
    { href: "/dashboard/filtry", ikona: "🔍", text: t.filtryHledani },
    { href: "/auta", ikona: "📋", text: t.mojeAuta },
  ];

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col bg-sidebar text-zinc-200">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-5 py-6 hover:opacity-90">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent2 text-lg">
          🚗
        </span>
        <span className="text-lg font-semibold tracking-tight text-white">FlipniTo</span>
      </Link>
      <nav className="flex-1 space-y-1 px-3">
        {polozky.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
              pathname.startsWith(p.href)
                ? "bg-accent text-white font-medium"
                : "text-zinc-200 hover:bg-sidebar2 hover:text-white"
            }`}
          >
            <span>{p.ikona}</span>
            {p.text}
          </Link>
        ))}
      </nav>
      <div className="border-t border-sidebar2 px-5 py-4">
        <div className="mb-3">
          <div className="group relative mb-1 flex items-center gap-1.5">
            <span className="text-xs text-zinc-400">{t.trh}</span>
            <span className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-zinc-400 text-[10px] text-zinc-300">
              i
            </span>
            <div className="invisible absolute bottom-full left-0 z-10 mb-2 w-56 rounded-lg bg-sidebar2 p-3 text-sm leading-relaxed text-zinc-100 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
              {t.trhInfo}
            </div>
          </div>
          <select
            className="w-full rounded-lg border border-sidebar2 bg-sidebar2 px-2 py-1.5 text-sm text-white outline-none"
            value={trh ?? "cz"}
            onChange={(e) => zmenitTrh(e.target.value as Trh)}
          >
            <option value="cz">{t.trhKratceCz}</option>
            <option value="sk">{t.trhKratceSk}</option>
          </select>
        </div>
        <p className="mb-2 truncate text-xs text-zinc-400">{email}</p>
        <button
          onClick={odhlasit}
          className="w-full rounded-lg border border-sidebar2 px-3 py-2 text-sm text-zinc-200 transition hover:bg-sidebar2 hover:text-white"
        >
          {t.odhlasit}
        </button>
      </div>
    </aside>
  );
}
