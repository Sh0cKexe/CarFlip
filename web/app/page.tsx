import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Logo from "@/app/components/Logo";
import Link from "next/link";
import { DISCORD_URL } from "@/lib/discord";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-bg text-zinc-200">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Logo height={28} />
          <Link
            href="/login"
            className="rounded-lg border border-border px-4 py-1.5 text-sm text-zinc-300 transition hover:border-accent/50 hover:text-accent"
          >
            Přihlásit se
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-20 pt-36">
        {/* Background blobs */}
        <div
          className="animate-blob pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #22c55e 0%, transparent 70%)" }}
        />
        <div
          className="animate-blob-slow pointer-events-none absolute -right-40 top-20 h-[500px] w-[500px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)" }}
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <span className="mb-5 inline-block rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1 text-xs font-medium text-accent">
            🔒 Uzavřená skupina · přístup jen na pozvání
          </span>

          <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Najdi podhodnocené auto{" "}
            <span className="text-gradient">dřív než ostatní</span>
          </h1>

          <p className="mx-auto mb-8 max-w-xl text-base text-zinc-400 sm:text-lg">
            FlipniTo sleduje inzertní portály v 6 zemích 24/7, automaticky počítá předpokládaný
            zisk v Kč nebo eurech a pošle ti notifikaci.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-gradient-to-r from-accent to-accent2 px-6 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:shadow-glow-lg"
            >
              💬 Chci pozvánku
            </a>
          </div>
        </div>

        {/* Telegram notification mock */}
        <div className="mx-auto mt-14 max-w-sm">
          <div className="glass rounded-2xl border border-border shadow-glow-lg overflow-hidden">
            {/* Photo placeholder */}
            <div className="relative h-36 w-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
              <span className="text-5xl opacity-30">🚗</span>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                <span className="text-[10px] font-medium text-white/80">Nový nález · právě teď</span>
              </div>
            </div>

            {/* Bot header */}
            <div className="flex items-center gap-2 border-b border-border/40 px-4 py-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 text-sm">🤖</div>
              <div>
                <p className="text-xs font-semibold text-white">FlipniTo Bot</p>
                <p className="text-[10px] text-zinc-500">Telegram</p>
              </div>
            </div>

            {/* Message body */}
            <div className="p-4">
              <p className="mb-2 text-sm font-bold text-white">Skoda Roomster 1.2 TSI</p>

              <div className="mb-3 inline-flex items-center gap-1.5 rounded-lg bg-accent/15 px-3 py-1.5">
                <span className="text-sm">💰</span>
                <span className="text-sm font-bold text-accent">Zisk: 38 630 Kč</span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Cena v PL</span>
                  <span className="text-white font-medium">9 900 PLN (≈ 56 370 Kč)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Odhad prodej CZ</span>
                  <span className="text-white font-medium">105 000 Kč</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Náklady dovoz</span>
                  <span className="text-white font-medium">10 000 Kč</span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {["2011", "182 800 km", "Benzín", "Manuál", "86 KM"].map((tag) => (
                  <span key={tag} className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                    {tag}
                  </span>
                ))}
              </div>

              <p className="mt-2.5 text-[10px] text-zinc-600">📍 Marklowice, Polsko</p>
            </div>
          </div>
        </div>
      </section>

      {/* Jak to funguje */}
      <section className="border-t border-border/40 px-5 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-2xl font-bold text-white sm:text-3xl">
            Jak to funguje?
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                n: "1",
                ikona: "🎯",
                titulek: "Nastav filtry",
                popis: "Vyber značky, modely, generace, rok, cenu, oblasti a zisk na který cílíš. Klidně 10 značek najednou.",
              },
              {
                n: "2",
                ikona: "🤖",
                titulek: "Bot hlídá 24/7",
                popis: "Každých 15 minut bot prochází zahraniční inzertní portály a hledá podhodnocená auta.",
              },
              {
                n: "3",
                ikona: "💬",
                titulek: "Dostaneš zprávu",
                popis: "Telegram notifikace s fotkou, cenou, odhadnutým ziskem v Kč a srovnatelnými inzeráty v ČR nebo na Slovensku.",
              },
            ].map((s) => (
              <div key={s.n} className="glass rounded-2xl border border-border p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                    {s.n}
                  </span>
                  <span className="text-xl">{s.ikona}</span>
                </div>
                <h3 className="mb-1.5 font-semibold text-white">{s.titulek}</h3>
                <p className="text-sm text-zinc-400">{s.popis}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/40 px-5 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-2xl font-bold text-white sm:text-3xl">
            Co v tom je
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { ikona: "🌍", titulek: "6 zdrojových trhů", popis: "Polsko, Německo, Rakousko, Itálie, Česko, Slovensko." },
              { ikona: "📊", titulek: "Odhad zisku v reálném čase", popis: "Porovnání s aktuálními inzeráty v ČR a na Slovensku, median z reálných dat." },
              { ikona: "🔍", titulek: "Filtry na generace", popis: "Golf Mk7, BMW E39, Octavia III — nehledáš naslepo celou řadu." },
              { ikona: "🤖", titulek: "AI rozbor inzerátu", popis: "Shrnutí, typické závady modelu, red flags a doporučení pro každý inzerát." },
              { ikona: "🔧", titulek: "AI mechanik", popis: "Na co se zaměřit při prohlídce, typické slabiny konkrétního modelu a co kontrolovat před koupí." },
              { ikona: "📝", titulek: "AI generátor inzerátu", popis: "Napiš pár vět a bot za tebe sestaví prodejní inzerát v češtině připravený k publikaci." },
              { ikona: "📁", titulek: "Evidence flipů", popis: "Eviduj auta co máš, přidávej náklady, fotky a sleduj zisk." },
              { ikona: "🔒", titulek: "Uzavřená skupina", popis: "Přístup jen přes pozvánku. Žádné davy, žádné přetížení trhu." },
            ].map((f) => (
              <div key={f.titulek} className="glass rounded-2xl border border-border p-5 transition hover:border-zinc-600">
                <span className="mb-3 block text-2xl">{f.ikona}</span>
                <h3 className="mb-1 font-semibold text-white">{f.titulek}</h3>
                <p className="text-sm text-zinc-400">{f.popis}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 px-5 py-6 text-center">
        <p className="text-xs text-zinc-600">© 2025 FlipniTo · flipnito.xyz</p>
      </footer>
    </div>
  );
}
