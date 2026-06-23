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
import autoscout24
import willhaben
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

# Texty zpravy podle cilového trhu (cz = bazos.cz/Kc, sk = bazos.sk/EUR).
# Nejsou lingvisticky dokonale, jde o funkcni preklad - lze doladit pozdeji.
TEXTY = {
    "cz": {
        "odhad_prodej": "Odhad prodej CZ",
        "naklady_dovoz": "Náklady dovoz",
        "popis_prelozeno": "Popis (přeloženo z PL)",
        "srovnatelna_auta": "Srovnatelná auta na Bazoši",
        "otevrit": "Otevřít na Otomoto",
        "otevrit_inzerat": "Otevřít inzerát",
        "mena": "Kč",
    },
    "sk": {
        "odhad_prodej": "Odhad predaja SK",
        "naklady_dovoz": "Náklady na dovoz",
        "popis_prelozeno": "Popis (preložené z PL)",
        "srovnatelna_auta": "Porovnateľné autá na Bazoši",
        "otevrit": "Otvoriť na Otomoto",
        "otevrit_inzerat": "Otvoriť inzerát",
        "mena": "€",
    },
}


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


def naformatuj_zpravu(auto, cena_mistni, odhad, zisk, naklady, trh="cz"):
    """Hlavni popisek k fotce."""
    t = TEXTY.get(trh, TEXTY["cz"])
    mena = t["mena"]
    vlajka = "🇸🇰" if trh == "sk" else "🇨🇿"
    radky = [
        "🚗 <b>{}</b>".format(auto["titulek"]),
        "💰 <b>Zisk: {:,} {}</b>".format(zisk, mena).replace(",", " "),
        "",
        "🇵🇱 Cena PL: {:,} PLN  (≈ {:,} {})".format(
            auto["cena_pln"], cena_mistni, mena).replace(",", " "),
        "{} {}: {:,} {}".format(vlajka, t["odhad_prodej"], odhad["median"], mena).replace(",", " "),
        "📦 {}: {:,} {}".format(t["naklady_dovoz"], naklady, mena).replace(",", " "),
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
    radky.append("🔗 <a href=\"{}\">{}</a>".format(auto["url"], t["otevrit"]))
    return "\n".join(radky)


def naformatuj_detail(popis_cz, odhad, trh="cz"):
    """Druha zprava: prelozeny popis + srovnatelne inzeraty."""
    t = TEXTY.get(trh, TEXTY["cz"])
    mena = t["mena"]
    radky = []
    if popis_cz:
        radky.append("📝 <b>{}:</b>".format(t["popis_prelozeno"]))
        radky.append(popis_cz[:3000])
        radky.append("")
    if odhad["ukazky"]:
        radky.append("🔎 <b>{} ({} ks):</b>".format(t["srovnatelna_auta"], odhad["pocet"]))
        for u in odhad["ukazky"]:
            rok = u.get("rok") or "?"
            najezd = "{:,} km".format(u["najezd"]).replace(",", " ") if u.get("najezd") else "? km"
            radky.append("• {} | {} | {:,} {} – <a href=\"{}\">{}</a>".format(
                rok, najezd, u["cena"], mena, u["url"], u["titulek"][:42]).replace(",", " "))
    return "\n".join(radky)


# Zahranicni zdroje primo v EUR (na rozdil od PL/Otomoto) - import flow,
# stejny princip jako Polsko (hledat tam, porovnat s domovskym trhem).
ZAHRANICNI_MODULY = {
    "de": autoscout24,
    "it": autoscout24,
    "at": willhaben,
}
ZAHRANICNI_INFO = {
    "de": {"vlajka": "🇩🇪", "nazev": "Německo", "jazyk_popis": "de", "platforma": "AutoScout24"},
    "it": {"vlajka": "🇮🇹", "nazev": "Itálie", "jazyk_popis": "it", "platforma": "AutoScout24"},
    "at": {"vlajka": "🇦🇹", "nazev": "Rakousko", "jazyk_popis": "de", "platforma": "Willhaben"},
}


def _kurz_zahranicni_eur(domovsky_trh):
    """Kolik domovske meny stoji 1 EUR. SK uz je v EUR (1:1), CZ primo z CNB."""
    return 1.0 if domovsky_trh == "sk" else kurz.kurz_eur_czk()


def naformatuj_zpravu_zahranicni(auto, cena_mistni, odhad, zisk, naklady, zdroj_trh, domovsky_trh):
    """Hlavni popisek pro auto ze zahranicniho EUR zdroje (Nemecko atd.) -
    stejna struktura jako naformatuj_zpravu (Otomoto/PL), jen jina mena
    zdroje (EUR vzdy) a bez prevodu kdyz domovsky trh uz je v EUR (SK)."""
    t = TEXTY.get(domovsky_trh, TEXTY["cz"])
    mena = t["mena"]
    info = ZAHRANICNI_INFO[zdroj_trh]
    vlajka_domov = "🇸🇰" if domovsky_trh == "sk" else "🇨🇿"

    if domovsky_trh == "sk":
        cena_radek = "{} Cena {}: {:,} EUR".format(
            info["vlajka"], info["nazev"], auto["cena"]).replace(",", " ")
    else:
        cena_radek = "{} Cena {}: {:,} EUR  (≈ {:,} {})".format(
            info["vlajka"], info["nazev"], auto["cena"], cena_mistni, mena).replace(",", " ")

    radky = [
        "🚗 <b>{}</b>".format(auto["titulek"]),
        "💰 <b>Zisk: {:,} {}</b>".format(zisk, mena).replace(",", " "),
        "",
        cena_radek,
        "{} {}: {:,} {}".format(vlajka_domov, t["odhad_prodej"], odhad["median"], mena).replace(",", " "),
        "📦 {}: {:,} {}".format(t["naklady_dovoz"], naklady, mena).replace(",", " "),
        "",
        "📅 {} | {:,} km | {} | {}".format(
            auto.get("rok") or "?",
            auto.get("najezd_km") or 0,
            auto.get("palivo") or "?",
            auto.get("prevodovka") or "",
        ).replace(",", " "),
    ]
    if auto.get("vykon_kw"):
        radky.append("🔧 {} kW".format(auto["vykon_kw"]))
    if auto.get("mesto"):
        radky.append("📍 {}".format(auto["mesto"]))
    radky.append("")
    radky.append("🔗 <a href=\"{}\">Otevřít na {}</a>".format(auto["url"], info["platforma"]))
    return "\n".join(radky)


def naformatuj_detail_zahranicni(popis_prelozeny, odhad, domovsky_trh):
    """Druha zprava: prelozeny popis + srovnatelne inzeraty - stejne jako
    naformatuj_detail (Otomoto/PL)."""
    t = TEXTY.get(domovsky_trh, TEXTY["cz"])
    mena = t["mena"]
    radky = []
    if popis_prelozeny:
        radky.append("📝 <b>Popis (přeloženo):</b>")
        radky.append(popis_prelozeny[:3000])
        radky.append("")
    if odhad["ukazky"]:
        radky.append("🔎 <b>{} ({} ks):</b>".format(t["srovnatelna_auta"], odhad["pocet"]))
        for u in odhad["ukazky"]:
            rok = u.get("rok") or "?"
            najezd = "{:,} km".format(u["najezd"]).replace(",", " ") if u.get("najezd") else "? km"
            radky.append("• {} | {} | {:,} {} – <a href=\"{}\">{}</a>".format(
                rok, najezd, u["cena"], mena, u["url"], u["titulek"][:42]).replace(",", " "))
    return "\n".join(radky)


def naformatuj_zpravu_domaci(nalez, zdroj_trh, domovsky_trh):
    """Zprava pro nalez PRIMO na Bazosi (zdroj_trh) - porovnano proti
    DOMOVSKEMU trhu uzivatele (domovsky_trh), stejny princip jako import
    z Polska. Kdyz zdroj_trh == domovsky_trh, cena je jen jednou (zadny
    prevod nedava smysl); jinak se ukaze cena ve zdrojove mene + prevod."""
    t_domov = TEXTY.get(domovsky_trh, TEXTY["cz"])
    mena_domov = t_domov["mena"]
    mena_zdroj = TEXTY.get(zdroj_trh, TEXTY["cz"])["mena"]
    vlajka_zdroj = "🇸🇰" if zdroj_trh == "sk" else "🇨🇿"
    vlajka_domov = "🇸🇰" if domovsky_trh == "sk" else "🇨🇿"
    najezd = "{:,} km".format(nalez["najezd"]).replace(",", " ") if nalez.get("najezd") else "? km"

    if zdroj_trh == domovsky_trh:
        cena_radek = "💵 Cena: {:,} {}".format(nalez["cena"], mena_domov).replace(",", " ")
    else:
        cena_radek = "{} Cena {}: {:,} {}  (≈ {:,} {})".format(
            vlajka_zdroj, zdroj_trh.upper(), nalez["cena"], mena_zdroj,
            int(round(nalez["cena_domovska"])), mena_domov
        ).replace(",", " ")

    radky = [
        "🔎 <b>{}</b>".format(nalez["titulek"]),
        "💰 <b>Zisk: {:,} {}</b>".format(int(round(nalez["zisk"])), mena_domov).replace(",", " "),
        "",
        cena_radek,
        "{} {}: {:,} {}".format(vlajka_domov, t_domov["odhad_prodej"], nalez["median_trh"], mena_domov).replace(",", " "),
        "📦 {}: {:,} {}".format(t_domov["naklady_dovoz"], int(round(nalez["naklady"])), mena_domov).replace(",", " "),
        "",
        "📅 {} | {} | {}".format(
            nalez.get("rok") or "?", najezd, nalez.get("palivo") or nalez.get("prevodovka") or "?"
        ).replace(",", " "),
    ]
    if nalez.get("vykon_kw"):
        radky.append("🔧 {} kW".format(nalez["vykon_kw"]))
    if nalez.get("lokalita"):
        radky.append("📍 {}".format(nalez["lokalita"]))
    radky.append("")
    radky.append("🔗 <a href=\"{}\">{} (Bazoš.{})</a>".format(
        nalez["url"], t_domov["otevrit_inzerat"], zdroj_trh))
    return "\n".join(radky)


def naformatuj_detail_domaci(nalez, zdroj_trh, domovsky_trh):
    """Druha zprava pro domaci nalez: cely popis z inzeratu (PRELOZENY,
    kdyz zdroj a domov mluvi jinou rec - cz<->sk) + srovnatelne inzeraty
    na domovskem trhu (stejny ucel jako naformatuj_detail u PL importu)."""
    t = TEXTY.get(domovsky_trh, TEXTY["cz"])
    mena = t["mena"]
    radky = []
    if nalez.get("popis"):
        jazyk = {"cz": "cs", "sk": "sk"}
        popis = preklad.prelozit(nalez["popis"], source=jazyk.get(zdroj_trh, "cs"),
                                  target=jazyk.get(domovsky_trh, "cs"))
        radky.append("📝 <b>Popis z inzerátu:</b>")
        radky.append(popis[:3000])
        radky.append("")
    if nalez.get("ukazky"):
        radky.append("🔎 <b>{} ({} ks):</b>".format(t["srovnatelna_auta"], nalez["pocet_srovnani"]))
        for u in nalez["ukazky"]:
            rok = u.get("rok") or "?"
            najezd = "{:,} km".format(u["najezd"]).replace(",", " ") if u.get("najezd") else "? km"
            radky.append("• {} | {} | {:,} {} – <a href=\"{}\">{}</a>".format(
                rok, najezd, u["cena"], mena, u["url"], u["titulek"][:42]).replace(",", " "))
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

    trh = cfg.get("trh", "cz")
    min_srovnani = cfg.get("min_srovnani", MIN_SROVNANI)
    cena_mistni = int(auto["cena_pln"] * kurz_pln)
    odhad = bazos.odhad_ceny(auto["znacka"], auto.get("model"),
                             rok=auto.get("rok"),
                             najezd_km=auto.get("najezd_km"),
                             cena_anchor_czk=cena_mistni,
                             palivo=auto.get("palivo_kod"),
                             objem_l=auto.get("objem_l"),
                             min_pocet=min_srovnani,
                             trh=trh)
    if not odhad["median"] or odhad["pocet"] < min_srovnani:
        return False  # malo dat = neduveryhodny odhad, radsi neposilame

    naklady = cfg["naklady_dovoz_kc"]
    zisk = odhad["median"] - cena_mistni - naklady

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

    popisek = naformatuj_zpravu(auto, cena_mistni, odhad, zisk, naklady, trh=trh)
    popis_cz = preklad.prelozit(plny_popis)
    detail = naformatuj_detail(popis_cz, odhad, trh=trh)

    # Posleme vsem prijemcum (tobe i pripadnym kamaradum)
    for cid in prijemci:
        if auto.get("foto"):
            tg.posli_foto(token, cid, auto["foto"], popisek)
        else:
            tg.posli_zpravu(token, cid, popisek)
        if detail.strip():
            tg.posli_zpravu(token, cid, detail)
    return True


def zpracuj_auto_zahranicni(auto, cfg, zdroj_trh, uz_videno=databaze.uz_videno,
                             oznac_videno=databaze.oznac_videno):
    """Vyhodnoti jedno auto ze zahranicniho EUR zdroje (Nemecko atd.) -
    stejny princip jako Otomoto/Polsko: porovnat odhad s domovskym trhem,
    poslat pri zisku. AutoScout24 uz pri vyhledavani vyfiltroval havarovana
    auta (damaged_listing=exclude); detail jeste overi hadAccident."""
    if uz_videno(auto["id"]):
        return False
    oznac_videno(auto["id"])

    if not auto.get("cena") or not auto.get("znacka"):
        return False

    if _je_plyn(auto):
        return False

    if not _najezd_ok(auto, cfg["filtry"]):
        return False

    trh = cfg.get("trh", "cz")
    min_srovnani = cfg.get("min_srovnani", MIN_SROVNANI)
    cena_mistni = int(round(auto["cena"] * _kurz_zahranicni_eur(trh)))
    odhad = bazos.odhad_ceny(auto["znacka"], auto.get("model"),
                             rok=auto.get("rok"),
                             najezd_km=auto.get("najezd_km"),
                             cena_anchor_czk=cena_mistni,
                             palivo=auto.get("palivo_kod"),
                             objem_l=auto.get("objem_l"),
                             min_pocet=min_srovnani,
                             trh=trh)
    if not odhad["median"] or odhad["pocet"] < min_srovnani:
        return False

    naklady = cfg["naklady_dovoz_kc"]
    zisk = odhad["median"] - cena_mistni - naklady
    if zisk < cfg["min_zisk_kc"]:
        return False

    modul = ZAHRANICNI_MODULY[zdroj_trh]
    info = ZAHRANICNI_INFO[zdroj_trh]
    detail = modul.nacti_detail(auto["url"])
    if detail["poskozeno"]:
        print("  - preskoceno (havarovane/poskozene):", auto["titulek"][:40])
        return False

    print("  >>> FLIP ({}): {} | zisk {} Kc".format(info["nazev"], auto["titulek"], zisk))
    token = cfg["telegram"]["token"]
    prijemci = _prijemci(cfg)

    popisek = naformatuj_zpravu_zahranicni(auto, cena_mistni, odhad, zisk, naklady, zdroj_trh, trh)
    cilovy_jazyk = {"cz": "cs", "sk": "sk"}.get(trh, "cs")
    popis_prelozeny = preklad.prelozit(detail["popis"], source=info["jazyk_popis"], target=cilovy_jazyk)
    detail_zprava = naformatuj_detail_zahranicni(popis_prelozeny, odhad, trh)

    for cid in prijemci:
        if auto.get("foto"):
            tg.posli_foto(token, cid, auto["foto"], popisek)
        else:
            tg.posli_zpravu(token, cid, popisek)
        if detail_zprava.strip():
            tg.posli_zpravu(token, cid, detail_zprava)
    return True


def zpracuj_auto_domaci(nalez, cfg, zdroj_trh, uz_videno=databaze.uz_videno,
                         oznac_videno=databaze.oznac_videno):
    """Vyhodnoti jeden nalez primo z Bazose (zdroj_trh = odkud inzerat je) -
    bazos.najdi_podhodnocene uz spocitala zisk/median PROTI DOMOVSKEMU
    trhu uzivatele (cfg['trh']), tady jen dedup a odeslani. ad_id je
    prefixovany 'bazos_{zdroj_trh}_', aby nekolidoval s Otomoto cisly id
    ve stejne videno databazi."""
    ad_id = "bazos_{}_{}".format(zdroj_trh, nalez["url"])
    if uz_videno(ad_id):
        return False
    oznac_videno(ad_id)

    domovsky_trh = cfg.get("trh", "cz")
    print("  >>> NALEZ (Bazos {} -> domov {}): {} | zisk {}".format(
        zdroj_trh.upper(), domovsky_trh.upper(), nalez["titulek"], nalez["zisk"]))
    token = cfg["telegram"]["token"]
    prijemci = _prijemci(cfg)
    popisek = naformatuj_zpravu_domaci(nalez, zdroj_trh, domovsky_trh)
    detail = naformatuj_detail_domaci(nalez, zdroj_trh, domovsky_trh)
    for cid in prijemci:
        if nalez.get("foto"):
            tg.posli_foto(token, cid, nalez["foto"], popisek)
        else:
            tg.posli_zpravu(token, cid, popisek)
        if detail.strip():
            tg.posli_zpravu(token, cid, detail)
    return True


# Kolik stranek projet pri PRVNIM behu (cely trh). 1 stranka = 32 aut.
MAX_STRAN_PRVNI = 25


def jeden_beh(cfg, prvni_beh, uz_videno=databaze.uz_videno,
              oznac_videno=databaze.oznac_videno):
    trh = cfg.get("trh", "cz")
    kurz_pln = kurz.kurz_pln_eur() if trh == "sk" else kurz.kurz_pln_czk()
    print("Kurz: 1 PLN =", round(kurz_pln, 4), TEXTY.get(trh, TEXTY["cz"])["mena"])
    filtry = cfg["filtry"]
    znacky = filtry.get("znacky", [])
    # Zdrojove trhy: "pl" (Otomoto, import) + volitelne "cz"/"sk" (Bazos
    # primo jako zdroj, srovnani uvnitr stejneho trhu). Vychozi ["pl"]
    # zachovava puvodni chovani pro vsechny existujici uzivatele.
    zdroje = filtry.get("zdroje") or ["pl"]
    # Okruhy (oblasti) - kazda nese "zeme" (pl/cz/sk); stare zaznamy bez
    # "zeme" se beru jako "pl" (zpetna kompatibilita).
    vsechny_okruhy = filtry.get("oblasti") or []
    # PRVNI beh = projedeme CELY trh (vsechny stranky), pak uz jen nejnovejsi.
    max_stran = MAX_STRAN_PRVNI if prvni_beh else 1
    poslano = 0

    if "pl" in zdroje:
        okruhy_pl = [o for o in vsechny_okruhy if o.get("zeme", "pl") == "pl"] or [None]
        for znacka in znacky:
            for okruh in okruhy_pl:
                kde = okruh.get("nazev", "?") + " " + str(okruh.get("okruh_km")) + "km" if okruh else "cele Polsko"
                print("Kontroluji (PL):", znacka, "|", kde)
                auta = otomoto.nacti_inzeraty(znacka, filtry, max_stran=max_stran, okruh=okruh)
                print("  nalezeno {} inzeratu".format(len(auta)))
                for auto in auta:
                    try:
                        if zpracuj_auto(auto, cfg, kurz_pln, uz_videno, oznac_videno):
                            poslano += 1
                    except Exception as e:
                        print("  chyba u auta:", e)
                time.sleep(1)

    for zahranicni_trh, modul in ZAHRANICNI_MODULY.items():
        if zahranicni_trh not in zdroje:
            continue
        okruhy_zahr = [o for o in vsechny_okruhy if o.get("zeme") == zahranicni_trh] or [None]
        for znacka in znacky:
            for okruh in okruhy_zahr:
                kde = okruh.get("nazev", "?") + " " + str(okruh.get("okruh_km")) + "km" if okruh else "cela zeme"
                print("Kontroluji ({}):".format(zahranicni_trh.upper()), znacka, "|", kde)
                auta = modul.nacti_inzeraty(znacka, filtry, max_stran=max_stran, okruh=okruh, zeme=zahranicni_trh)
                print("  nalezeno {} inzeratu".format(len(auta)))
                for auto in auta:
                    try:
                        if zpracuj_auto_zahranicni(auto, cfg, zahranicni_trh, uz_videno, oznac_videno):
                            poslano += 1
                    except Exception as e:
                        print("  chyba u auta:", e)
                time.sleep(1)

    for domaci_trh in ("cz", "sk"):
        if domaci_trh not in zdroje:
            continue
        okruhy_dom = [o for o in vsechny_okruhy if o.get("zeme") == domaci_trh] or [None]
        min_srovnani = cfg.get("min_srovnani", MIN_SROVNANI)
        for znacka in znacky:
            for okruh in okruhy_dom:
                kde = okruh.get("nazev", "?") if okruh else "cely trh {}".format(domaci_trh.upper())
                print("Kontroluji (Bazos {}):".format(domaci_trh.upper()), znacka, "|", kde)
                try:
                    nalezy = bazos.najdi_podhodnocene(
                        znacka, filtry, zdroj_trh=domaci_trh, domovsky_trh=trh,
                        min_zisk_kc=cfg["min_zisk_kc"],
                        naklady_dovoz_kc=cfg["naklady_dovoz_kc"],
                        min_srovnani=min_srovnani,
                        lokalita=okruh.get("mesto_slug") if okruh else None,
                        okruh_km=okruh.get("okruh_km") if okruh else None,
                        max_stran=3 if prvni_beh else 2,
                    )
                except Exception as e:
                    print("  chyba pri hledani na Bazosi:", e)
                    nalezy = []
                print("  nalezeno {} podhodnocenych".format(len(nalezy)))
                for nalez in nalezy:
                    try:
                        if zpracuj_auto_domaci(nalez, cfg, domaci_trh, uz_videno, oznac_videno):
                            poslano += 1
                    except Exception as e:
                        print("  chyba u nalezu:", e)
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
