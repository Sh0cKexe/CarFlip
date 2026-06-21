"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function Nav({ email }: { email: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  async function odhlasit() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const odkaz = (href: string, text: string) => (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm transition ${
        pathname.startsWith(href) ? "bg-accent2 text-white" : "text-zinc-400 hover:text-zinc-200"
      }`}
    >
      {text}
    </Link>
  );

  return (
    <header className="mb-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <span className="text-2xl">🚗</span> CarFlip
        </span>
        <nav className="flex items-center gap-1 rounded-lg bg-panel2 p-1">
          {odkaz("/dashboard", "Nastavení")}
          {odkaz("/auta", "Moje auta")}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-500">{email}</span>
        <button onClick={odhlasit} className="rounded-lg border border-border px-3 py-1.5 text-sm text-zinc-300 hover:bg-panel2">
          Odhlásit
        </button>
      </div>
    </header>
  );
}
