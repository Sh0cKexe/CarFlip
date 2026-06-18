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


def _nacti_z_cnb():
    r = requests.get(CNB_URL, timeout=20)
    r.raise_for_status()
    for line in r.text.splitlines():
        # format: Poland|zloty|1|PLN|5.694
        casti = line.split("|")
        if len(casti) == 5 and casti[3] == "PLN":
            mnozstvi = float(casti[2])
            kurz = float(casti[4].replace(",", "."))
            return kurz / mnozstvi  # CZK za 1 PLN
    raise ValueError("PLN nenalezen v datech CNB")


def kurz_pln_czk():
    """Vrati kolik Kc stoji 1 PLN. Cachuje na jeden den."""
    dnes = datetime.date.today().isoformat()
    if os.path.exists(CACHE):
        try:
            with open(CACHE, "r", encoding="utf-8") as f:
                c = json.load(f)
            if c.get("datum") == dnes:
                return c["kurz"]
        except Exception:
            pass
    try:
        kurz = _nacti_z_cnb()
        with open(CACHE, "w", encoding="utf-8") as f:
            json.dump({"datum": dnes, "kurz": kurz}, f)
        return kurz
    except Exception as e:
        print("  [kurz] nepodarilo se nacist z CNB, pouzivam zalohu:", e)
        return ZALOHA


if __name__ == "__main__":
    print("1 PLN =", round(kurz_pln_czk(), 3), "CZK")
