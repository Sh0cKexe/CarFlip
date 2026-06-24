# -*- coding: utf-8 -*-
"""
Scraper inzeratu z Otomoto.pl

Otomoto vklada vsechna data do stranky jako JSON (Next.js / urql cache),
takze nemusime parsovat krehke HTML - vytahneme primo cisty JSON.
"""
import re
import json
import time
import requests

import ochrana_scrapingu
import palivo_filtr

_OCHRANA = ochrana_scrapingu.vytvor_ochranu("otomoto_cache.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/124.0 Safari/537.36",
    "Accept-Language": "pl-PL,pl;q=0.9,en;q=0.8",
}

# Prevod nazvu paliva (nas zapis -> Otomoto enum, zive overeno; vice
# enum hodnot za kategorii se posila jako vicenasobny filtr - OR).
PALIVO_MAP = {
    "benzin": ["petrol"],
    "nafta": ["diesel"],
    "hybrid": ["hybrid", "plugin-hybrid"],
    "elektro": ["electric"],
    "lpg_cng": ["petrol-lpg"],
}

# Prevod prevodovky (nas zapis -> Otomoto hodnota)
PREVODOVKA_MAP = {
    "automat": "automatic",
    "manual": "manual",
}

# Prevod karoserie (nas zapis -> Otomoto enum, zive overeno)
KAROSERIE_MAP = {
    "kombi": "combi",
    "sedan": "sedan",
    "hatchback": "compact",
    "suv": "suv",
    "kupe": "coupe",
    "kabriolet": "cabrio",
    "van": "minivan",
}


def _km_na_kw(km):
    """Prepocet vykonu z koni (KM) na kilowatty (kW)."""
    if not km:
        return None
    return int(round(km * 0.7355))


def _sestav_url(znacka, filtry, strana=1, okruh=None):
    """
    Sestavi URL pro vyhledavani na Otomoto podle filtru.
    okruh = None  -> cele Polsko
    okruh = {"mesto_slug": "wroclaw", "okruh_km": 50} -> mesto + polomer
    """
    base = "https://www.otomoto.pl/osobowe/{}".format(znacka)
    if okruh and okruh.get("mesto_slug"):
        base = "https://www.otomoto.pl/osobowe/{}/{}".format(
            znacka, okruh["mesto_slug"])
    params = {
        "search[order]": "created_at_first:desc",  # nejnovejsi nahore
        "search[advanced_search_expanded]": "true",
    }
    if filtry.get("min_rok"):
        params["search[filter_float_year:from]"] = filtry["min_rok"]
    if filtry.get("max_rok"):
        params["search[filter_float_year:to]"] = filtry["max_rok"]

    karoserie = filtry.get("karoserie")
    if karoserie in KAROSERIE_MAP:
        params["search[filter_enum_body_type]"] = KAROSERIE_MAP[karoserie]

    # Max najezd: nafta a benzin maji vlastni limit. Na Otomoto posleme
    # vyssi z relevantnich (at stahneme obojí), presne doladíme u kazdeho auta.
    vybrane_palivo = palivo_filtr.normalizuj(filtry)
    cap = palivo_filtr.naj_cap(filtry, vybrane_palivo)
    if cap:
        params["search[filter_float_mileage:to]"] = cap
    if filtry.get("max_cena_pln"):
        params["search[filter_float_price:to]"] = filtry["max_cena_pln"]
    if filtry.get("min_cena_pln"):
        params["search[filter_float_price:from]"] = filtry["min_cena_pln"]

    hodnoty_paliva = []
    for p in vybrane_palivo:
        hodnoty_paliva += PALIVO_MAP.get(p, [])
    for i, hodnota in enumerate(hodnoty_paliva):
        params["search[filter_enum_fuel_type][{}]".format(i)] = hodnota

    prevodovka = filtry.get("prevodovka", "vse")
    if prevodovka in PREVODOVKA_MAP:
        params["search[filter_enum_gearbox]"] = PREVODOVKA_MAP[prevodovka]

    # Okruh (polomer v km kolem mesta)
    if okruh and okruh.get("okruh_km"):
        params["search[dist]"] = int(okruh["okruh_km"])

    if strana > 1:
        params["page"] = strana
    return base, params


