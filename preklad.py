# -*- coding: utf-8 -*-
"""Preklad polskeho textu do cestiny (zdarma, pres Google Translate)."""
from deep_translator import GoogleTranslator


def prelozit(text):
    """Prelozi text z polstiny do cestiny. Pri chybe vrati original."""
    if not text or not text.strip():
        return ""
    try:
        # Google ma limit cca 5000 znaku na jeden pozadavek
        text = text[:4500]
        return GoogleTranslator(source="pl", target="cs").translate(text)
    except Exception as e:
        print("  [preklad] chyba prekladu:", e)
        return text


if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    print(prelozit("Auto bezwypadkowe, pierwszy wlasciciel, serwisowane w ASO."))
