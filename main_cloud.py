# -*- coding: utf-8 -*-
"""CarFlip - cloud multi-tenant beh.

Spousti se z GitHub Actions (jeden beh a konec). Pro kazdeho aktivniho uzivatele
ze Supabase ('nastaveni' tabulka) provede stejnou kontrolu jako legacy main.py
(jeden_beh/zpracuj_auto), jen s jeho vlastnimi filtry/telegram botem a 'videno'
stavem ulozenym ve Supabase ('videno' tabulka) misto sqlite souboru.

Legacy main.py (jeden uzivatel, config.json, videno.db) zustava beze zmeny -
toto je samostatny vstupni bod vedle nej.
"""
from functools import partial

import main as carflip
import supa


def beh_uzivatele(sb, uziv):
    user_id = uziv["user_id"]
    cfg = uziv["cfg"]
    uz_videno = partial(supa.uz_videno, sb, user_id)
    oznac_videno = partial(supa.oznac_videno, sb, user_id)
    prvni_beh = not supa.ma_videno_zaznam(sb, user_id)
    if prvni_beh:
        print("  (prvni beh tohoto uzivatele - projede cely trh)")
    return carflip.jeden_beh(cfg, prvni_beh, uz_videno, oznac_videno)


def main():
    sb = supa.klient()
    uzivatele = supa.nacti_uzivatele(sb)
    print("Cloud beh: {} aktivnich uzivatelu".format(len(uzivatele)))
    for uziv in uzivatele:
        uid = uziv["user_id"]
        print("\n=== Uzivatel {} ===".format(uid))
        try:
            poslano = beh_uzivatele(sb, uziv)
            print("  Hotovo. Poslano upozorneni:", poslano)
        except Exception as e:
            print("  Chyba u uzivatele {}: {}".format(uid, e))


if __name__ == "__main__":
    main()
