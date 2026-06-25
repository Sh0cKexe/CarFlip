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

const HLAVICKY = { "User-Agent": "CarFlip/1.0 (osobni nastroj na auta)" };

function zpracujAdresu(adr: Record<string, unknown>) {
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
      const nazev = areaNazev ?? (adr[klic] as string);
      return { nazev, slug: slug(adr[klic] as string), zeme, plz: adr.postcode as string | undefined, areaId };
    }
  }
  return null;
}

// Reverzni geokodovani: klik do mapy (souradnice) -> nejblizsi mesto.
async function reverzni(lat: number, lon: number) {
  // zoom=18 (budova) - vraci i postcode a ISO3166-2-lvl4 (PSC u DE/IT,
  // spolkova zeme u AT).
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=cs,sk,pl,de,en&zoom=18`;
  const r = await fetch(url, { headers: HLAVICKY });
  if (!r.ok) return NextResponse.json({ error: "Geokódování se nezdařilo." }, { status: 502 });
  const j = await r.json();
  const vysledek = zpracujAdresu(j?.address ?? {});
  if (!vysledek) return NextResponse.json({ error: "Pro tento bod se nepodařilo najít město." }, { status: 404 });
  return NextResponse.json({ ...vysledek, lat, lon });
}

// Dopredne geokodovani: rucne napsany nazev mesta -> souradnice + mesto.
// Omezeno na podporovane zeme (countrycodes), at se nehlasi shodne nazvy
// mest odjinud ze sveta.
async function hledejMesto(dotaz: string) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(dotaz)}&format=json&accept-language=cs,sk,pl,de,en&countrycodes=cz,sk,pl,de,at,it&addressdetails=1&limit=1`;
  const r = await fetch(url, { headers: HLAVICKY });
  if (!r.ok) return NextResponse.json({ error: "Geokódování se nezdařilo." }, { status: 502 });
  const arr = await r.json();
  if (!Array.isArray(arr) || arr.length === 0) {
    return NextResponse.json({ error: "Město se nepodařilo najít." }, { status: 404 });
  }
  const polozka = arr[0];
  const vysledek = zpracujAdresu(polozka.address ?? {});
  if (!vysledek) return NextResponse.json({ error: "Město se nepodařilo najít." }, { status: 404 });
  return NextResponse.json({ ...vysledek, lat: Number(polozka.lat), lon: Number(polozka.lon) });
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Chybný požadavek." }, { status: 400 });
  }

  try {
    if (typeof body.dotaz === "string" && body.dotaz.trim()) {
      return await hledejMesto(body.dotaz.trim());
    }
    const lat = Number(body.lat);
    const lon = Number(body.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json({ error: "Chybné souřadnice." }, { status: 400 });
    }
    return await reverzni(lat, lon);
  } catch {
    return NextResponse.json({ error: "Chyba sítě při geokódování." }, { status: 502 });
  }
}
