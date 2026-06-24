# -*- coding: utf-8 -*-
"""
Scraper inzeratu z AutoScout24 (Nemecko/Rakousko/Italie - jedna platforma,
jen jina domena podle zeme). Stejny trik jako Otomoto - data jsou v
__NEXT_DATA__ (Next.js), zadne parsovani HTML.

Na rozdil od Otomoto/Bazose ma AutoScout24 vyhodu: vyhledavani uz ma
parametr damaged_listing=exclude (skryje havarovana auta primo ve
vysledcich) a detail inzeratu nese strukturovane pole hadAccident
(misto hledani frazi v textu jako u polskeho popisu).
"""
import re
import json
import time
import requests

import ochrana_scrapingu

_OCHRANA = ochrana_scrapingu.vytvor_ochranu("autoscout24_cache.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/124.0 Safari/537.36",
}

DOMENA = {
    "de": "www.autoscout24.de",
    "it": "www.autoscout24.it",
}

# Prevod paliva (nas zapis -> AutoScout24 kod)
PALIVO_MAP = {
    "nafta": "D",
    "benzin": "B",
}

# Prevod prevodovky (nas zapis -> AutoScout24 kod)
PREVODOVKA_MAP = {
    "automat": "A",
    "manual": "M",
}

# Plynove palivo - kody AutoScout24 (allFuelTypes/fuel obsahuje neco z tohoto)
PLYN_SLOVA = ("lpg", "autogas", "cng", "erdgas")


def _sestav_url(znacka, filtry, strana, zeme, okruh=None):
    """
    Sestavi URL pro vyhledavani na AutoScout24 podle filtru.
    okruh = None -> cela zeme; jinak dict {plz, okruh_km}.
    """
    base = "https://{}/lst/{}".format(DOMENA[zeme], znacka)
    params = {
        "atype": "C",
        "sort": "age",
        "desc": "1",
        "size": "20",
        "damaged_listing": "exclude",  # havarovana auta uz vyfiltrovana primo zde
        "page": str(strana),
    }
    if filtry.get("min_rok"):
        params["fregfrom"] = filtry["min_rok"]

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
        params["kmto"] = cap

    if filtry.get("max_cena_eur"):
        params["priceto"] = filtry["max_cena_eur"]
    if filtry.get("min_cena_eur"):
        params["pricefrom"] = filtry["min_cena_eur"]

    if palivo in PALIVO_MAP:
        params["fuel"] = PALIVO_MAP[palivo]

    prevodovka = filtry.get("prevodovka", "vse")
    if prevodovka in PREVODOVKA_MAP:
        params["gear"] = PREVODOVKA_MAP[prevodovka]

    if okruh and okruh.get("plz"):
        params["zip"] = okruh["plz"]
        params["zipr"] = int(okruh.get("okruh_km") or 100)

    return base, params


def _vytahni_json(html):
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.S)
    if not m:
        return None
    try:
        data = json.loads(m.group(1))
    except Exception:
        return None
    return data.get("props", {}).get("pageProps", {})


def _vykon_kw_z_detailu(vehicle_details):
    """Vytahne kW z vehicleDetails [{"data": "85 kW (116 PS)", "iconName": "speedometer", ...}]."""
    for d in vehicle_details or []:
        if d.get("iconName") == "speedometer":
            m = re.search(r"(\d+)\s*kW", d.get("data") or "")
            if m:
                return int(m.group(1))
    return None


def _rok_z_tracking(tracking):
    """firstRegistration je 'MM-YYYY' nebo None."""
    fr = (tracking or {}).get("firstRegistration") or ""
    m = re.search(r"(\d{4})$", fr)
    return int(m.group(1)) if m else None


