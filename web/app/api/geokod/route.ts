import { NextResponse } from "next/server";

// Port geokod.py: prevod kliknuteho bodu na mape -> nejblizsi mesto.
// Pouziva OpenStreetMap Nominatim (zdarma, bez klice).
// "zeme" se urcuje AUTOMATICKY z odpovedi (address.country_code) podle
// toho, kam uzivatel na mape klikl - zadny rucni vyber zeme predem.

const SPECIAL: Record<string, string> = { ł: "l", Ł: "l" };

// Willhaben (Rakousko) nema radius/PSC vyhledavani jako AutoScout24/Otomoto -
// jen filtr na spolkovou zemi. ISO3166-2-lvl4 z Nominatim (AT-1..AT-9)
// odpovida poradovemu cislu zeme (1=Burgenland ... 9=Wien).
const AT_AREA_NAZEV: Record<number, string> = {
  1: "Burgenland", 2: "Kärnten", 3: "Niederösterreich", 4: "Oberösterreich",
  5: "Salzburg", 6: "Steiermark", 7: "Tirol", 8: "Vorarlberg", 9: "Wien",
};

function slug(text: string): string {
  if (!text) return "";
  let t = text;
  for (const [k, v] of Object.entries(SPECIAL)) t = t.split(k).join(v);
  t = t.normalize("NFKD").replace(/[̀-ͯ]/g, "");
  t = t.toLowerCase().trim();
  t = t.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return t;
}

export async function POST(req: Request) {
  let lat: number, lon: number;
  try {
    const body = await req.json();
    lat = Number(body.lat);
    lon = Number(body.lon);
  } catch {
    return NextResponse.json({ error: "Chybný požadavek." }, { status: 400 });
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "Chybné souřadnice." }, { status: 400 });
  }

  try {
    // accept-language jako seznam - Nominatim vrati nazev mesta v prvnim
    // jazyce, ktery pro dane misto ma (cs/sk/pl/de podle skutecne zeme).
    // zoom=18 (budova) - oproti puvodnimu 10 navic vraci postcode a
    // ISO3166-2-lvl4 (potreba pro PSC u DE/IT a spolkovou zemi u AT).
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=cs,sk,pl,de,en&zoom=18`;
    const r = await fetch(url, {
      headers: { "User-Agent": "CarFlip/1.0 (osobni nastroj na auta)" },
    });
    if (!r.ok) {
      return NextResponse.json({ error: "Geokódování se nezdařilo." }, { status: 502 });
    }
    const j = await r.json();
    const adr = j?.address ?? {};
    const kodZeme = (adr.country_code as string | undefined)?.toLowerCase();
    const PODPOROVANE = ["cz", "sk", "pl", "de", "at", "it"];
    const zeme = PODPOROVANE.includes(kodZeme ?? "") ? kodZeme! : "pl";

    let areaId: number | undefined;
    let areaNazev: string | undefined;
    if (zeme === "at") {
      const iso = (adr["ISO3166-2-lvl4"] as string | undefined) ?? "";
      const cislo = Number(iso.split("-")[1]);
      if (cislo >= 1 && cislo <= 9) {
        areaId = cislo;
        areaNazev = AT_AREA_NAZEV[cislo];
      }
    }

    for (const klic of ["city", "town", "village", "municipality", "county"]) {
      if (adr[klic]) {
        const nazev = (areaNazev as string | undefined) ?? (adr[klic] as string);
        return NextResponse.json({
          nazev, slug: slug(adr[klic] as string), zeme,
          plz: adr.postcode as string | undefined,
          areaId,
        });
      }
    }
    return NextResponse.json({ error: "Pro tento bod se nepodařilo najít město." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Chyba sítě při geokódování." }, { status: 502 });
  }
}
