# -*- coding: utf-8 -*-
"""
Scraper inzeratu z Willhaben.at (Rakousko) - rakouska jednicka v inzerci
(auta + bazar obecne). Stejny trik jako Otomoto/AutoScout24 - data jsou
v __NEXT_DATA__ (Next.js).

Na rozdil od AutoScout24 nema Willhaben strukturovane pole "havarovano" -
detekce poskozeneho auta jede pres fraze v popisu (stejny princip jako
puvodni Polsky import flow v main.py, jen nemecke fraze).
"""
import re
import json
import time
import requests

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/124.0 Safari/537.36",
}

DOMENA = "www.willhaben.at"
CDN_FOTO = "https://cache.willhaben.at/mmo/"

# Prevod paliva (nas zapis -> Willhaben kod atributu ENGINE/FUEL)
FUEL_MAP = {
    "nafta": "100003",
    "benzin": "100001",
}

# Prevod prevodovky (nas zapis -> Willhaben kod atributu TRANSMISSION)
TRANSMISSION_MAP = {
    "manual": "180001",
    "automat": "180004",
}

PLYN_SLOVA = ("lpg", "autogas", "cng", "erdgas")

# Willhaben ma jiny slug nez Otomoto/AutoScout24 jen u par znacek
# (zive overeno - "volkswagen" vraci HTTP 404, spravne je "vw").
ZNACKA_MAP = {
    "volkswagen": "vw",
}

# Popis uz mame z vypisu (BODY_DYN), takze nacti_detail nemusi fetchovat
# znovu - jen si schova popis pod URL, aby ho zpracuj_auto_zahranicni
# mohlo prohlasit za "havarovano" pres nemecke fraze.
_POPIS_CACHE = {}

# Nemecke fraze napovidajici havarovane/nepojizdne auto (popis je v nemcine,
# stejny princip jako polske NEPOJIZDNE_FRAZE v main.py pro Otomoto import).
NEHAVAROVANE_FRAZE = (
    "unfallfahrzeug", "unfallauto", "unfallwagen", "motorschaden",
    "getriebeschaden", "nicht fahrbereit", "fahruntuechtig", "fahruntüchtig",
    "bastlerfahrzeug", "totalschaden", "motordefekt", "kein tuev",
    "kein tüv", "export/bastler", "defekter motor",
)


def _sestav_url(znacka, filtry, strana, okruh=None):
    """Sestavi URL pro vyhledavani na Willhaben. okruh se zatim nepouziva
    (cela Rakousko) - region/radius filtr neni v prvni verzi implementovan."""
    base = "https://{}/iad/gebrauchtwagen/auto/{}".format(DOMENA, ZNACKA_MAP.get(znacka, znacka))
    params = {"page": str(strana)}

    if filtry.get("min_rok"):
        params["YEAR_MODEL_FROM"] = filtry["min_rok"]

    palivo = filtry.get("palivo", "vse")
    naj_nafta = filtry.get("max_najezd_nafta")
    naj_benzin = filtry.get("max_najezd_benzin")
    if palivo == "nafta":
        cap = naj_nafta
    elif palivo == "benzin":
        cap = naj_benzin
    else:
        kandidati = [v for v in (naj_nafta, naj_benzin) if v]
        cap = max(kandidati) if kandidati else None
    if cap:
        params["MILEAGE_TO"] = cap

    if filtry.get("max_cena_eur"):
        params["PRICE_TO"] = filtry["max_cena_eur"]
    if filtry.get("min_cena_eur"):
        params["PRICE_FROM"] = filtry["min_cena_eur"]

    prevodovka = filtry.get("prevodovka", "vse")
    extra = ""
    if prevodovka in TRANSMISSION_MAP:
        extra += "&TRANSMISSION={}".format(TRANSMISSION_MAP[prevodovka])
    # ENGINE/FUEL ma lomeno v nazvu - posilame rovnou url-encoded v query
    # stringu, aby nedoslo k nejasnostem s kodovanim klice ve slovniku.
    if palivo in FUEL_MAP:
        extra += "&ENGINE%2FFUEL={}".format(FUEL_MAP[palivo])

    return base, params, extra


def _vytahni_json(html):
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.S)
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except Exception:
        return None


def _attrs_na_slovnik(attributes):
    out = {}
    for a in (attributes or {}).get("attribute", []):
        vals = a.get("values")
        if vals:
            out[a["name"]] = vals[0]
    return out


def _je_plyn_text(palivo_text):
    s = (palivo_text or "").lower()
    return any(g in s for g in PLYN_SLOVA)


