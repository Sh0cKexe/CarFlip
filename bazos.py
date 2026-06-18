# -*- coding: utf-8 -*-
"""
Odhad prodejni ceny auta v CR podle inzeratu na Bazosi (auto.bazos.cz).

Postup:
1) Sestavime ceske hledani (napr. "Seria 3" z Otomoto -> "rada 3").
2) Stahneme inzeraty z Bazose.
3) Zkusime vybrat jen rocnikem podobne kusy.
4) Vratime median ceny + par odkazu na srovnatelne inzeraty.

Bazos cilene nelabeluje "soukromnik vs bazar", proto pouzivame MEDIAN,
ktery je odolny vuci extremum, a bazar-ceny postupne doladime.
"""
import re
import time
import unicodedata
import statistics
import requests
from bs4 import BeautifulSoup


def _bez_diakritiky(text):
    """'BMW řada 3' -> 'bmw rada 3' (kvuli porovnavani nazvu)."""
    if not text:
        return ""
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    return text.lower()


# Slova v inzeratu napovidajici palivo
DIESEL_SLOVA = ("tdi", "nafta", "diesel", "cdti", "dci", "hdi", "crdi",
                "d4d", "bluetec", "bluehdi", "jtd", "tdci", "cdi")
BENZIN_SLOVA = ("benzin", "tsi", "tfsi", "mpi", "fsi", "16v", "12v", "htp",
                "vti", "gti", "tce", "puretech")


def _palivo_z_textu(text):
    """Z textu inzeratu odhadne palivo: 'nafta' / 'benzin' / None."""
    t = _bez_diakritiky(text)
    if any(w in t for w in DIESEL_SLOVA):
        return "nafta"
    if any(w in t for w in BENZIN_SLOVA):
        return "benzin"
    return None


def _objem_z_textu(text):
    """Z textu vytahne objem motoru v litrech (napr. '1.2', '2,0'). None kdyz nic."""
    m = re.search(r"\b([0-6])[.,]([0-9])\b", text)
    if m:
        v = float(m.group(1) + "." + m.group(2))
        if 0.6 <= v <= 6.5:
            return v
    return None


def _palivo_auta(kod):
    """Z Otomoto kodu paliva ('diesel'/'petrol'/...) -> 'nafta'/'benzin'/None."""
    k = (kod or "").lower()
    if "diesel" in k:
        return "nafta"
    if "petrol" in k or "benzin" in k:
        return "benzin"
    return None

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/124.0 Safari/537.36",
}

# Preklad polskych nazvu modelu na ceske hledani na Bazosi
MODEL_PREKLAD = {
    "seria": "rada",     # BMW Seria 3 -> rada 3
    "klasa": "trida",    # Mercedes Klasa C -> trida C
}

# Pod touto cenou to nejspis nejsou auta, ale dily/doplnky
MIN_ROZUMNA_CENA = 25000


def _ceske_hledani(znacka, model):
    """Sestavi vyhledavaci dotaz pro Bazos."""
    znacka = (znacka or "").strip().lower()
    model = (model or "").strip().lower()
    slova = []
    for s in model.split():
        slova.append(MODEL_PREKLAD.get(s, s))
    model_cz = " ".join(slova)
    return (znacka + " " + model_cz).strip()


def _cena_na_cislo(text):
    if not text:
        return None
    cislice = re.sub(r"[^\d]", "", text)
    if not cislice:
        return None
    return int(cislice)


def _rok_z_textu(text):
    """Zkusi najit rok vyroby v textu (1990-2026)."""
    if not text:
        return None
    for m in re.findall(r"(?:rv\.?|r\.?v\.?|rok|rocnik)?\s*(19[9]\d|20[0-2]\d)", text.lower()):
        rok = int(m)
        if 1990 <= rok <= 2026:
            return rok
    return None


