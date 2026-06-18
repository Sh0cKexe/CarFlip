# -*- coding: utf-8 -*-
"""
Jednorazovy test: pouzije TVE realne filtry z config.json, projde vsechny
tve znacky, a posle na Telegram 3 nejvyhodnejsi nalezena auta (podle zisku).
"""
import sys
sys.stdout.reconfigure(encoding="utf-8")

import json, os, time
import otomoto, bazos, kurz, preklad
import telegram_send as tg
import main

cfg = json.load(open(os.path.join(os.path.dirname(__file__), "config.json"), encoding="utf-8"))
token = cfg["telegram"]["token"]
chat = cfg["telegram"]["chat_id"]
naklady = cfg["naklady_dovoz_kc"]
filtry = cfg["filtry"]

k = kurz.kurz_pln_czk()
print("Kurz 1 PLN =", round(k, 3), "Kc")
print("Filtry:", filtry)

# Aby nas Bazos nezablokoval, test je SETRNY: jen par znacek, malo aut,
# pauzy mezi dotazy a brzke zastaveni jakmile mame dost kandidatu.
TEST_ZNACKY = [z for z in ["volkswagen", "skoda", "ford", "opel", "renault"]
               if z in filtry.get("znacky", [])] or filtry.get("znacky", [])[:3]
MAX_AUT_NA_ZNACKU = 12
DOST_KANDIDATU = 6

kandidati = []
for znacka in TEST_ZNACKY:
    if len(kandidati) >= DOST_KANDIDATU:
        break
    print("Hledam:", znacka)
    try:
        auta = otomoto.nacti_inzeraty(znacka, filtry, max_stran=1)
    except Exception as e:
        print("  chyba:", e)
        continue
    print("  nacteno", len(auta))
    for a in auta[:MAX_AUT_NA_ZNACKU]:
        if len(kandidati) >= DOST_KANDIDATU:
            break
        if not a.get("cena_pln") or not a.get("znacka"):
            continue
        cena_czk = int(a["cena_pln"] * k)
        try:
            odhad = bazos.odhad_ceny(a["znacka"], a.get("model"), rok=a.get("rok"),
                                     najezd_km=a.get("najezd_km"),
                                     cena_anchor_czk=cena_czk)
        except Exception:
            continue
        time.sleep(1.0)  # setrnost k Bazosi
        if not odhad["median"] or odhad["pocet"] < 3:
            continue
        zisk = odhad["median"] - cena_czk - naklady
        kandidati.append((zisk, a, cena_czk, odhad))

# Serad od nejvyssiho zisku
kandidati.sort(key=lambda x: x[0], reverse=True)
print("\nCelkem kandidatu s odhadem:", len(kandidati))

tg.posli_zpravu(token, chat,
    "🔎 <b>CarFlip – nálezy podle tvých filtrů</b>\nPosílám 3 nejvýhodnější auta, co teď na Otomoto jsou.")

posláno = 0
for zisk, a, cena_czk, odhad in kandidati:
    if posláno >= 3:
        break
    popisek = main.naformatuj_zpravu(a, cena_czk, odhad, zisk, naklady)
    if a.get("foto"):
        tg.posli_foto(token, chat, a["foto"], popisek)
    else:
        tg.posli_zpravu(token, chat, popisek)
    plny = otomoto.nacti_detail_popis(a["url"]) or a.get("popis_kratky") or ""
    popis_cz = preklad.prelozit(plny)
    detail = main.naformatuj_detail(popis_cz, odhad)
    if detail.strip():
        tg.posli_zpravu(token, chat, detail)
    posláno += 1
    print("Poslano:", a["titulek"], "| zisk", zisk)

if posláno == 0:
    tg.posli_zpravu(token, chat,
        "ℹ️ Teď jsem podle tvých filtrů nenašel auto, u kterého by šlo spolehlivě "
        "spočítat cenu z Bazoše. Zkus trochu uvolnit filtry nebo počkej na nové inzeráty.")
print("Hotovo, posláno:", posláno)
