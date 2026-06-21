import { NextResponse } from "next/server";

// Port geokod.py: prevod kliknuteho bodu na mape -> nejblizsi polske mesto.
// Pouziva OpenStreetMap Nominatim (zdarma, bez klice).

const SPECIAL: Record<string, string> = { ł: "l", Ł: "l" };

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
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=pl&zoom=10`;
    const r = await fetch(url, {
      headers: { "User-Agent": "CarFlip/1.0 (osobni nastroj na auta)" },
    });
    if (!r.ok) {
      return NextResponse.json({ error: "Geokódování se nezdařilo." }, { status: 502 });
    }
    const j = await r.json();
    const adr = j?.address ?? {};
    for (const klic of ["city", "town", "village", "municipality", "county"]) {
      if (adr[klic]) {
        const nazev = adr[klic] as string;
        return NextResponse.json({ nazev, slug: slug(nazev) });
      }
    }
    return NextResponse.json({ error: "Pro tento bod se nepodařilo najít město." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Chyba sítě při geokódování." }, { status: 502 });
  }
}