def _najezd_z_textu(text):
    """Zkusi najit najezd (km) v textu. Vraci cislo nebo None."""
    if not text:
        return None
    t = text.lower()
    # 1) zkratky typu "190tkm", "190 tis", "150 tis km", "200tkm"
    m = re.search(r"(\d{2,3})\s*(?:tkm|tis\.?\s*km|tis\b)", t)
    if m:
        val = int(m.group(1)) * 1000
        if 1000 <= val <= 500000:
            return val
    # 2) plne cislo s "km": "190 000 km", "190000km", "190.000 km"
    m = re.search(r"(\d{2,3}[\s.]?\d{3})\s*km", t)
    if m:
        val = int(re.sub(r"[^\d]", "", m.group(1)))
        if 1000 <= val <= 500000:
            return val
    # 3) u slova najeto/najezd/naj
    m = re.search(r"naj\w*[\s:.]*(\d{2,3}[\s.]?\d{3})", t)
    if m:
        val = int(re.sub(r"[^\d]", "", m.group(1)))
        if 1000 <= val <= 500000:
            return val
    return None


# ----------------------------------------------------------------------------
# OCHRANA PROTI BLOKACI (HTTP 429)
# ----------------------------------------------------------------------------
# 1) Trvala cache na disk: stejny model znovu nehledame po dobu CACHE_TTL.
# 2) Slusne tempo: mezi dotazy vzdy aspon MIN_PAUZA vteriny (+ trocha nahody).
# 3) Cooldown: kdyz nas Bazos zablokuje, na CHVILI se uplne odmlcime.
import os
import json
import random

CACHE_FILE = os.path.join(os.path.dirname(__file__), "cena_cache.json")
CACHE_TTL = 12 * 3600      # jak dlouho (s) verit ulozene cene modelu = 12 h
MIN_PAUZA = 4.0            # minimalni rozestup mezi dotazy na Bazos (s)
COOLDOWN = 15 * 60         # po blokaci se odmlcime na 15 minut

_posledni_request = [0.0]  # cas posledniho dotazu (v seznamu, at jde menit)
_blok_do = [0.0]           # do kdy se neptat (cooldown)


def _nacti_cache():
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def _uloz_cache(cache):
    try:
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(cache, f, ensure_ascii=False)
    except Exception as e:
        print("  [bazos] nelze ulozit cache:", e)


_CACHE = _nacti_cache()  # {klic: {"kdy": cas, "data": [...]}}


def _pockej_na_radu():
    """Zajisti slusny rozestup mezi dotazy (proti narazove vlne)."""
    ted = time.time()
    od_posledniho = ted - _posledni_request[0]
    if od_posledniho < MIN_PAUZA:
        time.sleep(MIN_PAUZA - od_posledniho + random.uniform(0, 1.0))
    _posledni_request[0] = time.time()


