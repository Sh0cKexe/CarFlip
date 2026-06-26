import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { AI_ROZBOR_LIMIT, zacatekMesice } from "@/lib/aiLimit";
import { nactiKurzServer, type Kurz } from "@/lib/kurzServer";

export const maxDuration = 60;

const SYSTEM_PROMPT = `Jsi expert na ojetá auta a jejich dovoz/import za účelem dalšího prodeje (flip).
Dostaneš data jednoho inzerátu (z Otomoto.pl, Bazoš.cz, Bazoš.sk, AutoScout24 nebo Willhaben.at - JSON nebo prostý text podle zdroje). Napiš stručnou analýzu v ČEŠTINĚ.

DŮLEŽITÉ - formátování: NEPIŠ markdown (žádné ##, žádné **). Místo nadpisů použij emoji + krátký název sekce na vlastním řádku (přesně podle vzoru níže), pod tím normální text/odrážky pomlčkou. Tučný text nepiš vůbec, emoji použij jen jako nadpisy sekcí (ne v každé větě).

DŮLEŽITÉ - web_search nástroj: Máš k dispozici web_search. Používej ho TIŠE – NIKDY do výstupu nepište text jako "Ověřím si...", "Zkusím dotaz...", "Search nevrátil výsledky", "Search nedostupný", "Použiji své znalosti" apod. Pokud hledáš, prostě hledej na pozadí. Pokud search nefunguje nebo nic nenajde, přejdi rovnou na analýzu z vlastních znalostí – BEZ komentáře o tom, že search selhal. Výstup musí být čistá analýza, žádné popisování procesu. Když si u konkrétního motoru (podle kódu motoru a generace, ne jen "1.6 HDi" obecně) NEJSI jistý technickou specifikou (typ rozvodu řemen/řetěz, přesný servisní interval, typický výkon), VYHLEDEJ si to (2-3 dotazy max, cíleně na kód motoru/generaci). Pokud ani search nedá jistou odpověď, daný údaj do výstupu VŮBEC NEPIŠTE – nepřesná informace je horší než žádná.

NA VŮBEC PRVNÍ ŘÁDEK (před vším ostatním, přesně v tomto formátu, nic navíc na ten řádek) napiš:
TITULEK: Značka Model - Rok
(např. "TITULEK: Peugeot Partner 2 - 2012"; když rok nezjistíš, vynech ho)

Pak prázdný řádek a struktura (přesně v tomto pořadí):

🚗 Shrnutí auta
Model, rok, motor, nájezd, cena (cenu napiš PŘESNĚ podle řádku "Cena (přesně dopočítáno):" v datech, nepřepočítávej ji sám) jen jako HOLÝ FAKT/číslo. NIKDY cenu nehodnoť ani nekomentuj (ne "cena je přiměřená", ne "prostor pro flip je malý/velký", ne nic o výhodnosti) - to je věc bota, který reálně srovnává s trhem, ne tvoje. Stav auta v krátkosti.
DŮLEŽITÉ - výkon: vezmi PŘESNOU hodnotu výkonu přímo z dat (ne z paměti/odhadu). Polské "KM" v datech znamená koně (konie mechaniczne), NIKDY to nepiš jako "km" (to je jednotka vzdálenosti, ne výkonu) - vždy napiš "X k (Y kW)". Pokud data dávají jen koně, kW dopočítej (kW = koně × 0,7355, zaokrouhli na celé číslo).

🔧 Co zkontrolovat
Spojí typické známé problémy této motorizace/modelu (z obecných znalostí, NE z textu inzerátu) S tím, co je rozumné zkontrolovat KONKRÉTNĚ při tomto nájezdu. Piš konkrétně k tomuto motoru, ne obecné fráze.
DŮLEŽITÉ - realističnost: kupující u prohlídky má jen VIZUÁLNÍ kontrolu, zkušební jízdu a OBD diagnostiku (vyčtení chybových kódů i živých hodnot/korekcí) - NEMÁ zvedák, nerozebírá motor. Nikdy nepiš rady vyžadující demontáž nebo dílnu (např. "zkontrolovat vůli na turbu", "zkontrolovat ventilovou vůli") - místo toho napiš co se z toho projeví navenek (zvuky/kouř/výkon při jízdě, co ukáže OBD - např. u vstřikovačů korekce za studeného motoru na diagnostice).
DŮLEŽITÉ - nepřeháněj opotřebení: u dílu s dlouhou typickou životností (turbo, DPF apod.) NIKDY nepiš, že je "na hranici životnosti" nebo že něco "už by mělo být vyměněno" jen podle kilometrů, pokud to fakt neříká servisní interval výrobce - tyto díly při dobré péči běžně vydrží i 250-300 tisíc km. Piš to jako "na co si dát pozor"/"co poslouchat", ne jako predikci blížící se poruchy. U DPF/FAP konkrétně: je to opotřebitelná součástka, jejíž životnost hodně závisí na typu provozu (krátké městské jezdy ji zatěžují víc než dálnice) - NEPIŠ že "se běžně nevyměňuje" ani že "určitě potřebuje výměnu", jen doporuč zkontrolovat stav/kontrolku na OBD a zeptat se na historii.
DŮLEŽITÉ - buď důkladný u specifických systémů dané motorizace, ne jen obecné "turbo/rozvody" - např. u PSA/Peugeot-Citroën HDi s FAP filtrem nezapomeň na systém Eolys (přídavná kapalina pro regeneraci filtru, dolévá/doplňuje se v servisu), pokud je pro daný motor relevantní.
DŮLEŽITÉ - servisní intervaly (rozvody, olej, FAP aditivum apod.): PIŠ JEN HODNOTY, KTERÉ JISTĚ ZNÁŠ nebo web_search potvrdil jako přesnou hodnotu výrobce. Pokud si nejsi 100% jistý, daný interval do výstupu VŮBEC NEPIŠTE – nevymýšlej ani orientační rozsah, ani fráze "obvykle kolem X-Y tis. km". Jen napiš obecně "zkontroluj v servisní knize" bez uvádění čísel. Když hodnotu znáš jistě, napiš ji přesně a spočítej KOLIKRÁT už podle aktuálního nájezdu měla reálně proběhnout (nájezd ÷ interval, zaokrouhleno dolů).
DŮLEŽITÉ - nevymýšlej si konkrétní fakta, u kterých si nejsi jistý: NEPIŠ konkrétní výrobce/značku součástky (např. "vstřikovače Delphi" nebo "Bosch/Siemens"), pokud si nejsi jistý - napiš jen obecně "vstřikovače" bez značky. NEPIŠ konkrétní přesné tolerance/limity (např. "odchylka nad ±3 mg") pokud si nejsi jistý přesným číslem - liší se to i mezi jednotlivými kusy stejného motoru, napiš jen že "velké odchylky korekce ukazují problém vstřikovače", bez čísla. U typu rozvodu (řemen vs řetěz) - pokud si nejsi 100% jistý u TOHOTO konkrétního motoru/generace (a web_search to nepotvrdil jednoznačně), NEPIŠ typ rozvodu vůbec – ani "řemen nebo řetěz", ani žádné hádání. Jen napiš "typ rozvodu ověř v servisní knize nebo podle VIN". Pokud typ JISTĚ znáš nebo ho potvrdil search, napiš ho přesně.
DŮLEŽITÉ - zkratky vysvětli: nikdy nepiš zkratku bez vysvětlení (např. "servisováno v ASO" → napiš "servisováno v autorizovaném servisu (ASO)" nebo rovnou jen "v autorizovaném servisu"), čtenář nemusí znát polské/zahraniční zkratky.

🔍 Co prověřit u TOHOTO inzerátu
Věcně a klidně (NE alarmisticky) shrň co stojí za prověření přímo z dat tohoto inzerátu - NIKDY se nevyjadřuj k ceně (viz výše). Import bez specifikovaného původu nebo "beznehodové" tvrzení bez dokladu jsou u ojetin BĚŽNÉ, ne podezřelé - napiš je jako standardní doporučení k ověření (např. "doporučuji prověřit historii přes Cebia nebo CARVERTICAL podle VIN", "stálo by za to zkontrolovat v servisní historii, jestli byl servis i v Polsku nebo jen v původní zemi"), ne jako varování. Skutečné red flags (poškození, podezřele nízká cena/nájezd, nejasný/prázdný popis) naopak napiš jasně.

✅ Doporučení
Jedno slovo: KOUPIT / NEKOUPIT / ZJISTIT VÍC, a 1-2 věty proč (bez hodnocení ceny).

Buď stručný a konkrétní, žádné obecné fráze, žádné přehnaně dramatické formulace.`;

