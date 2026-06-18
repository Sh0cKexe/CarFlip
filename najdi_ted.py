# -*- coding: utf-8 -*-
"""
NAJDI TEĎ - jednorazove prohledani aktualni nabidky.

Na rozdil od hlavni aplikace (ktera hlida jen NOVA auta) tohle projede
VSECHNA aktualni auta podle tvych filtru a posle na Telegram ty ziskove.

- POUZIVA stejne filtry a stejnou logiku jako ostra aplikace.
- PROJEDE VSECHNY stranky (celou aktualni nabidku), ne jen prvnich 32.
- NESAHA na pamet videnych aut (videno.db) ani na hlidani.
- Posila TOBE i KOLEGOVI (vsem prijemcum z nastaveni).
- Diky cache na Bazosi (12 h) ho muzes spoustet opakovane bez zateze.
"""
import sys
import os
import json
import time

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

import otomoto
import bazos
import kurz
import preklad
import telegram_send as tg
import main   # znovu pouzijeme jeho logiku i formatovani

# Kolik nejvyse aut poslat (serazeno od nejvyssiho zisku).
# 0 = bez limitu (posle vsechna ziskova auta).
MAX_POSLAT = 0

# Bezpecnostni strop stranek na jednu znacku+okruh (1 stranka = 32 aut).
# 25 stran = az 800 aut. Chrani pred obrovskym behem (napr. cele Polsko).
MAX_STRAN = 25


def nacti_config():
    # Pouzijeme stejne nacitani jako hlavni program (vc. tokenu z token.txt).
    return main.nacti_config()


def main_najdi():
    cfg = nacti_config()
    token = cfg["telegram"]["token"]
    prijemci = main._prijemci(cfg)   # ty + kolega (vsichni z nastaveni)
    if not token or not prijemci:
        print("!!! Neni nastaveny Telegram. Spust 2-NASTAVENI.bat.")
        return
    print("Posilam prijemcum:", prijemci)

    filtry = cfg["filtry"]
    naklady = cfg["naklady_dovoz_kc"]
    min_zisk = cfg["min_zisk_kc"]
    min_srovnani = cfg.get("min_srovnani", 5)
    okruhy = filtry.get("oblasti") or [None]

    kurz_pln = kurz.kurz_pln_czk()
    print("Kurz: 1 PLN =", round(kurz_pln, 3), "Kc")
    print("Filtry:", filtry.get("znacky"), "| prevod:", filtry.get("prevodovka"),
          "| okruhy:", [o["nazev"] for o in okruhy if o])
    print("Prohledavam aktualni nabidku...\n")

    # 1) Posbiram vsechna auta (dedup podle id)
    videno_id = set()
    auta = []
    for znacka in filtry.get("znacky", []):
        for okruh in okruhy:
            kde = okruh["nazev"] if okruh else "cele PL"
            try:
                # projde vsechny stranky (az do MAX_STRAN)
                davka = otomoto.nacti_inzeraty(znacka, filtry, max_stran=MAX_STRAN, okruh=okruh)
            except Exception as e:
                print("  chyba Otomoto:", e)
                continue
            for a in davka:
                if a["id"] not in videno_id:
                    videno_id.add(a["id"])
                    auta.append(a)
            strop = " (STROP {} stran!)".format(MAX_STRAN) if len(davka) >= MAX_STRAN * 32 else ""
            print("  {:11} {:12} -> {} aut{}".format(znacka, kde, len(davka), strop))
    print("\nCelkem k vyhodnoceni: {} aut\n".format(len(auta)))

    # 2) Vyhodnoceni (stejna logika jako ostra appka)
    kandidati = []
    preskoceno = {"plyn": 0, "najezd": 0, "malo_srovnani": 0, "nizky_zisk": 0,
                  "registrace": 0, "poskozeni": 0}
    for i, a in enumerate(auta, 1):
        if not a.get("cena_pln") or not a.get("znacka"):
            continue
        if main._je_plyn(a):
            preskoceno["plyn"] += 1
            continue
        if not main._najezd_ok(a, filtry):
            preskoceno["najezd"] += 1
            continue
        cena_czk = int(a["cena_pln"] * kurz_pln)
        odhad = bazos.odhad_ceny(a["znacka"], a.get("model"), rok=a.get("rok"),
                                 najezd_km=a.get("najezd_km"),
                                 cena_anchor_czk=cena_czk,
                                 palivo=a.get("palivo_kod"),
                                 objem_l=a.get("objem_l"),
                                 min_pocet=min_srovnani)
        if not odhad["median"] or odhad["pocet"] < min_srovnani:
            preskoceno["malo_srovnani"] += 1
            continue
        zisk = odhad["median"] - cena_czk - naklady
        if zisk < min_zisk:
            preskoceno["nizky_zisk"] += 1
            continue
        # detail: registrace + stav
        info = otomoto.nacti_detail(a["url"])
        if info["registrovano_pl"] is False:
            preskoceno["registrace"] += 1
            continue
        if info["poskozeno"]:
            preskoceno["poskozeni"] += 1
            continue
        plny_popis = info["popis"] or a.get("popis_kratky") or ""
        if main._problem_v_popisu(plny_popis):
            preskoceno["poskozeni"] += 1
            continue
        kandidati.append((zisk, a, cena_czk, odhad, plny_popis))
        print("  >>> KANDIDAT: {} | zisk {} Kc".format(a["titulek"][:38], zisk))

    # 3) Serad od nejvyssiho zisku a posli (jen tobe), s limitem
    kandidati.sort(key=lambda x: x[0], reverse=True)
    print("\nNalezeno ziskovych: {} | posilam max {}".format(len(kandidati), MAX_POSLAT))

    posilat = kandidati if MAX_POSLAT <= 0 else kandidati[:MAX_POSLAT]
    uvod = "🔎 <b>Najdi teď</b> – aktuální nabídka.\nZiskových aut: {} (posílám {}).".format(
        len(kandidati), len(posilat))
    for cid in prijemci:
        tg.posli_zpravu(token, cid, uvod)

    poslano = 0
    for zisk, a, cena_czk, odhad, plny_popis in posilat:
        popisek = main.naformatuj_zpravu(a, cena_czk, odhad, zisk, naklady)
        popis_cz = preklad.prelozit(plny_popis)
        detail = main.naformatuj_detail(popis_cz, odhad)
        for cid in prijemci:
            if a.get("foto"):
                tg.posli_foto(token, cid, a["foto"], popisek)
            else:
                tg.posli_zpravu(token, cid, popisek)
            if detail.strip():
                tg.posli_zpravu(token, cid, detail)
        poslano += 1
        time.sleep(0.5)

    if not kandidati:
        for cid in prijemci:
            tg.posli_zpravu(token, cid,
                "ℹ️ Teď podle tvých filtrů nevyšlo žádné ziskové auto.")

    print("\n=== HOTOVO ===")
    print("Posláno:", poslano)
    print("Přeskočeno:", preskoceno)


if __name__ == "__main__":
    main_najdi()
