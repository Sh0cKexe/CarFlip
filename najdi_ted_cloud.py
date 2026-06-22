# -*- coding: utf-8 -*-
"""
NAJDI TEĎ - cloud verze pro JEDNOHO uzivatele (spousti web tlacitko pres
GitHub Actions workflow_dispatch, viz .github/workflows/najdi-ted.yml).

Na rozdil od hlavniho hlidani (main.jeden_beh) projede VSECHNU aktualni
nabidku (vsechny stranky, ne jen nejnovejsi), BEZ dedup (videno), a posle
vsechny ziskove najednou. Stejny princip jako puvodni lokalni najdi_ted.py,
jen cte uzivatele ze Supabase (NAJDI_TED_USER_ID) misto config.json a umi
navic zdroje "cz"/"sk" (Bazos primo jako zdroj, Faze 1 multi-market).
"""
import os
import time

import otomoto
import bazos
import kurz
import preklad
import telegram_send as tg
import supa
import main  # reuse cistych helperu a formatovani zprav

# Bezpecnostni strop stranek na jednu znacku+okruh (1 stranka = 32 aut).
MAX_STRAN = 25


def _najdi_pl(cfg, kurz_pln):
    """Projede celou aktualni nabidku na Otomoto (zdroj 'pl'), bez dedup.
    Vraci list (zisk, popisek, foto) serazeny od nejvyssiho zisku."""
    filtry = cfg["filtry"]
    trh = cfg.get("trh", "cz")
    naklady = cfg["naklady_dovoz_kc"]
    min_zisk = cfg["min_zisk_kc"]
    min_srovnani = cfg.get("min_srovnani", 5)
    okruhy = [o for o in (filtry.get("oblasti") or []) if o.get("zeme", "pl") == "pl"] or [None]

    videno_id = set()
    auta = []
    for znacka in filtry.get("znacky", []):
        for okruh in okruhy:
            try:
                davka = otomoto.nacti_inzeraty(znacka, filtry, max_stran=MAX_STRAN, okruh=okruh)
            except Exception as e:
                print("  chyba Otomoto:", e)
                continue
            for a in davka:
                if a["id"] not in videno_id:
                    videno_id.add(a["id"])
                    auta.append(a)
    print("PL: k vyhodnoceni {} aut".format(len(auta)))

    vysledky = []
    for a in auta:
        if not a.get("cena_pln") or not a.get("znacka"):
            continue
        if main._je_plyn(a):
            continue
        if not main._najezd_ok(a, filtry):
            continue
        cena_mistni = int(a["cena_pln"] * kurz_pln)
        odhad = bazos.odhad_ceny(a["znacka"], a.get("model"), rok=a.get("rok"),
                                  najezd_km=a.get("najezd_km"),
                                  cena_anchor_czk=cena_mistni,
                                  palivo=a.get("palivo_kod"),
                                  objem_l=a.get("objem_l"),
                                  min_pocet=min_srovnani,
                                  trh=trh)
        if not odhad["median"] or odhad["pocet"] < min_srovnani:
            continue
        zisk = odhad["median"] - cena_mistni - naklady
        if zisk < min_zisk:
            continue
        info = otomoto.nacti_detail(a["url"])
        if info["registrovano_pl"] is False or info["poskozeno"]:
            continue
        plny_popis = info["popis"] or a.get("popis_kratky") or ""
        if main._problem_v_popisu(plny_popis):
            continue
        popis_cz = preklad.prelozit(plny_popis)
        popisek = main.naformatuj_zpravu(a, cena_mistni, odhad, zisk, naklady, trh=trh)
        detail = main.naformatuj_detail(popis_cz, odhad, trh=trh)
        vysledky.append((zisk, popisek, detail, a.get("foto")))
        print("  >>> PL kandidat: {} | zisk {}".format(a["titulek"][:40], zisk))

    vysledky.sort(key=lambda x: -x[0])
    return vysledky