def _vytahni_json(html):
    """Vytahne advertSearch data z __NEXT_DATA__ skriptu."""
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.S)
    if not m:
        return None
    data = json.loads(m.group(1))
    urql = data.get("props", {}).get("pageProps", {}).get("urqlState", {})
    for _, v in urql.items():
        raw = v.get("data")
        if not raw:
            continue
        try:
            obj = json.loads(raw)
        except Exception:
            continue
        if "advertSearch" in obj:
            return obj["advertSearch"]
    return None


def _params_na_slovnik(parameters):
    """Seznam parametru -> {klic: hodnota} a {klic: zobrazena_hodnota}."""
    hodnoty = {}
    zobrazene = {}
    for p in parameters or []:
        hodnoty[p.get("key")] = p.get("value")
        zobrazene[p.get("key")] = p.get("displayValue")
    return hodnoty, zobrazene


def _zpracuj_node(node):
    """Prevede surovy inzerat na nas jednoduchy slovnik."""
    hodnoty, zobrazene = _params_na_slovnik(node.get("parameters"))

    cena = None
    try:
        cena = int(node["price"]["amount"]["units"])
    except Exception:
        pass

    thumb = None
    th = node.get("thumbnail")
    if isinstance(th, dict):
        thumb = th.get("x1") or th.get("x2") or th.get("url")

    loc = node.get("location") or {}
    mesto = (loc.get("city") or {}).get("name")

    def _cislo(klic):
        try:
            return int(float(hodnoty.get(klic)))
        except Exception:
            return None

    # Vykon: z "184 KM" vytahneme cislo a prepocteme na kW
    vykon_km = _cislo("engine_power")
    if vykon_km is None:
        try:
            vykon_km = int(re.sub(r"[^\d]", "", zobrazene.get("engine_power") or ""))
        except Exception:
            vykon_km = None
    vykon_kw = _km_na_kw(vykon_km)

    # Objem v litrech z "1998 cm3"
    objem_l = None
    objem_ccm = _cislo("engine_capacity")
    if objem_ccm:
        objem_l = round(objem_ccm / 1000.0, 1)

    return {
        "id": str(node.get("id")),
        "titulek": node.get("title"),
        "popis_kratky": node.get("shortDescription"),
        "url": node.get("url"),
        "cena_pln": cena,
        "znacka": zobrazene.get("make"),
        "model": zobrazene.get("model"),
        "verze": zobrazene.get("version"),
        "rok": _cislo("year"),
        "najezd_km": _cislo("mileage"),
        "palivo": zobrazene.get("fuel_type"),
        "palivo_kod": hodnoty.get("fuel_type"),
        "prevodovka": zobrazene.get("gearbox"),
        "vykon_km": vykon_km,
        "vykon_kw": vykon_kw,
        "objem_l": objem_l,
        "mesto": mesto,
        "foto": thumb,
    }


