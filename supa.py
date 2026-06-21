# -*- coding: utf-8 -*-
"""Supabase pristup pro cloud multi-tenant rezim (nahrazuje config.json + databaze.py
pro kazdeho uzivatele webu). Pouziva service key - cte/zapisuje za VSECHNY uzivatele,
proto se tento klic nikdy nesmi dostat do web frontendu, jen do GitHub Actions secret."""
import os

from supabase import create_client


def klient():
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_KEY"]
    return create_client(url, key)


def nacti_uzivatele(sb):
    """Vrati seznam aktivnich uzivatelu s nastavenim ve tvaru cfg z config.json."""
    radky = sb.table("nastaveni").select("*").eq("aktivni", True).execute().data
    uzivatele = []
    for r in radky:
        if not r.get("telegram_token") or not r.get("telegram_chat_id"):
            continue  # bot bez tokenu/chat_id nema kam posilat
        cfg = {
            "telegram": {
                "token": r["telegram_token"],
                "chat_id": r["telegram_chat_id"],
                "dalsi_prijemci": r.get("dalsi_prijemci") or [],
            },
            "min_zisk_kc": r["min_zisk_kc"],
            "naklady_dovoz_kc": r["naklady_dovoz_kc"],
            "min_srovnani": r["min_srovnani"],
            "filtry": r["filtry"],
            "trh": r.get("trh") or "cz",
        }
        uzivatele.append({"user_id": r["user_id"], "cfg": cfg})
    return uzivatele


def ma_videno_zaznam(sb, user_id):
    """True kdyz uzivatel uz ma alespon jedno auto v 'videno' (tedy uz nema bezet
    prvni-beh rezim, ktery projede cely trh)."""
    res = (sb.table("videno").select("ad_id")
           .eq("user_id", user_id).limit(1).execute())
    return len(res.data) > 0


def uz_videno(sb, user_id, ad_id):
    res = (sb.table("videno").select("ad_id")
           .eq("user_id", user_id).eq("ad_id", str(ad_id)).execute())
    return len(res.data) > 0


def oznac_videno(sb, user_id, ad_id):
    sb.table("videno").upsert({"user_id": user_id, "ad_id": str(ad_id)}).execute()
