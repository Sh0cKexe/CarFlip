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

        {/* Phone + Telegram mockup */}
        <div className="mx-auto mt-14 max-w-[300px]">
          <div className="rounded-[2.8rem] border-2 border-zinc-700 bg-zinc-900 p-2 shadow-glow-lg">
            <div className="overflow-hidden rounded-[2.2rem] bg-[#0e1621]">
              {/* Telegram header */}
              <div className="flex items-center gap-3 border-b border-white/5 bg-[#17212b] px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/20 text-lg">🤖</div>
                <div>
                  <p className="text-sm font-semibold text-white">FlipniTo Bot</p>
                  <p className="text-[11px] text-zinc-500">bot</p>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="text-[10px] text-zinc-500">online</span>
                </div>
              </div>
              {/* Chat background */}
              <div className="bg-[#0e1621] px-3 py-4">
                {/* Bot bubble */}
                <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-[#182533] px-3.5 py-2.5">
                  <div className="space-y-0.5 text-[13px] leading-relaxed">
                    <p className="font-semibold text-white">🚗 Skoda Roomster 1.2 TSI</p>
                    <p className="font-bold text-[#4de469]">💰 Zisk: 38 630 Kč</p>
                    <p className="mt-6 text-zinc-300"><span className="mr-1.5 inline-flex items-center rounded px-1 py-0.5 text-[10px] font-bold bg-red-600 text-white">PL</span>Cena: 9 900 PLN (≈ 56 370 Kč)</p>
                    <p className="text-zinc-300"><span className="mr-1.5 inline-flex items-center rounded px-1 py-0.5 text-[10px] font-bold bg-blue-600 text-white">CZ</span>Odhad prodej: 105 000 Kč</p>
                    <p className="text-zinc-300">📦 Náklady dovoz: 10 000 Kč</p>
                    <p className="mt-6 text-zinc-300">📅 2011 | 182 800 km | Benzyna | Manualna</p>
                    <p className="text-zinc-300">🔧 1.2 l 1.2 TSI | 86 KM / 63 kW</p>
                    <p className="text-zinc-300">🗺️ Marklowice</p>
                  </div>
                  <p className="mt-1.5 text-right text-[10px] text-zinc-600">18:42 ✓✓</p>
                </div>
              </div>
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
                popis: "Každých 15 minut bot prochází inzertní portály a hledá podhodnocená auta.",
              },
              {
                n: "3",
                ikona: "💬",
                titulek: "Dostaneš zprávu",
                popis: "Telegram notifikace s fotkou, cenou, odhadnutým ziskem v Kč nebo eurech a srovnatelnými inzeráty v ČR nebo na Slovensku.",
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
              { ikona: "🔍", titulek: "Filtry na generace", popis: "Golf Mk7, BMW F30, Octavia III — nehledáš naslepo celou řadu." },
              { ikona: "🤖", titulek: "AI rozbor inzerátu", popis: "Shrnutí, typické závady modelu, red flags a doporučení pro každý inzerát." },
              { ikona: "🔧", titulek: "AI mechanik", popis: "Máš auto na dílně a nevíš si rady? Popiš problém, AI tě nasměruje nebo navrhne co zkontrolovat." },
              { ikona: "📝", titulek: "AI generátor inzerátu", popis: "Napiš pár vět a bot za tebe sestaví prodejní inzerát v češtině nebo slovenštině — přímo v aplikaci." },
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
