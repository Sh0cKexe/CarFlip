// Port kurz.py: denni kurz PLN/EUR -> CZK z oficialnich dat CNB (zdarma,
// bez klice). Pouziva se v /api/kurz (web UI) i v ai-rozbor (presny prevod
// ceny, aby AI nemusela hadat kurz z vlastnich znalosti).

const CNB_URL =
  "https://www.cnb.cz/en/financial-markets/foreign-exchange-market/" +
  "central-bank-exchange-rate-fixing/central-bank-exchange-rate-fixing/daily.txt";

const ZALOHA = { pln_czk: 5.7, eur_czk: 25.2 };

export type Kurz = { pln_czk: number; eur_czk: number };

export async function nactiKurzServer(): Promise<Kurz> {
  try {
    const r = await fetch(CNB_URL, { next: { revalidate: 86400 } });
    const text = await r.text();
    let pln_czk: number | null = null;
    let eur_czk: number | null = null;
    for (const radek of text.split("\n")) {
      const casti = radek.split("|");
      if (casti.length !== 5) continue;
      const mena = casti[3]?.trim();
      if (mena !== "PLN" && mena !== "EUR") continue;
      const mnozstvi = parseFloat(casti[2]);
      const kurz = parseFloat(casti[4].replace(",", "."));
      if (!mnozstvi || !kurz) continue;
      if (mena === "PLN") pln_czk = kurz / mnozstvi;
      else eur_czk = kurz / mnozstvi;
    }
    if (!pln_czk || !eur_czk) throw new Error("kurz PLN/EUR nenalezen v datech ČNB");
    return { pln_czk, eur_czk };
  } catch {
    return ZALOHA;
  }
}