def _stahni_stranku(session, url, params, pokusy=2):
    """Stahne jednu stranku. Pri blokaci (429) zapne cooldown a vrati None."""
    for pokus in range(pokusy):
        _pockej_na_radu()
        try:
            r = session.get(url, params=params, timeout=20)
        except Exception as e:
            print("  [bazos] chyba site:", e)
            return None
        if r.status_code == 429:
            cekej = 12 * (pokus + 1)
            print("  [bazos] zahlceno (429), cekam {}s...".format(cekej))
            time.sleep(cekej)
            continue
        if r.status_code != 200:
            return None
        return r
    # Porad blokovani -> zapneme cooldown, at to neprehlcujeme
    _blok_do[0] = time.time() + COOLDOWN
    print("  [bazos] blokace trva -> pauza {} min (auta se dores v dalsim kole).".format(
        COOLDOWN // 60))
    return None


def hledat_inzeraty(dotaz, cena_od=None, cena_do=None, max_stran=2, pauza=1.5):
    """Stahne inzeraty z Bazose pro dany dotaz (s trvalou cache + ochranou)."""
    klic = "{}|{}|{}|{}".format(dotaz, cena_od, cena_do, max_stran)

    # 1) Trvala cache: pokud mame cerstvy zaznam, nechodime na sit
    zaznam = _CACHE.get(klic)
    if zaznam and (time.time() - zaznam.get("kdy", 0)) < CACHE_TTL:
        return zaznam["data"]

    # 2) Cooldown po blokaci: radsi vratime stara data (nebo nic) nez dotaz
    if time.time() < _blok_do[0]:
        return zaznam["data"] if zaznam else []

    vysledky = []
    session = requests.Session()
    session.headers.update(HEADERS)

    for strana in range(max_stran):
        params = {"hledat": dotaz, "rubriky": "auto"}
        if cena_od:
            params["cenaod"] = cena_od
        if cena_do:
            params["cenado"] = cena_do
        # Bazos strankuje pres /strana/20/40...
        url = "https://auto.bazos.cz/"
        if strana > 0:
            url = "https://auto.bazos.cz/{}/".format(strana * 20)
        r = _stahni_stranku(session, url, params)
        if r is None:
            break
        r.encoding = "windows-1250"
        soup = BeautifulSoup(r.text, "lxml")
        bloky = soup.select("div.inzeraty")
        if not bloky:
            break
        for it in bloky:
            nad = it.select_one(".nadpis a")
            cena = it.select_one(".inzeratycena")
            popis = it.select_one(".popis")
            if not nad:
                continue
            link = nad.get("href", "")
            if link.startswith("/"):
                link = "https://auto.bazos.cz" + link
            titulek = nad.get_text(strip=True)
            popis_text = popis.get_text(" ", strip=True) if popis else ""
            cely = titulek + " " + popis_text
            vysledky.append({
                "titulek": titulek,
                "url": link,
                "cena": _cena_na_cislo(cena.get_text() if cena else None),
                "rok": _rok_z_textu(cely),
                "najezd": _najezd_z_textu(cely),
                "popis": popis_text,
            })
        if strana < max_stran - 1:
            time.sleep(pauza)

    # Ulozime do trvale cache (jen kdyz neco mame, at necachujeme prazdno)
    if vysledky:
        _CACHE[klic] = {"kdy": time.time(), "data": vysledky}
        _uloz_cache(_CACHE)
    return vysledky


def odhad_ceny(znacka, model, rok=None, najezd_km=None, cena_anchor_czk=None,
               palivo=None, objem_l=None,
               rozsah_let=3, rozsah_km=50000, max_nasobek=2.5, min_pocet=5):
    """
    Vrati odhad prodejni ceny v CR (median) + srovnatelne inzeraty.

    Pojistky proti nesmyslnym odhadum:
      - rocnik: jen auta +-rozsah_let (vychozi 3 roky)
      - najezd: jen auta +-rozsah_km (vychozi 50 000 km) - pokud ho zname
      - cena: vyhodi inzeraty drazsi nez max_nasobek (2,5x) ceny polskeho auta
              (tim vypadnou novejsi generace stejneho modelu)
    Kdyz po filtru zbyde min nez MIN_SROVNANI (3) aut, vrati median=None
    (radsi auto preskocime, nez abychom hadali).

    Vraci slovnik:
      {median, pocet, ukazky[], dotaz, duvod}
    """
    dotaz = _ceske_hledani(znacka, model)
    # Rekneme Bazosi cenovy strop (2.5x cena polskeho auta), aby vracel
    # auta v rozumne cene - jinak by vracel hlavne drahe novejsi kusy a
    # levne srovnatelne by zustaly na dalsich strankach.
    # Strop zaokrouhlime na 20 000 Kc, aby fungovala cache pro podobna auta.
    cena_do = None
    if cena_anchor_czk:
        cap = cena_anchor_czk * max_nasobek
        cena_do = int(round(cap / 20000.0) * 20000) or 20000
    syrove = hledat_inzeraty(dotaz, cena_od=MIN_ROZUMNA_CENA, cena_do=cena_do, max_stran=3)

    # 0) NAZEV inzeratu musi obsahovat hledany model (ne jen popis).
    #    Tim vyradime jine modely, ktere se jen zminily v textu
    #    (napr. Skoda Octavia, kdyz hledame Seat Ibiza).
    model_tokeny = [t for t in _bez_diakritiky(model).split() if len(t) >= 2]
    if model_tokeny:
        vybrane = [x for x in syrove
                   if all(tok in _bez_diakritiky(x["titulek"]) for tok in model_tokeny)]
    else:
        vybrane = list(syrove)

    # 1) rozumna cena (vyhozeni dilu/doplnku)
    vybrane = [x for x in vybrane if x["cena"] and x["cena"] >= MIN_ROZUMNA_CENA]

    # 2) cenovy strop podle ceny polskeho auta -> vyhodi jine generace
    if cena_anchor_czk:
        strop = int(cena_anchor_czk * max_nasobek)
        vybrane = [x for x in vybrane if x["cena"] <= strop]

    # 3) rocnik: jen STEJNY rok nebo STARSI (max rozsah_let zpet), NIKDY novejsi.
    #    (stare auto se nesmi cenit podle novejsich kusu)
    if rok:
        vybrane = [x for x in vybrane
                   if x["rok"] and (rok - rozsah_let) <= x["rok"] <= rok]

    # 4) parovani najezdu (+-rozsah_km) - jen u inzeratu kde najezd zname,
    #    u kterych ho neuvadi neumime posoudit -> ponechame
    if najezd_km:
        vybrane = [x for x in vybrane
                   if (not x.get("najezd")) or abs(x["najezd"] - najezd_km) <= rozsah_km]

    # 5) MOTOR: vyradi jasne jiny motor (jine palivo / hodne jiny objem).
    #    Kdyz to z inzeratu nejde poznat, kus ponechame (nehadame).
    car_palivo = _palivo_auta(palivo)
    car_objem = round(objem_l, 1) if objem_l else None
    if car_palivo or car_objem:
        def _motor_sedi(x):
            text = (x.get("titulek") or "") + " " + (x.get("popis") or "")
            if car_palivo:
                p = _palivo_z_textu(text)
                if p and p != car_palivo:
                    return False
            if car_objem:
                o = _objem_z_textu(text)
                # POVINNA presna shoda objemu: kdyz auto ma 2.0, srovnavame
                # jen s jasne 2.0. Neznamy objem (neuveden) = nepocitat.
                # (1.2 != 1.4, 1.9 != 2.0; toleruje jen zaokrouhleni 1.39 -> 1.4)
                if o is None or abs(o - car_objem) > 0.05:
                    return False
            return True
        vybrane = [x for x in vybrane if _motor_sedi(x)]

    if len(vybrane) < min_pocet:
        return {"median": None, "pocet": len(vybrane), "ukazky": [],
                "dotaz": dotaz, "duvod": "malo srovnatelnych aut po filtrech"}

    ceny = sorted(x["cena"] for x in vybrane)
    median = int(statistics.median(ceny))

    # ukazky: nejblize medianu
    vybrane.sort(key=lambda x: abs(x["cena"] - median))
    ukazky = [{"titulek": x["titulek"], "url": x["url"], "cena": x["cena"],
               "rok": x["rok"], "najezd": x.get("najezd")} for x in vybrane[:5]]

    return {"median": median, "pocet": len(ceny),
            "ukazky": ukazky, "dotaz": dotaz, "duvod": "ok"}


if __name__ == "__main__":
    import json
    v = odhad_ceny("BMW", "Seria 3", rok=2018)
    print("Dotaz:", v["dotaz"])
    print("Median CZ:", v["median"], "Kc | z", v["pocet"], "inzeratu")
    for u in v["ukazky"]:
        print("  -", u["rok"], "|", u["cena"], "Kc |", u["titulek"][:50], "|", u["url"])
