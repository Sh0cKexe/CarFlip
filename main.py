# -*- coding: utf-8 -*-
"""
CarFlip - hlavni program.

Co dela pri kazdem behu:
  1) Nacte filtry z config.json
  2) Pro kazdou znacku stahne NEJNOVEJSI inzeraty z Otomoto
  3) U novych (jeste nevidenych) aut odhadne cenu v CR z Bazose
  4) Spocita cisty zisk a kdyz je vyssi nez limit -> posle na Telegram

Spousti se opakovane (smycka) kazdych X minut podle config.json.
"""
import sys
import json
import time
import os

import otomoto
import bazos
import kurz
import preklad
import telegram_send as tg
import databaze

# Aby sla cestina do Windows konzole
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

CONFIG = os.path.join(os.path.dirname(__file__), "config.json")

# Vychozi minimalni pocet srovnatelnych CZ inzeratu (lze zmenit v nastaveni)
MIN_SROVNANI = 5


def nacti_config():
    with open(CONFIG, encoding="utf-8") as f:
        cfg = json.load(f)
    # Token: na serveru z "tajneho klice" (env), lokalne ze souboru token.txt.
    # Do config.json (a do repozitare) se token NEUKLADA - kvuli bezpecnosti.
    tok = os.environ.get("TELEGRAM_TOKEN")
    if not tok:
        tpath = os.path.join(os.path.dirname(CONFIG), "token.txt")
        if os.path.exists(tpath):
            with open(tpath, encoding="utf-8") as tf:
                tok = tf.read().strip()
    if tok:
        cfg.setdefault("telegram", {})["token"] = tok
    cid = os.environ.get("TELEGRAM_CHAT_ID")
    if cid:
        cfg.setdefault("telegram", {})["chat_id"] = cid
    return cfg


def _motor_text(auto):
    """Sestavi popis motoru: objem, verze, vykon v KM i kW."""
    levá = []
    if auto.get("objem_l"):
        levá.append("{} l".format(auto["objem_l"]))
    if auto.get("verze"):
        levá.append(auto["verze"])

    vykon = []
    if auto.get("vykon_km"):
        vykon.append("{} KM".format(auto["vykon_km"]))
    if auto.get("vykon_kw"):
        vykon.append("{} kW".format(auto["vykon_kw"]))

    casti = []
    if levá:
        casti.append(" ".join(levá))
    if vykon:
        casti.append(" / ".join(vykon))
    return " | ".join(casti) if casti else "motor neuveden"


def naformatuj_zpravu(auto, cena_czk, odhad, zisk, naklady):
    """Hlavni popisek k fotce."""
    radky = [
        "🚗 <b>{}</b>".format(auto["titulek"]),
        "💰 <b>Zisk: {:,} Kč</b>".format(zisk).replace(",", " "),
        "",
        "🇵🇱 Cena PL: {:,} PLN  (≈ {:,} Kč)".format(
            auto["cena_pln"], cena_czk).replace(",", " "),
        "🇨🇿 Odhad prodej CZ: {:,} Kč".format(odhad["median"]).replace(",", " "),
        "📦 Náklady dovoz: {:,} Kč".format(naklady).replace(",", " "),
        "",
        "📅 {} | {:,} km | {} | {}".format(
            auto.get("rok") or "?",
            auto.get("najezd_km") or 0,
            auto.get("palivo") or "?",
            auto.get("prevodovka") or "",
        ).replace(",", " "),
        "🔧 {}".format(_motor_text(auto)),
    ]
    if auto.get("mesto"):
        radky.append("📍 {}".format(auto["mesto"]))
    radky.append("")
    radky.append("🔗 <a href=\"{}\">Otevřít na Otomoto</a>".format(auto["url"]))
    return "\n".join(radky)


def naformatuj_detail(popis_cz, odhad):
    """Druha zprava: prelozeny popis + srovnatelne CZ inzeraty."""
    radky = []
    if popis_cz:
        radky.append("📝 <b>Popis (přeloženo z PL):</b>")
        radky.append(popis_cz[:3000])
        radky.append("")
    if odhad["ukazky"]:
        radky.append("🔎 <b>Srovnatelná auta na Bazoši ({} ks):</b>".format(
            odhad["pocet"]))
        for u in odhad["ukazky"]:
            rok = u.get("rok") or "?"
            najezd = "{:,} km".format(u["najezd"]).replace(",", " ") if u.get("najezd") else "? km"
            radky.append("• {} | {} | {:,} Kč – <a href=\"{}\">{}</a>".format(
                rok, najezd, u["cena"], u["url"], u["titulek"][:42]).replace(",", " "))
    return "\n".join(radky)