def _najdi_domaci(cfg, zdroj_trh):
    """Projede Bazos primo jako zdroj (zdroj_trh 'cz'/'sk'), bez dedup,
    porovna proti DOMOVSKEMU trhu uzivatele (cfg['trh']). Vyssi max_stran
    nez bezny cyklus - bazos.py ma vlastni 12h cache, opakovane spousteni
    nestoji nic navic."""
    filtry = cfg["filtry"]
    domovsky_trh = cfg.get("trh", "cz")
    min_srovnani = cfg.get("min_srovnani", 5)
    okruhy = [o for o in (filtry.get("oblasti") or []) if o.get("zeme") == zdroj_trh] or [None]

    vysledky = []
    for znacka in filtry.get("znacky", []):
        for okruh in okruhy:
            try:
                nalezy = bazos.najdi_podhodnocene(
                    znacka, filtry, zdroj_trh=zdroj_trh, domovsky_trh=domovsky_trh,
                    min_zisk_kc=cfg["min_zisk_kc"],
                    naklady_dovoz_kc=cfg["naklady_dovoz_kc"],
                    min_srovnani=min_srovnani,
                    lokalita=okruh.get("mesto_slug") if okruh else None,
                    okruh_km=okruh.get("okruh_km") if okruh else None,
                    max_stran=5,
                )
            except Exception as e:
                print("  chyba Bazos {}:".format(zdroj_trh), e)
                continue
            for nalez in nalezy:
                popisek = main.naformatuj_zpravu_domaci(nalez, zdroj_trh, domovsky_trh)
                detail = main.naformatuj_detail_domaci(nalez, zdroj_trh, domovsky_trh)
                vysledky.append((nalez["zisk"], popisek, detail, nalez.get("foto")))
                print("  >>> {} kandidat: {} | zisk {}".format(
                    zdroj_trh.upper(), nalez["titulek"][:40], nalez["zisk"]))

    vysledky.sort(key=lambda x: -x[0])
    return vysledky


def main_najdi(user_id):
    sb = supa.klient()
    cfg = supa.nacti_uzivatele_jeden(sb, user_id)
    if not cfg:
        print("!!! Uzivatel nenalezen nebo nema telegram token/chat_id.")
        return

    token = cfg["telegram"]["token"]
    prijemci = main._prijemci(cfg)
    trh = cfg.get("trh", "cz")
    zdroje = cfg["filtry"].get("zdroje") or ["pl"]

    vysledky = []
    if "pl" in zdroje:
        kurz_pln = kurz.kurz_pln_eur() if trh == "sk" else kurz.kurz_pln_czk()
        vysledky += _najdi_pl(cfg, kurz_pln)
    for domaci_trh in ("cz", "sk"):
        if domaci_trh in zdroje:
            vysledky += _najdi_domaci(cfg, domaci_trh)

    uvod = "🔎 <b>Najdi teď</b> – aktuální nabídka.\nZiskových aut: {}.".format(len(vysledky))
    for cid in prijemci:
        tg.posli_zpravu(token, cid, uvod)

    for zisk, popisek, detail, foto in vysledky:
        for cid in prijemci:
            if foto:
                tg.posli_foto(token, cid, foto, popisek)
            else:
                tg.posli_zpravu(token, cid, popisek)
            if detail.strip():
                tg.posli_zpravu(token, cid, detail)
        time.sleep(0.5)

    if not vysledky:
        for cid in prijemci:
            tg.posli_zpravu(token, cid, "ℹ️ Teď podle tvých filtrů nevyšlo žádné ziskové auto.")

    print("=== HOTOVO === poslano:", len(vysledky))


if __name__ == "__main__":
    uid = os.environ.get("NAJDI_TED_USER_ID")
    if not uid:
        print("!!! Chybi env NAJDI_TED_USER_ID.")
    else:
        main_najdi(uid)
