# -*- coding: utf-8 -*-
"""Posilani zprav na Telegram pres Bota."""
import requests

API = "https://api.telegram.org/bot{token}/{metoda}"


def _post(token, metoda, data):
    url = API.format(token=token, metoda=metoda)
    try:
        r = requests.post(url, data=data, timeout=20)
        j = r.json()
        if not j.get("ok"):
            popis = j.get("description", "")
            if "initiate conversation" in popis or "can't initiate" in popis:
                print("  [telegram] Příjemce {} ještě nenapsal botovi – "
                      "musí bota otevřít a dát Start. (přeskočeno)".format(data.get("chat_id")))
            else:
                print("  [telegram] chyba:", popis)
        return j.get("ok", False)
    except Exception as e:
        print("  [telegram] chyba site:", e)
        return False


def posli_zpravu(token, chat_id, text):
    """Posle textovou zpravu (HTML formatovani)."""
    return _post(token, "sendMessage", {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": "false",
    })


def posli_foto(token, chat_id, foto_url, popisek):
    """Posle fotku s popiskem. Pri chybe spadne zpet na textovou zpravu."""
    ok = _post(token, "sendPhoto", {
        "chat_id": chat_id,
        "photo": foto_url,
        "caption": popisek,
        "parse_mode": "HTML",
    })
    if not ok:
        # fotka muze selhat (velikost/format) - posleme aspon text
        return posli_zpravu(token, chat_id, popisek)
    return ok


def posli_test(token, chat_id):
    """Posle testovaci zpravu. Vrati (ok, popis_chyby)."""
    url = API.format(token=token, metoda="sendMessage")
    try:
        r = requests.post(url, data={
            "chat_id": chat_id,
            "text": "✅ <b>CarFlip</b> – test spojení funguje!",
            "parse_mode": "HTML",
        }, timeout=20)
        j = r.json()
        return j.get("ok", False), j.get("description", "")
    except Exception as e:
        return False, str(e)


def over_pripojeni(token):
    """Overi, ze token funguje. Vrati jmeno bota nebo None."""
    url = API.format(token=token, metoda="getMe")
    try:
        j = requests.get(url, timeout=15).json()
        if j.get("ok"):
            return j["result"].get("username")
    except Exception:
        pass
    return None


if __name__ == "__main__":
    # Rychly test - vyplnit token a chat_id
    import json, os
    cfg = os.path.join(os.path.dirname(__file__), "config.json")
    with open(cfg, encoding="utf-8") as f:
        c = json.load(f)
    tok = c["telegram"]["token"]
    cid = c["telegram"]["chat_id"]
    if not tok:
        print("Nejprve vypln token v config.json (nebo pres Nastaveni).")
    else:
        print("Bot:", over_pripojeni(tok))
        posli_zpravu(tok, cid, "✅ <b>CarFlip</b> test funguje!")
