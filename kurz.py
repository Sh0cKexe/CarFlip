# -*- coding: utf-8 -*-
"""Kurz PLN -> CZK z oficialnich dat CNB (zdarma, bez klice).

Vysledek se cachuje do souboru kurz_cache.json, aby se netahalo
pri kazdem behu (kurz se meni jen jednou denne).
"""
import os
import json
import datetime
import requests

CNB_URL = ("https://www.cnb.cz/en/financial-markets/foreign-exchange-market/"
           "central-bank-exchange-rate-fixing/central-bank-exchange-rate-fixing/"
           "daily.txt")
CACHE = os.path.join(os.path.dirname(__file__), "kurz_cache.json")
ZALOHA = 5.7  # nouzova hodnota, kdyby CNB nejela


ZALOHA_EUR_CZK = 25.2  # nouzova hodnota pro EUR/CZK, kdyby CNB nejela


def _nacti_z_cnb():
    r = requests.get(CNB_URL, timeout=20)
    r.raise_for_status()
    pln_czk = None
    eur_czk = None
    for line in r.text.splitlines():
        # format: Poland|zloty|1|PLN|5.694
        casti = line.split("|")
        if len(casti) != 5 or casti[3] not in ("PLN", "EUR"):
            continue
        mnozstvi = float(casti[2])
        kurz = float(casti[4].replace(",", "."))
        if casti[3] == "PLN":
            pln_czk = kurz / mnozstvi  # CZK za 1 PLN
        else:
            eur_czk = kurz / mnozstvi  # CZK za 1 EUR
    if pln_czk is None:
        raise ValueError("PLN nenalezen v datech CNB")
    if eur_czk is None:
        raise ValueError("EUR nenalezen v datech CNB")
    return pln_czk, eur_czk


def _kurzy_dnes():
    """Vrati (pln_czk, eur_czk), cachovano na jeden den."""
    dnes = datetime.date.today().isoformat()
    if os.path.exists(CACHE):
        try:
            with open(CACHE, "r", encoding="utf-8") as f:
                c = json.load(f)
            if c.get("datum") == dnes and "eur_czk" in c:
                return c["kurz"], c["eur_czk"]
        except Exception:
            pass
    try:
        pln_czk, eur_czk = _nacti_z_cnb()
        with open(CACHE, "w", encoding="utf-8") as f:
            json.dump({"datum": dnes, "kurz": pln_czk, "eur_czk": eur_czk}, f)
        return pln_czk, eur_czk
    except Exception as e:
        print("  [kurz] nepodarilo se nacist z CNB, pouzivam zalohu:", e)
        return ZALOHA, ZALOHA_EUR_CZK


def kurz_pln_czk():
    """Vrati kolik Kc stoji 1 PLN. Cachuje na jeden den."""
    pln_czk, _ = _kurzy_dnes()
    return pln_czk


def kurz_pln_eur():
    """Vrati kolik EUR stoji 1 PLN (cross-rate pres CZK). Cachuje na jeden den."""
    pln_czk, eur_czk = _kurzy_dnes()
    return pln_czk / eur_czk


def kurz_czk_eur():
    """Vrati kolik EUR stoji 1 Kc (cross-rate pres PLN). Pouzitelne obema
    smery: cena_eur = cena_czk * kurz_czk_eur(); cena_czk = cena_eur / kurz_czk_eur()."""
    return kurz_pln_eur() / kurz_pln_czk()


if __name__ == "__main__":
    print("1 PLN =", round(kurz_pln_czk(), 3), "CZK")
    print("1 PLN =", round(kurz_pln_eur(), 4), "EUR")
