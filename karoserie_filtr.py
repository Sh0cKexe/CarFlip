# -*- coding: utf-8 -*-
"""Sdilene mapovani vicenasobneho vyberu karoserie (kombi/sedan/hatchback/
suv/kupe/kabriolet/van) - pouziva otomoto.py/autoscout24.py/willhaben.py/
bazos.py, stejny princip jako palivo_filtr.py.

Prazdny vyber = bez filtru (vse), stejne jako u ostatnich filtru."""

KATEGORIE = ("kombi", "sedan", "hatchback", "suv", "kupe", "kabriolet", "van")


def normalizuj(filtry):
    """Vrati seznam vybranych kategorii. Zpetna kompatibilita: stary format
    byl jednovyberovy string ("vse" nebo jedna kategorie)."""
    k = filtry.get("karoserie")
    if isinstance(k, list):
        return [x for x in k if x in KATEGORIE]
    if k in KATEGORIE:
        return [k]
    return []
