# -*- coding: utf-8 -*-
"""Sdilena ochrana proti blokaci pri scrapingu inzertnich portalu.

Puvodne implementovano jen v bazos.py (cache + slusne tempo + cooldown po
429). Pri vic uzivatelich (kazdy se svymi filtry) by bez tohoto pocet
HTTP dotazu na Otomoto/AutoScout24/Willhaben rostl skoro linearne s
poctem uzivatelu - vytazeno sem, aby to mohl pouzit kazdy scraper
stejne (kazdy se svym vlastnim cache souborem, aby se navzajem neprepisovaly).

Princip (per zdroj, vraceny jako sada funkci):
1) Trvala cache na disk (klic -> data), platnost cache_ttl vterin - stejny
   dotaz (stejne filtry/strana) se znovu nestahuje, sdili se mezi VSEMI
   uzivateli, ne jen jednim.
2) Slusne tempo mezi dotazy (min_pauza + nahodna rezerva).
3) Cooldown: kdyz portal odpovi 403/429 (nebo jinak vypadne na blokaci),
   na chvili se uplne odmlcime, at situaci nezhorsujeme.
"""
import os
import json
import time
import random

_SLOZKA = os.path.dirname(__file__)


def vytvor_ochranu(cache_soubor, cache_ttl=12 * 3600, min_pauza=3.0, cooldown=15 * 60):
    cesta = os.path.join(_SLOZKA, cache_soubor)
    try:
        with open(cesta, encoding="utf-8") as f:
            cache = json.load(f)
    except Exception:
        cache = {}
    stav = {"posledni": 0.0, "blok_do": 0.0}

    def cache_get(klic):
        zaznam = cache.get(klic)
        if zaznam and (time.time() - zaznam.get("kdy", 0)) < cache_ttl:
            return zaznam["data"]
        return None

    def cache_set(klic, data):
        if not data:
            return  # necachujeme prazdno - mohlo by to byt jen docasny vypadek
        cache[klic] = {"kdy": time.time(), "data": data}
        try:
            with open(cesta, "w", encoding="utf-8") as f:
                json.dump(cache, f, ensure_ascii=False)
        except Exception as e:
            print("  [ochrana] nelze ulozit cache ({}):".format(cache_soubor), e)

    def pockej_na_radu():
        od_posledniho = time.time() - stav["posledni"]
        if od_posledniho < min_pauza:
            time.sleep(min_pauza - od_posledniho + random.uniform(0, 1.0))
        stav["posledni"] = time.time()

    def je_blokovano():
        return time.time() < stav["blok_do"]

    def nahlas_blokaci():
        stav["blok_do"] = time.time() + cooldown
        print("  [ochrana] mozna blokace ({}) -> pauza {} min".format(cache_soubor, cooldown // 60))

    return {
        "cache_get": cache_get,
        "cache_set": cache_set,
        "pockej_na_radu": pockej_na_radu,
        "je_blokovano": je_blokovano,
        "nahlas_blokaci": nahlas_blokaci,
    }
