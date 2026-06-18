# -*- coding: utf-8 -*-
"""
Prevod kliknuteho bodu na mapě -> nejblizsi polske mesto (pro Otomoto).
Pouziva OpenStreetMap Nominatim (zdarma, bez klice).
"""
import re
import unicodedata
import requests

# Polske diakritiky, ktere se nerozlozi pres NFKD
SPECIAL = {"ł": "l", "Ł": "l"}


def slug(text):
    """'Wrocław' -> 'wroclaw', 'Kraków' -> 'krakow', 'Łódź' -> 'lodz'."""
    if not text:
        return ""
    for k, v in SPECIAL.items():
        text = text.replace(k, v)
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text


def bod_na_mesto(lat, lon):
    """
    Vrati (nazev_mesta, slug) pro dane souradnice, nebo (None, None).
    """
    try:
        r = requests.get(
            "https://nominatim.openstreetmap.org/reverse",
            params={"lat": lat, "lon": lon, "format": "json",
                    "accept-language": "pl", "zoom": 10},
            headers={"User-Agent": "CarFlip/1.0 (osobni nastroj na auta)"},
            timeout=15,
        )
        adr = r.json().get("address", {})
    except Exception as e:
        print("  [geokod] chyba:", e)
        return None, None

    for klic in ["city", "town", "village", "municipality", "county"]:
        if adr.get(klic):
            nazev = adr[klic]
            return nazev, slug(nazev)
    return None, None


if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    print(bod_na_mesto(51.11, 17.03))   # Wroclaw
    print(bod_na_mesto(50.06, 19.94))   # Krakow
