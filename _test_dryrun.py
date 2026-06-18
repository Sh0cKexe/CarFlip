# -*- coding: utf-8 -*-
"""Testovaci beh BEZ Telegramu - jen vypise, co by appka nasla."""
import sys
sys.stdout.reconfigure(encoding="utf-8")

import otomoto, bazos, kurz

filtry = {"palivo": "vse", "min_rok": 2015, "max_najezd_km": 200000,
          "max_cena_pln": 90000, "min_cena_pln": 15000}
NAKLADY = 10000
MIN_ZISK = 20000
k = kurz.kurz_pln_czk()
print("Kurz 1 PLN =", round(k, 3), "Kc\n")

for znacka in ["bmw", "audi"]:
    print("=== Znacka:", znacka, "===")
    auta = otomoto.nacti_inzeraty(znacka, filtry, max_stran=1)
    print("nacteno", len(auta), "aut\n")
    for a in auta[:8]:
        if not a["cena_pln"]:
            continue
        odhad = bazos.odhad_ceny(a["znacka"], a["model"], rok=a["rok"])
        cena_czk = int(a["cena_pln"] * k)
        if odhad["median"] and odhad["pocet"] >= 3:
            zisk = odhad["median"] - cena_czk - NAKLADY
            znak = ">>> FLIP!" if zisk >= MIN_ZISK else "         "
            print("{} {} | {} {} km".format(znak, a["titulek"][:42], a["rok"], a["najezd_km"]))
            print("           PL {} Kc | odhad CZ {} Kc (z {}) | ZISK {} Kc".format(
                cena_czk, odhad["median"], odhad["pocet"], zisk))
        else:
            print("    (?)  {} | malo srovnani na Bazosi ({})".format(
                a["titulek"][:42], odhad["pocet"]))