const HEADERS = { "User-Agent": "Mozilla/5.0 (CarFlip AI rozbor)" };

type Mena = "PLN" | "CZK" | "EUR";
type Cena = { hodnota: number; mena: Mena };
type Vysledek = { obsah: string; cena?: Cena } | { chyba: string };

type Zdroj = "otomoto" | "autoscout24" | "willhaben" | "bazos-cz" | "bazos-sk";

function detekujZdroj(url: string): Zdroj | null {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return null;
  }
  if (host.endsWith("otomoto.pl")) return "otomoto";
  if (host.includes("autoscout24.")) return "autoscout24";
  if (host.endsWith("willhaben.at")) return "willhaben";
  if (host.endsWith("bazos.cz")) return "bazos-cz";
  if (host.endsWith("bazos.sk")) return "bazos-sk";
  return null;
}

/** Zeme zdroje pro zabalenou polozku v historii ("Znacka Model - Rok (Zeme)").
 * Pocita se deterministicky z URL/zdroje, ne z odpovedi AI - spolehlivejsi. */
function zemeZdroje(zdroj: Zdroj, host: string): string {
  if (zdroj === "otomoto") return "Polsko";
  if (zdroj === "bazos-cz") return "Česko";
  if (zdroj === "bazos-sk") return "Slovensko";
  if (zdroj === "willhaben") return "Rakousko";
  if (zdroj === "autoscout24") {
    if (host.endsWith(".de")) return "Německo";
    if (host.endsWith(".at")) return "Rakousko";
    if (host.endsWith(".it")) return "Itálie";
  }
  return "";
}

