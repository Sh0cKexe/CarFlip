# -*- coding: utf-8 -*-
"""Preklad textu mezi jazyky (zdarma, pres Google Translate)."""
from deep_translator import GoogleTranslator


def prelozit(text, source="pl", target="cs"):
    """Prelozi text mezi jazyky (vychozi PL->CS, pro import z Polska).
    Kdyz source == target, preklad nedava smysl - vrati text beze zmeny.
    Pri chybe prekladu vrati original."""
    if not text or not text.strip():
        return ""
    if source == target:
        return text
    try:
        # Google ma limit cca 5000 znaku na jeden pozadavek
        text = text[:4500]
        return GoogleTranslator(source=source, target=target).translate(text)
    except Exception as e:
        print("  [preklad] chyba prekladu:", e)
        return text


if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    print(prelozit("Auto bezwypadkowe, pierwszy wlasciciel, serwisowane w ASO."))