def _zpracuj_listing(ad):
    a = _attrs_na_slovnik(ad.get("attributes"))

    cena = None
    try:
        cena = int(float(a.get("PRICE/AMOUNT")))
    except Exception:
        pass

    najezd_km = None
    try:
        najezd_km = int(a.get("MILEAGE"))
    except Exception:
        pass

    rok = None
    try:
        rok = int(a.get("YEAR_MODEL"))
    except Exception:
        pass

    vykon_kw = None
    try:
        vykon_kw = int(a.get("ENGINE/EFFECT"))
    except Exception:
        pass

    foto = None
    mmo = a.get("MMO")
    if mmo:
        foto = CDN_FOTO + mmo

    seo_url = a.get("SEO_URL") or ""
    popis = a.get("BODY_DYN")
    url = "https://{}/{}".format(DOMENA, seo_url.lstrip("/"))
    _POPIS_CACHE[url] = popis or ""

    return {
        "id": "willhaben_{}".format(a.get("ADID") or seo_url),
        "titulek": a.get("HEADING") or "{} {}".format(a.get("CAR_MODEL/MAKE", ""), a.get("CAR_MODEL/MODEL", "")).strip(),
        "popis_kratky": popis,
        "url": url,
        "cena": cena,
        "znacka": a.get("CAR_MODEL/MAKE"),
        "model": a.get("CAR_MODEL/MODEL"),
        "verze": a.get("CAR_MODEL/MODEL_SPECIFICATION"),
        "rok": rok,
        "najezd_km": najezd_km,
        "palivo": a.get("ENGINE/FUEL_RESOLVED"),
        "palivo_kod": a.get("ENGINE/FUEL_RESOLVED"),
        "prevodovka": a.get("TRANSMISSION_RESOLVED"),
        "vykon_kw": vykon_kw,
        "objem_l": None,
        "mesto": a.get("LOCATION"),
        "foto": foto,
    }


def nacti_inzeraty(znacka, filtry, max_stran=1, pauza=1.0, okruh=None, zeme="at"):
    """Stahne inzeraty pro danou znacku (nejnovejsi nahore). Vraci seznam slovniku.
    `zeme` parametr je tu jen pro spolecne rozhrani se zahranicnimi moduly
    (Willhaben je jen pro Rakousko, parametr se ignoruje)."""
    vysledky = []
    session = requests.Session()
    session.headers.update(HEADERS)

    for strana in range(1, max_stran + 1):
        base, params, extra = _sestav_url(znacka, filtry, strana, okruh=okruh)
        try:
            r = session.get(base + ("?" + extra.lstrip("&") if extra else ""), params=params, timeout=30)
        except Exception as e:
            print("  [willhaben] chyba site:", e)
            break
        if r.status_code != 200:
            print("  [willhaben] HTTP", r.status_code, "pro", znacka)
            break

        data = _vytahni_json(r.text)
        if not data:
            print("  [willhaben] nepodarilo se najit data pro", znacka)
            break

        sr = data.get("props", {}).get("pageProps", {}).get("searchResult", {})
        ads = sr.get("advertSummaryList", {}).get("advertSummary") or []
        if not ads:
            break
        for ad in ads:
            try:
                vysledky.append(_zpracuj_listing(ad))
            except Exception as e:
                print("  [willhaben] chyba zpracovani inzeratu:", e)

        if strana < max_stran:
            time.sleep(pauza)

    return vysledky


def _problem_v_popisu(popis):
    t = (popis or "").lower()
    if any(fr in t for fr in NEHAVAROVANE_FRAZE):
        return True
    if _je_plyn_text(t):
        return True
    return False


def nacti_detail(url):
    """
    Willhaben nema strukturovane pole "havarovano" jako AutoScout24 - popis
    uz mame z vypisu (BODY_DYN, ulozeny v _POPIS_CACHE behem nacti_inzeraty),
    takze tu jen hledame nemecke fraze napovidajici skodu/nepojizdnost.
    Zadny dalsi HTTP dotaz (detail stranka ma ve skutecnosti KRATSI popis
    nez vypis, zivě overeno). Vraci {"popis": str, "poskozeno": bool}.
    """
    popis = _POPIS_CACHE.get(url, "")
    return {"popis": popis, "poskozeno": _problem_v_popisu(popis)}


if __name__ == "__main__":
    test_filtry = {
        "palivo": "nafta",
        "min_rok": 2010,
        "max_najezd_nafta": 180000,
        "max_cena_eur": 9000,
        "min_cena_eur": 500,
    }
    auta = nacti_inzeraty("skoda", test_filtry, max_stran=1)
    print("Nalezeno:", len(auta))
    for a in auta[:5]:
        print("-", a["titulek"], "|", a["cena"], "EUR |", a["rok"],
              "|", a["najezd_km"], "km |", a["palivo"], "|", a["url"])