function vytahniNextData(html: string): any | null {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

function formatCena(cena: Cena, kurz: Kurz): string {
  const { hodnota, mena } = cena;
  const czk = mena === "CZK" ? hodnota : mena === "PLN" ? hodnota * kurz.pln_czk : hodnota * kurz.eur_czk;
  const eur = mena === "EUR" ? hodnota : czk / kurz.eur_czk;
  const nativni = `${Math.round(hodnota).toLocaleString("cs-CZ")} ${mena === "PLN" ? "PLN" : mena === "CZK" ? "Kč" : "EUR"}`;
  const casti = [nativni];
  if (mena !== "CZK") casti.push(`≈ ${Math.round(czk).toLocaleString("cs-CZ")} Kč`);
  if (mena !== "EUR") casti.push(`≈ ${Math.round(eur).toLocaleString("cs-CZ")} EUR`);
  return casti.join(", ");
}

/** Otomoto.pl - JSON v __NEXT_DATA__.
 * POZOR: advert.images ma ~24000 znaku a je v objektu PRED description/
 * details/parametersDict (zive overeno) - kdyby se posilal cely advert,
 * slice(12000) by skoro vzdy usekl specifikace a poslal jen rozfoceny
 * seznam URL fotek. Proto vyber jen relevantnich poli. */
async function dataZOtomoto(url: string): Promise<Vysledek> {
  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) return { chyba: `Otomoto vrátilo chybu (${r.status}) – inzerát možná byl smazán.` };
  const html = await r.text();
  const data = vytahniNextData(html);
  const advert = data?.props?.pageProps?.advert;
  if (!advert) return { chyba: "Z inzerátu se nepodařilo vytáhnout data (Otomoto možná změnilo formát stránky)." };
  const vyber = {
    title: advert.title,
    price: advert.price,
    description: advert.description,
    details: advert.details,
    parametersDict: advert.parametersDict,
    equipment: advert.equipment,
    category: advert.category,
  };
  let cena: Cena | undefined;
  const hodnota = Number(advert.price?.value);
  if (hodnota) cena = { hodnota, mena: (advert.price?.currency as Mena) || "PLN" };
  return { obsah: JSON.stringify(vyber).slice(0, 12000), cena };
}

/** AutoScout24 (DE/AT/IT...) - JSON v __NEXT_DATA__, listingDetails.
 * POZOR: listingDetails ma i pole "financingAndInsurance" s ~56000 znaky
 * (zive overeno) - kdyby se posilalo cele, slice(12000) by usekl presne
 * uprostred pole "vehicle" (motor/najezd/palivo). Proto se posila jen
 * vyber relevantnich poli, ne cely objekt. */
