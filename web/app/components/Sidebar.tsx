"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { T, type Trh } from "@/lib/i18n";

export default function Sidebar({ email, trh }: { email: string; trh?: Trh }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const t = T(trh);

  async function odhlasit() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const polozky = [
    { href: "/dashboard/bot", ikona: "🤖", text: t.nastaveniBota },
    { href: "/dashboard/filtry", ikona: "🔍", text: t.filtryHledani },
    { href: "/dashboard/ziskovost", ikona: "💰", text: t.ziskovost },
    { href: "/auta", ikona: "📋", text: t.mojeAuta },
  ];

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col bg-sidebar text-slate-300">
      <div className="flex items-center gap-2 px-5 py-6 text-lg font-semibold text-white">
        <span className="text-2xl">🚗</span> CarFlip
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {polozky.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
              pathname.startsWith(p.href)
                ? "bg-accent text-white font-medium"
                : "text-slate-300 hover:bg-sidebar2 hover:text-white"
            }`}
          >
            <span>{p.ikona}</span>
            {p.text}
          </Link>
        ))}
      </nav>
      <div className="border-t border-sidebar2 px-5 py-4">
        <p className="mb-2 truncate text-xs text-slate-400">{email}</p>
        <button
          onClick={odhlasit}
          className="w-full rounded-lg border border-sidebar2 px-3 py-2 text-sm text-slate-300 transition hover:bg-sidebar2 hover:text-white"
        >
          {t.odhlasit}
        </button>
      </div>
    </aside>
  );
}