def nacti_inzeraty(znacka, filtry, max_stran=1, pauza=1.0, okruh=None):
    """
    Stahne inzeraty pro danou znacku (nejnovejsi nahore).
    okruh = None -> cele Polsko; jinak dict {mesto_slug, okruh_km}.
    Vraci seznam slovniku.
    """
    vysledky = []
    session = requests.Session()
    session.headers.update(HEADERS)

    for strana in range(1, max_stran + 1):
        base, params = _sestav_url(znacka, filtry, strana, okruh=okruh)
        klic = json.dumps([base, sorted(params.items())])

        zcache = _OCHRANA["cache_get"](klic)
        if zcache is not None:
            vysledky.extend(zcache)
            continue
        if _OCHRANA["je_blokovano"]():
            break

        _OCHRANA["pockej_na_radu"]()
        try:
            r = session.get(base, params=params, timeout=30)
        except Exception as e:
            print("  [otomoto] chyba site:", e)
            break
        if r.status_code in (403, 429):
            print("  [otomoto] HTTP", r.status_code, "(mozna blokace) pro", znacka)
            _OCHRANA["nahlas_blokaci"]()
            break
        if r.status_code != 200:
            print("  [otomoto] HTTP", r.status_code, "pro", znacka)
            break

        adv = _vytahni_json(r.text)
        if not adv:
            print("  [otomoto] nepodarilo se najit data pro", znacka)
            break

        edges = adv.get("edges", [])
        if not edges:
            break
        stranka = []
        for e in edges:
            node = e.get("node")
            if node and node.get("__typename") == "Advert":
                stranka.append(_zpracuj_node(node))
        _OCHRANA["cache_set"](klic, stranka)
        vysledky.extend(stranka)

        if strana < max_stran:
            time.sleep(pauza)

    return vysledky


def _pd_hodnota(pd, klic):
    """Vytahne hodnotu z parametersDict (format: {klic: {'values': [{'value':..}]}})."""
    v = pd.get(klic)
    if isinstance(v, dict):
        vals = v.get("values")
        if isinstance(vals, list) and vals:
            return vals[0].get("value")
    if isinstance(v, list) and v:   # zaloha pro jiny format
        return v[0].get("value")
    return None


def nacti_detail(url):
    """
    Stahne detail inzeratu. Vraci slovnik:
      {
        "popis": str,            # plny popis (cisty text)
        "registrovano_pl": bool, # ma polske znacky / je polske auto
        "puvod": str|None,       # kod zeme puvodu (pl, d, ...)
        "poskozeno": bool,       # oznaceno jako uszkodzony
      }
    Pouziva se jen u nalezenych flipu (1 dotaz navic).
    """
    vychozi = {"popis": "", "registrovano_pl": True, "puvod": None, "poskozeno": False}
    _OCHRANA["pockej_na_radu"]()
    try:
        r = requests.get(url, headers=HEADERS, timeout=30)
        if r.status_code != 200:
            return vychozi
        m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', r.text, re.S)
        if not m:
            return vychozi
        advert = json.loads(m.group(1)).get("props", {}).get("pageProps", {}).get("advert", {})

        pd = advert.get("parametersDict") or {}
        reg = _pd_hodnota(pd, "registered")
        puvod = _pd_hodnota(pd, "country_origin")
        damaged = _pd_hodnota(pd, "damaged")

        # Polske znacky: registrovano v Polsku (registered=1) NEBO polske auto (puvod=pl)
        registrovano_pl = (reg == "1") or (puvod == "pl")

        popis_html = advert.get("description") or ""
        text = re.sub(r"<\s*br\s*/?>", "\n", popis_html, flags=re.I)
        text = re.sub(r"</\s*p\s*>", "\n", text, flags=re.I)
        text = re.sub(r"<[^>]+>", "", text)
        radky = [r.strip() for r in text.splitlines() if r.strip()]

        return {
            "popis": "\n".join(radky),
            "registrovano_pl": registrovano_pl,
            "puvod": puvod,
            "poskozeno": (damaged == "1"),
        }
    except Exception as e:
        print("  [otomoto] chyba detailu:", e)
        return vychozi


def nacti_detail_popis(url):
    """Zpetna kompatibilita: vrati jen popis."""
    return nacti_detail(url).get("popis", "")


if __name__ == "__main__":
    # Rychly test
    test_filtry = {
        "palivo": "vse",
        "min_rok": 2015,
        "max_najezd_km": 200000,
        "max_cena_pln": 80000,
        "min_cena_pln": 10000,
    }
    auta = nacti_inzeraty("bmw", test_filtry, max_stran=1)
    print("Nalezeno:", len(auta))
    for a in auta[:5]:
        print("-", a["titulek"], "|", a["cena_pln"], "PLN |", a["rok"],
              "|", a["najezd_km"], "km |", a["palivo"], "|", a["url"])