# Plynove palivo (nechceme)
PLYN = ("lpg", "cng")

# Fraze v polskem popisu, ktere znamenaji nepojizdne/poskozene auto -> nechceme
NEPOJIZDNE_FRAZE = (
    "uszkodzony silnik", "uszkodzona skrzyni", "uszkodzona skrzynia",
    "silnik do remontu", "skrzynia do remontu", "do remontu",
    "nie odpala", "nie pali", "niesprawny silnik", "niesprawna skrzyni",
    "niejezdn", "nie jezdzi", "bez silnika", "spalony silnik",
    "zatarty silnik", "uszkodzony motor", "do naprawy silnik",
)


def _prijemci(cfg):
    """Seznam vsech chat ID, kam se posila (ty + dalsi kamaradi)."""
    t = cfg.get("telegram", {})
    seznam = []
    if t.get("chat_id"):
        seznam.append(str(t["chat_id"]).strip())
    for c in t.get("dalsi_prijemci", []) or []:
        c = str(c).strip()
        if c and c not in seznam:
            seznam.append(c)
    return seznam


def _je_plyn(auto):
    """Pozna LPG/CNG z paliva auta."""
    s = ((auto.get("palivo_kod") or "") + " " + (auto.get("palivo") or "")).lower()
    return any(g in s for g in PLYN)


def _najezd_ok(auto, filtry):
    """Nafta a benzin maji vlastni limit najezdu. True kdyz auto vyhovuje."""
    naj = auto.get("najezd_km")
    if not naj:
        return True  # neznamy najezd -> nefiltrujeme
    palivo = (auto.get("palivo_kod") or "").lower()
    if "diesel" in palivo:
        limit = filtry.get("max_najezd_nafta") or filtry.get("max_najezd_km") or 250000
    else:
        limit = filtry.get("max_najezd_benzin") or filtry.get("max_najezd_km") or 200000
    return naj <= limit


def _problem_v_popisu(popis_pl):
    """True kdyz popis (polsky) napovida nepojizdne/poskozene nebo plyn."""
    t = (popis_pl or "").lower()
    if any(fr in t for fr in NEPOJIZDNE_FRAZE):
        return True
    if "lpg" in t or "instalacja gaz" in t:
        return True
    return False


def zpracuj_auto(auto, cfg, kurz_pln, uz_videno=databaze.uz_videno,
                  oznac_videno=databaze.oznac_videno):
    """Vyhodnoti jedno auto. Vraci True pokud bylo poslano upozorneni.
    Auto, ktere uz bylo videno, preskoci - aby upozorneni nechodilo dvakrat.
    uz_videno/oznac_videno jsou vymenitelne (sqlite lokalne, Supabase v cloudu),
    aby stejnou logiku sdilel legacy i multi-tenant cloud rezim."""
    if uz_videno(auto["id"]):
        return False
    oznac_videno(auto["id"])

    if not auto.get("cena_pln") or not auto.get("znacka"):
        return False

    # LPG/CNG nechceme - poznáme uz ze seznamu (setrime dotaz na Bazos)
    if _je_plyn(auto):
        return False

    # Najezd podle paliva (nafta 250k / benzin 200k - dle nastaveni)
    if not _najezd_ok(auto, cfg["filtry"]):
        return False

    min_srovnani = cfg.get("min_srovnani", MIN_SROVNANI)
    cena_czk = int(auto["cena_pln"] * kurz_pln)
    odhad = bazos.odhad_ceny(auto["znacka"], auto.get("model"),
                             rok=auto.get("rok"),
                             najezd_km=auto.get("najezd_km"),
                             cena_anchor_czk=cena_czk,
                             palivo=auto.get("palivo_kod"),
                             objem_l=auto.get("objem_l"),
                             min_pocet=min_srovnani)
    if not odhad["median"] or odhad["pocet"] < min_srovnani:
        return False  # malo dat = neduveryhodny odhad, radsi neposilame

    naklady = cfg["naklady_dovoz_kc"]
    zisk = odhad["median"] - cena_czk - naklady

    if zisk < cfg["min_zisk_kc"]:
        return False

    # Vypada to na flip -> stahneme detail a overime registraci a stav.
    info = otomoto.nacti_detail(auto["url"])
    if info["registrovano_pl"] is False:
        print("  - preskoceno (nemá polské značky):", auto["titulek"][:40])
        return False
    if info["poskozeno"]:
        print("  - preskoceno (poškozené auto):", auto["titulek"][:40])
        return False
    plny_popis = info["popis"] or auto.get("popis_kratky") or ""
    if _problem_v_popisu(plny_popis):
        print("  - preskoceno (nepojízdné/plyn dle popisu):", auto["titulek"][:40])
        return False

    # FLIP POTVRZEN!
    print("  >>> FLIP: {} | zisk {} Kc".format(auto["titulek"], zisk))
    token = cfg["telegram"]["token"]
    prijemci = _prijemci(cfg)

    popisek = naformatuj_zpravu(auto, cena_czk, odhad, zisk, naklady)
    popis_cz = preklad.prelozit(plny_popis)
    detail = naformatuj_detail(popis_cz, odhad)

    # Posleme vsem prijemcum (tobe i pripadnym kamaradum)
    for cid in prijemci:
        if auto.get("foto"):
            tg.posli_foto(token, cid, auto["foto"], popisek)
        else:
            tg.posli_zpravu(token, cid, popisek)
        if detail.strip():
            tg.posli_zpravu(token, cid, detail)
    return True