def _zpracuj_listing(item, zeme):
    vehicle = item.get("vehicle") or {}
    tracking = item.get("tracking") or {}
    location = item.get("location") or {}
    price = item.get("price") or {}

    najezd_km = None
    try:
        najezd_km = int(re.sub(r"[^\d]", "", tracking.get("mileage") or vehicle.get("mileageInKm") or ""))
    except Exception:
        pass

    objem_l = None
    try:
        ccm = int(re.sub(r"[^\d]", "", vehicle.get("engineDisplacementInCCM") or ""))
        objem_l = round(ccm / 1000.0, 1)
    except Exception:
        pass

    palivo = vehicle.get("fuel")
    palivo_kod = tracking.get("fuelType")

    foto = None
    if item.get("images"):
        foto = item["images"][0]

    znacka = vehicle.get("make") or ""
    model = vehicle.get("model") or ""
    verze = vehicle.get("modelVersionInput") or ""
    titulek = " ".join(x for x in (znacka, model, verze) if x).strip()

    return {
        "id": "as24_{}_{}".format(zeme, item.get("id")),
        "titulek": titulek or model or znacka,
        "popis_kratky": None,
        "url": "https://{}{}".format(DOMENA[zeme], item.get("url") or ""),
        "cena": price.get("priceRaw"),
        "znacka": znacka,
        "model": model,
        "verze": verze,
        "rok": _rok_z_tracking(tracking),
        "najezd_km": najezd_km,
        "palivo": palivo,
        "palivo_kod": palivo_kod,
        "prevodovka": vehicle.get("transmission"),
        "vykon_kw": _vykon_kw_z_detailu(item.get("vehicleDetails")),
        "objem_l": objem_l,
        "mesto": location.get("city"),
        "foto": foto,
    }


def nacti_inzeraty(znacka, filtry, max_stran=1, pauza=1.0, okruh=None, zeme="de"):
    """Stahne inzeraty pro danou znacku (nejnovejsi nahore). Vraci seznam slovniku."""
    vysledky = []
    session = requests.Session()
    session.headers.update(HEADERS)

    for strana in range(1, max_stran + 1):
        base, params = _sestav_url(znacka, filtry, strana, zeme, okruh=okruh)
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
            print("  [autoscout24] chyba site:", e)
            break
        if r.status_code in (403, 429):
            print("  [autoscout24] HTTP", r.status_code, "(mozna blokace) pro", znacka)
            _OCHRANA["nahlas_blokaci"]()
            break
        if r.status_code != 200:
            print("  [autoscout24] HTTP", r.status_code, "pro", znacka)
            break

        pp = _vytahni_json(r.text)
        if not pp:
            print("  [autoscout24] nepodarilo se najit data pro", znacka)
            break

        listings = pp.get("listings") or []
        if not listings:
            break
        stranka = []
        for item in listings:
            try:
                stranka.append(_zpracuj_listing(item, zeme))
            except Exception as e:
                print("  [autoscout24] chyba zpracovani inzeratu:", e)
        _OCHRANA["cache_set"](klic, stranka)
        vysledky.extend(stranka)

        if strana < max_stran:
            time.sleep(pauza)

    return vysledky


def _strip_html(html_text):
    text = re.sub(r"<\s*br\s*/?>", "\n", html_text or "", flags=re.I)
    text = re.sub(r"</\s*(p|li|ul)\s*>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    radky = [r.strip() for r in text.splitlines() if r.strip()]
    return "\n".join(radky)


def nacti_detail(url):
    """
    Stahne detail inzeratu. Vraci slovnik:
      {"popis": str, "poskozeno": bool}
    Pouziva se jen u nalezenych flipu (1 dotaz navic).
    """
    vychozi = {"popis": "", "poskozeno": False}
    _OCHRANA["pockej_na_radu"]()
    try:
        r = requests.get(url, headers=HEADERS, timeout=30)
        if r.status_code != 200:
            return vychozi
        pp = _vytahni_json(r.text)
        if not pp:
            return vychozi
        ld = pp.get("listingDetails") or {}
        vehicle = ld.get("vehicle") or {}

        popis = _strip_html(ld.get("description"))
        had_accident = vehicle.get("hadAccident")
        damage_conditions = vehicle.get("damageConditions")
        poskozeno = bool(had_accident) or bool(damage_conditions)

        return {"popis": popis, "poskozeno": poskozeno}
    except Exception as e:
        print("  [autoscout24] chyba detailu:", e)
        return vychozi


if __name__ == "__main__":
    test_filtry = {
        "palivo": "nafta",
        "min_rok": 2015,
        "max_najezd_nafta": 150000,
        "max_cena_eur": 12000,
        "min_cena_eur": 1000,
    }
    auta = nacti_inzeraty("skoda", test_filtry, max_stran=1, zeme="de")
    print("Nalezeno:", len(auta))
    for a in auta[:5]:
        print("-", a["titulek"], "|", a["cena"], "EUR |", a["rok"],
              "|", a["najezd_km"], "km |", a["palivo"], "|", a["url"])