async function dataZAutoscout24(url: string): Promise<Vysledek> {
  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) return { chyba: `AutoScout24 vrátilo chybu (${r.status}) – inzerát možná byl smazán.` };
  const html = await r.text();
  const data = vytahniNextData(html);
  const detail = data?.props?.pageProps?.listingDetails;
  if (!detail) return { chyba: "Z inzerátu se nepodařilo vytáhnout data (AutoScout24 možná změnilo formát stránky)." };
  const vyber = {
    description: detail.description,
    vehicle: detail.vehicle,
    price: detail.price,
    location: detail.location,
    ratings: detail.ratings,
    warranty: detail.warranty,
  };
  let cena: Cena | undefined;
  const hodnota = Number(detail.price?.priceRaw);
  if (hodnota) cena = { hodnota, mena: "EUR" };
  return { obsah: JSON.stringify(vyber).slice(0, 12000), cena };
}

/** Willhaben.at - JSON v __NEXT_DATA__, attribute-list format. */
async function dataZWillhaben(url: string): Promise<Vysledek> {
  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) return { chyba: `Willhaben vrátilo chybu (${r.status}) – inzerát možná byl smazán.` };
  const html = await r.text();
  const data = vytahniNextData(html);
  const attrs = data?.props?.pageProps?.advertDetails?.attributes?.attribute;
  if (!attrs) return { chyba: "Z inzerátu se nepodařilo vytáhnout data (Willhaben možná změnilo formát stránky)." };
  const obj: Record<string, string> = {};
  for (const a of attrs) {
    if (a?.name && a?.values?.[0] != null) obj[a.name] = String(a.values[0]);
  }
  let cena: Cena | undefined;
  const hodnota = Number(obj["PRICE/AMOUNT"]);
  if (hodnota) cena = { hodnota, mena: "EUR" };
  return { obsah: JSON.stringify(obj).slice(0, 12000), cena };
}

/** Bazoš.cz/sk - zadny JSON, jen HTML. Vytahne blok div.popisdetail (strukturovane
 * udaje + volny popis) hrubou silou (bez DOM parseru - jen najde znacku a useka
 * dalsi rozumny kus HTML, pak ho ocisti od tagu). */
async function dataZBazos(url: string, mena: "CZK" | "EUR"): Promise<Vysledek> {
  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) return { chyba: `Bazoš vrátil chybu (${r.status}) – inzerát možná byl smazán.` };
  const html = await r.text();

  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  const cenaMatch = html.match(/class="inzeratycena"[^>]*>([\s\S]*?)<\/div>/);
  const cenaText = cenaMatch ? cenaMatch[1].replace(/<[^>]+>/g, "").trim() : null;
  const popisRegex = /class=["']?popisdetail["']?/i;
  const popisM = popisRegex.exec(html);
  if (!popisM) {
    return { chyba: "Z inzerátu se nepodařilo vytáhnout popis (Bazoš možná změnil formát stránky)." };
  }
  const popisIdx = popisM.index;
  let blok = html.slice(popisIdx, popisIdx + 6000);
  blok = blok.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ");
  blok = blok.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
  blok = blok.replace(/[ \t]+/g, " ").trim();

  let cena: Cena | undefined;
  if (cenaText) {
    const cislo = Number(cenaText.replace(/[^\d]/g, ""));
    if (cislo) cena = { hodnota: cislo, mena };
  }

  const obsah = [
    titleMatch ? `Název: ${titleMatch[1].trim()}` : "",
    "Detail:",
    blok,
  ].filter(Boolean).join("\n");
  return { obsah: obsah.slice(0, 8000), cena };
}