# Kolik stranek projet pri PRVNIM behu (cely trh). 1 stranka = 32 aut.
MAX_STRAN_PRVNI = 25


def jeden_beh(cfg, prvni_beh, uz_videno=databaze.uz_videno,
              oznac_videno=databaze.oznac_videno):
    kurz_pln = kurz.kurz_pln_czk()
    print("Kurz: 1 PLN =", round(kurz_pln, 3), "Kc")
    filtry = cfg["filtry"]
    znacky = filtry.get("znacky", [])
    # Okruhy (oblasti). Kdyz zadny neni, hledame v celem Polsku (None).
    okruhy = filtry.get("oblasti") or [None]
    # PRVNI beh = projedeme CELY trh (vsechny stranky), pak uz jen 32 nejnovejsich.
    max_stran = MAX_STRAN_PRVNI if prvni_beh else 1
    poslano = 0
    for znacka in znacky:
        for okruh in okruhy:
            kde = okruh.get("nazev", "?") + " " + str(okruh.get("okruh_km")) + "km" if okruh else "cele Polsko"
            print("Kontroluji:", znacka, "|", kde)
            auta = otomoto.nacti_inzeraty(znacka, filtry, max_stran=max_stran, okruh=okruh)
            print("  nalezeno {} inzeratu".format(len(auta)))
            for auto in auta:
                try:
                    if zpracuj_auto(auto, cfg, kurz_pln, uz_videno, oznac_videno):
                        poslano += 1
                except Exception as e:
                    print("  chyba u auta:", e)
            time.sleep(1)
    return poslano


def main():
    cfg = nacti_config()
    if not cfg["telegram"]["token"] or not cfg["telegram"]["chat_id"]:
        print("!!! Neni nastaveny Telegram token / chat_id.")
        print("    Spust Nastaveni (NASTAVENI.bat) a vypln je.")
        return

    # Prvni beh = databaze je prazdna -> projedeme CELY trh a posleme zisková auta.
    # Dalsi behy uz jen 32 nejnovejsich (nova auta), at nepretizime server.
    prvni_beh = _db_prazdna()
    if prvni_beh:
        print("=== PRVNI BEH: projedu CELY trh (vsechny stranky) a poslu zisková auta ===")
        print("    (muze chvili trvat; dalsi kontroly uz budou jen rychle - nova auta)")

    # Rezim pro SERVER: jeden beh a konec (smycku zaridi server kazdych 15 min).
    jednorazove = bool(os.environ.get("CARFLIP_ONCE")) or ("once" in sys.argv)
    if jednorazove:
        print("\n===== Jeden beh (rezim server) =====")
        poslano = jeden_beh(cfg, prvni_beh)
        print("Hotovo. Poslano upozorneni:", poslano)
        return

    # Rezim pro PC: nekonecna smycka s pauzou.
    while True:
        print("\n===== Kontrola spustena =====")
        try:
            poslano = jeden_beh(cfg, prvni_beh)
            print("Hotovo. Poslano upozorneni:", poslano)
        except Exception as e:
            print("Chyba behu:", e)
        prvni_beh = False
        cfg = nacti_config()  # nacte pripadne zmenene filtry
        interval = cfg.get("kontrola_minut", 15) * 60
        print("Cekam {} minut do dalsi kontroly...".format(interval // 60))
        time.sleep(interval)


def _db_prazdna():
    import sqlite3
    if not os.path.exists(databaze.DB):
        return True
    con = sqlite3.connect(databaze.DB)
    con.execute("CREATE TABLE IF NOT EXISTS videno (id TEXT PRIMARY KEY, kdy TEXT)")
    n = con.execute("SELECT COUNT(*) FROM videno").fetchone()[0]
    con.close()
    return n == 0


if __name__ == "__main__":
    main()
