# -*- coding: utf-8 -*-
"""Sdilene mapovani vicenasobneho vyberu paliva (benzin/nafta/hybrid/
elektro/lpg_cng) - pouziva otomoto.py/autoscout24.py/willhaben.py/bazos.py/
main.py, aby vsechny ctyri zdroje rozumely stejnym kategoriim stejne.

Drive byl palivo filtr jednovyberovy string ("vse"/"benzin"/"diesel") a
LPG/CNG bylo VZDY tvrde vyrazene (main.py _je_plyn, bez ohledu na filtr -
kvuli riziku plynove prestavby). Ted je vicevyberovy seznam a LPG/CNG je
vyrazene jen kdyz uzivatel "lpg_cng" SAM nezaskrtne (bezpecny vychozi stav,
schvaleno uzivatelem - "pokud to nebudu mit nastavene v palivech, neuvidim
to")."""

KATEGORIE = ("benzin", "nafta", "hybrid", "elektro", "lpg_cng")


def normalizuj(filtry):
    """Vrati seznam vybranych kategorii. Zpetna kompatibilita: stary format
    byl jednovyberovy string ('vse'/'benzin'/'diesel')."""
    p = filtry.get("palivo")
    if isinstance(p, list):
        return [x for x in p if x in KATEGORIE]
    if p == "benzin":
        return ["benzin"]
    if p == "diesel":
        return ["nafta"]
    return []  # "vse"/chybi/jine -> bez filtru (vyloucit_plyn rozhoduje o LPG/CNG)


def vyloucit_plyn(filtry):
    """True = auta s LPG/CNG se nemaji fetchnout/zobrazit - vychozi stav,
    dokud uzivatel "lpg_cng" sam nezaskrtne."""
    return "lpg_cng" not in normalizuj(filtry)


def naj_cap(filtry, vybrane=None):
    """Max nájezd pro URL dotaz pri hledani (ne pri vyhodnoceni konkretniho
    auta - to dela main._najezd_ok podle SKUTECNEHO paliva auta). Kdyz je
    vybrana jen 'nafta', pouzije se max_najezd_nafta; jinak (cokoliv jineho,
    vic typu, nebo nic vybrano) max_najezd_benzin / vyssi z obou."""
    if vybrane is None:
        vybrane = normalizuj(filtry)
    naj_nafta = filtry.get("max_najezd_nafta")
    naj_benzin = filtry.get("max_najezd_benzin")
    naj_stary = filtry.get("max_najezd_km")
    if vybrane == ["nafta"]:
        return naj_nafta or naj_stary
    if vybrane and "nafta" not in vybrane:
        return naj_benzin or naj_stary
    kandidati = [v for v in (naj_nafta, naj_benzin, naj_stary) if v]
    return max(kandidati) if kandidati else None