export async function POST(req: Request) {
  let url: string;
  try {
    const body = await req.json();
    url = body.url;
  } catch {
    return NextResponse.json({ error: "Chybný požadavek." }, { status: 400 });
  }

  if (!url) {
    return NextResponse.json({ error: "Vyplň link na inzerát." }, { status: 400 });
  }
  const zdroj = detekujZdroj(url);
  if (!zdroj) {
    return NextResponse.json(
      { error: "Podporované jsou jen Otomoto, Bazoš.cz, Bazoš.sk, AutoScout24 a Willhaben." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Musíš být přihlášen." }, { status: 401 });
  }

  const { count } = await supabase
    .from("ai_rozbory")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("vytvoreno", zacatekMesice());

  if (count !== null && count >= AI_ROZBOR_LIMIT) {
    return NextResponse.json(
      { error: `Dosáhl jsi měsíčního limitu AI rozborů (${AI_ROZBOR_LIMIT}/měsíc). Limit se obnoví příští měsíc.` },
      { status: 429 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI rozbor není nastaven (chybí ANTHROPIC_API_KEY na serveru)." },
      { status: 500 }
    );
  }

  let vysledekFetch: Vysledek;
  try {
    if (zdroj === "otomoto") vysledekFetch = await dataZOtomoto(url);
    else if (zdroj === "autoscout24") vysledekFetch = await dataZAutoscout24(url);
    else if (zdroj === "willhaben") vysledekFetch = await dataZWillhaben(url);
    else if (zdroj === "bazos-cz") vysledekFetch = await dataZBazos(url, "CZK");
    else vysledekFetch = await dataZBazos(url, "EUR");
  } catch {
    return NextResponse.json({ error: "Nepodařilo se stáhnout inzerát." }, { status: 502 });
  }
  if ("chyba" in vysledekFetch) {
    return NextResponse.json({ error: vysledekFetch.chyba }, { status: 502 });
  }

  let obsahProAi = vysledekFetch.obsah;
  if (vysledekFetch.cena) {
    const kurz = await nactiKurzServer();
    obsahProAi = `Cena (přesně dopočítáno): ${formatCena(vysledekFetch.cena, kurz)}\n\n${obsahProAi}`;
  }

  const encoder = new TextEncoder();

  const readableStream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

        let displayText = "";
        let titulek = "";
        let titulekExtracted = false;
        let titulekBuffer = "";

        const apiStream = client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 16000,
          system: SYSTEM_PROMPT,
          tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 3 }] as any,
          messages: [{ role: "user", content: obsahProAi }],
        });

        (apiStream as any).on("content_block_start", (event: any) => {
          if (event.content_block?.type !== "text") {
            send({ type: "searching" });
          }
        });

        apiStream.on("text", (delta: string) => {
          if (!titulekExtracted) {
            titulekBuffer += delta;
            // Buffer until we find TITULEK line anywhere in text, or give up after 2000 chars
            const titulekM = /TITULEK:\s*(.+?)\s*\n+/.exec(titulekBuffer);
            if (titulekM) {
              const zeme = zemeZdroje(zdroj, new URL(url).hostname);
              titulek = zeme ? `${titulekM[1]} (${zeme})` : titulekM[1];
              // Skip everything before+including TITULEK line (strips planning text too)
              const remaining = titulekBuffer.slice(titulekM.index + titulekM[0].length);
              if (remaining) {
                displayText += remaining;
                send({ type: "text", delta: remaining });
              }
              titulekExtracted = true;
            } else if (titulekBuffer.length > 2000) {
              // Give up waiting for TITULEK, stream what we have
              displayText += titulekBuffer;
              send({ type: "text", delta: titulekBuffer });
              titulekExtracted = true;
            }
          } else {
            displayText += delta;
            send({ type: "text", delta });
          }
        });

        await apiStream.finalMessage();

        // Flush buffer if response was short enough that TITULEK wasn't found mid-stream
        if (!titulekExtracted && titulekBuffer) {
          const titulekM = /TITULEK:\s*(.+?)\s*\n+/.exec(titulekBuffer);
          if (titulekM) {
            const zeme = zemeZdroje(zdroj, new URL(url).hostname);
            titulek = zeme ? `${titulekM[1]} (${zeme})` : titulekM[1];
            displayText = titulekBuffer.slice(titulekM.index + titulekM[0].length);
          } else {
            displayText = titulekBuffer;
          }
          if (displayText) send({ type: "text", delta: displayText });
        }

        const { data: radek } = await supabase
          .from("ai_rozbory")
          .insert({ user_id: user.id, url, vysledek: displayText, titulek })
          .select("*")
          .single();

        send({ type: "done", radek, vyuzito: (count ?? 0) + 1, limit: AI_ROZBOR_LIMIT });
      } catch (e: any) {
        const msg = "Chyba AI rozboru: " + (e?.message || String(e));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: msg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
