# -*- coding: utf-8 -*-
"""
Okno s nastavenim CarFlip.

Tady klikanim nastavis filtry, znacky, palivo, limity a Telegram.
Vse se ulozi do config.json - nemusis nic psat rucne.
"""
import os
import json
import tkinter as tk
from tkinter import ttk, messagebox

import telegram_send as tg
import mapa

CONFIG = os.path.join(os.path.dirname(__file__), "config.json")
TOKEN_FILE = os.path.join(os.path.dirname(__file__), "token.txt")


def nacti_token():
    """Token se drzi mimo config.json (v token.txt), at neni v repozitari."""
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, encoding="utf-8") as f:
            return f.read().strip()
    return ""


def uloz_token(tok):
    with open(TOKEN_FILE, "w", encoding="utf-8") as f:
        f.write(tok.strip())

# Dostupne znacky: zobrazeny nazev -> slug pro Otomoto
ZNACKY = [
    ("VW", "volkswagen"), ("Audi", "audi"), ("Škoda", "skoda"),
    ("Seat", "seat"), ("BMW", "bmw"), ("Mercedes", "mercedes-benz"),
    ("Porsche", "porsche"), ("Opel", "opel"),
    ("Renault", "renault"), ("Peugeot", "peugeot"), ("Citroën", "citroen"),
    ("DS", "ds-automobiles"),
    ("Ford", "ford"), ("Toyota", "toyota"), ("Hyundai", "hyundai"),
    ("Kia", "kia"), ("Volvo", "volvo"), ("Mazda", "mazda"),
    ("Nissan", "nissan"), ("Fiat", "fiat"),
]

NEMECKE = {"volkswagen", "audi", "skoda", "seat", "bmw",
           "mercedes-benz", "porsche", "opel"}
FRANCOUZSKE = {"renault", "peugeot", "citroen", "ds-automobiles"}


def nacti():
    with open(CONFIG, encoding="utf-8") as f:
        return json.load(f)


def uloz(cfg):
    with open(CONFIG, "w", encoding="utf-8") as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)


class App:
    def __init__(self, root):
        self.root = root
        self.cfg = nacti()
        root.title("CarFlip – Nastavení")
        root.geometry("520x720")

        self.znacka_vars = {}
        self._build()

    def _build(self):
        pad = {"padx": 10, "pady": 4}
        r = 0

        tk.Label(self.root, text="CarFlip – Nastavení",
                 font=("Segoe UI", 16, "bold")).grid(row=r, column=0, columnspan=3, **pad)
        r += 1

        # --- Telegram ---
        tk.Label(self.root, text="Telegram (kam chodí upozornění)",
                 font=("Segoe UI", 11, "bold")).grid(row=r, column=0, columnspan=3, sticky="w", **pad)
        r += 1
        tk.Label(self.root, text="Token bota:").grid(row=r, column=0, sticky="w", **pad)
        self.e_token = tk.Entry(self.root, width=40)
        self.e_token.insert(0, nacti_token() or self.cfg["telegram"].get("token", ""))
        self.e_token.grid(row=r, column=1, columnspan=2, sticky="w", **pad)
        r += 1
        tk.Label(self.root, text="Chat ID:").grid(row=r, column=0, sticky="w", **pad)
        self.e_chat = tk.Entry(self.root, width=40)
        self.e_chat.insert(0, str(self.cfg["telegram"].get("chat_id", "")))
        self.e_chat.grid(row=r, column=1, columnspan=2, sticky="w", **pad)
        r += 1
        tk.Label(self.root, text="Chat ID kamarádů:").grid(row=r, column=0, sticky="w", **pad)
        self.e_kamaradi = tk.Entry(self.root, width=40)
        self.e_kamaradi.insert(0, ", ".join(
            str(c) for c in self.cfg["telegram"].get("dalsi_prijemci", [])))
        self.e_kamaradi.grid(row=r, column=1, columnspan=2, sticky="w", **pad)
        r += 1
        tk.Label(self.root, text="(více oddělíš čárkou; kamarád zjistí své Id přes @userinfobot)",
                 fg="#666", font=("Segoe UI", 8)).grid(row=r, column=1, columnspan=2, sticky="w", padx=10)
        r += 1
        tk.Button(self.root, text="🔔 Otestovat Telegram",
                  command=self.test_telegram).grid(row=r, column=1, sticky="w", **pad)
        r += 1

        ttk.Separator(self.root, orient="horizontal").grid(
            row=r, column=0, columnspan=3, sticky="ew", pady=8)
        r += 1

        # --- Znacky ---
        tk.Label(self.root, text="Značky aut",
                 font=("Segoe UI", 11, "bold")).grid(row=r, column=0, columnspan=3, sticky="w", **pad)
        r += 1
        btns = tk.Frame(self.root)
        btns.grid(row=r, column=0, columnspan=3, sticky="w", padx=10)
        tk.Button(btns, text="🇩🇪 Německé koncerny", command=self.vyber_nemecke).pack(side="left", padx=3)
        tk.Button(btns, text="🇫🇷 Francouzské", command=self.vyber_francouzske).pack(side="left", padx=3)
        tk.Button(btns, text="Vše", command=lambda: self.vyber_vse(True)).pack(side="left", padx=3)
        tk.Button(btns, text="Nic", command=lambda: self.vyber_vse(False)).pack(side="left", padx=3)
        r += 1

        zfr = tk.Frame(self.root)
        zfr.grid(row=r, column=0, columnspan=3, sticky="w", padx=10)
        aktivni = set(self.cfg["filtry"].get("znacky", []))
        for i, (jmeno, slug) in enumerate(ZNACKY):
            var = tk.BooleanVar(value=(slug in aktivni))
            self.znacka_vars[slug] = var
            tk.Checkbutton(zfr, text=jmeno, variable=var).grid(
                row=i // 4, column=i % 4, sticky="w", padx=4)
        r += 1

        ttk.Separator(self.root, orient="horizontal").grid(
            row=r, column=0, columnspan=3, sticky="ew", pady=8)
        r += 1

        # --- Palivo ---
        tk.Label(self.root, text="Palivo",
                 font=("Segoe UI", 11, "bold")).grid(row=r, column=0, sticky="w", **pad)
        self.palivo_var = tk.StringVar(value=self.cfg["filtry"].get("palivo", "vse"))
        pf = tk.Frame(self.root)
        pf.grid(row=r, column=1, columnspan=2, sticky="w", **pad)
        for txt, val in [("Vše", "vse"), ("Nafta", "nafta"), ("Benzín", "benzin")]:
            tk.Radiobutton(pf, text=txt, variable=self.palivo_var, value=val).pack(side="left")
        r += 1

        # --- Prevodovka ---
        tk.Label(self.root, text="Převodovka",
                 font=("Segoe UI", 11, "bold")).grid(row=r, column=0, sticky="w", **pad)
        self.prevodovka_var = tk.StringVar(value=self.cfg["filtry"].get("prevodovka", "vse"))
        pf2 = tk.Frame(self.root)
        pf2.grid(row=r, column=1, columnspan=2, sticky="w", **pad)
        for txt, val in [("Vše", "vse"), ("Automat", "automat"), ("Manuál", "manual")]:
            tk.Radiobutton(pf2, text=txt, variable=self.prevodovka_var, value=val).pack(side="left")
        r += 1

        # --- Oblasti (okruhy) na mape ---
        self.oblasti = [dict(o) for o in self.cfg["filtry"].get("oblasti", [])]
        tk.Label(self.root, text="Oblast (Polsko):").grid(row=r, column=0, sticky="w", padx=10, pady=4)
        tk.Button(self.root, text="🗺️ Vybrat oblasti na mapě",
                  command=self.otevri_mapu).grid(row=r, column=1, sticky="w", padx=10, pady=4)
        self.oblasti_label = tk.Label(self.root, text="", fg="#1565c0", font=("Segoe UI", 9))
        self.oblasti_label.grid(row=r, column=2, sticky="w", padx=4)
        self._aktualizuj_oblasti_label()
        r += 1

        # --- Cisla ---
        self.e_rok = self._cislo_radek(r, "Rok výroby od:", self.cfg["filtry"].get("min_rok", 2010)); r += 1
        stary = self.cfg["filtry"].get("max_najezd_km")  # zpetna kompatibilita
        self.e_najezd_nafta = self._cislo_radek(r, "Max nájezd – nafta (km):",
            self.cfg["filtry"].get("max_najezd_nafta", stary or 250000)); r += 1
        self.e_najezd_benzin = self._cislo_radek(r, "Max nájezd – benzín (km):",
            self.cfg["filtry"].get("max_najezd_benzin", stary or 200000)); r += 1
        self.e_cena_do = self._cislo_radek(r, "Max cena PL (PLN):", self.cfg["filtry"].get("max_cena_pln", 120000)); r += 1
        self.e_cena_od = self._cislo_radek(r, "Min cena PL (PLN):", self.cfg["filtry"].get("min_cena_pln", 10000)); r += 1

        ttk.Separator(self.root, orient="horizontal").grid(
            row=r, column=0, columnspan=3, sticky="ew", pady=8)
        r += 1
        self.e_zisk = self._cislo_radek(r, "Min. zisk pro upozornění (Kč):", self.cfg.get("min_zisk_kc", 20000)); r += 1
        self.e_naklady = self._cislo_radek(r, "Náklady na dovoz (Kč):", self.cfg.get("naklady_dovoz_kc", 10000)); r += 1
        self.e_srovnani = self._cislo_radek(r, "Min. srovnatelných aut v ČR:", self.cfg.get("min_srovnani", 5)); r += 1
        self.e_minuty = self._cislo_radek(r, "Kontrola každých (minut):", self.cfg.get("kontrola_minut", 15)); r += 1

        tk.Button(self.root, text="💾 ULOŽIT NASTAVENÍ", bg="#2e7d32", fg="white",
                  font=("Segoe UI", 12, "bold"), command=self.uloz_vse).grid(
            row=r, column=0, columnspan=3, pady=16)

    def _cislo_radek(self, r, popisek, hodnota):
        tk.Label(self.root, text=popisek).grid(row=r, column=0, sticky="w", padx=10, pady=3)
        e = tk.Entry(self.root, width=12)
        e.insert(0, str(hodnota))
        e.grid(row=r, column=1, sticky="w", padx=10, pady=3)
        return e

    def vyber_nemecke(self):
        for slug, var in self.znacka_vars.items():
            var.set(slug in NEMECKE)

    def vyber_francouzske(self):
        for slug, var in self.znacka_vars.items():
            var.set(slug in FRANCOUZSKE)

    def vyber_vse(self, hodnota):
        for var in self.znacka_vars.values():
            var.set(hodnota)

    def _aktualizuj_oblasti_label(self):
        if not self.oblasti:
            self.oblasti_label.config(text="Celé Polsko")
        else:
            jmena = ", ".join("{} ({}km)".format(o["nazev"], o["okruh_km"])
                              for o in self.oblasti)
            self.oblasti_label.config(text=jmena)

    def otevri_mapu(self):
        nove = mapa.otevri_mapu(self.root, self.oblasti)
        if nove is not None:   # None = uzivatel zrusil
            self.oblasti = nove
            self._aktualizuj_oblasti_label()

    def test_telegram(self):
        token = self.e_token.get().strip()
        chat = self.e_chat.get().strip()
        if not token or not chat:
            messagebox.showwarning("Chybí údaje", "Vyplň token i chat ID.")
            return
        jmeno = tg.over_pripojeni(token)
        if not jmeno:
            messagebox.showerror("Chyba", "Token nefunguje. Zkontroluj ho.")
            return

        # Sestav vsechny prijemce: ty + kamaradi (z pole, oddeleni carkou)
        raw = self.e_kamaradi.get().replace(";", ",")
        kamaradi = [c.strip() for c in raw.split(",") if c.strip()]
        prijemci = [("ty", chat)] + [("kamarád", k) for k in kamaradi]

        radky = []
        for oznaceni, cid in prijemci:
            ok, popis = tg.posli_test(token, cid)
            if ok:
                radky.append("✅ {} ({}) – doručeno".format(oznaceni, cid))
            elif "initiate" in popis:
                radky.append("❌ {} ({}) – musí botovi NAPSAT první (otevřít bota a dát Start)".format(oznaceni, cid))
            else:
                radky.append("❌ {} ({}) – nedoručeno ({})".format(oznaceni, cid, popis or "špatné chat ID?"))

        messagebox.showinfo("Test Telegramu (bot @{})".format(jmeno), "\n".join(radky))

    def _int(self, entry, vychozi):
        try:
            return int(entry.get().strip().replace(" ", ""))
        except Exception:
            return vychozi

    def uloz_vse(self):
        znacky = [slug for slug, var in self.znacka_vars.items() if var.get()]
        if not znacky:
            messagebox.showwarning("Pozor", "Vyber aspoň jednu značku.")
            return
        # Token ulozime mimo config (token.txt), v config zustane prazdny.
        uloz_token(self.e_token.get().strip())
        self.cfg["telegram"]["token"] = ""
        self.cfg["telegram"]["chat_id"] = self.e_chat.get().strip()
        raw = self.e_kamaradi.get().replace(";", ",")
        self.cfg["telegram"]["dalsi_prijemci"] = [
            c.strip() for c in raw.split(",") if c.strip()]
        self.cfg["filtry"]["znacky"] = znacky
        self.cfg["filtry"]["palivo"] = self.palivo_var.get()
        self.cfg["filtry"]["prevodovka"] = self.prevodovka_var.get()
        self.cfg["filtry"]["oblasti"] = self.oblasti
        self.cfg["filtry"]["min_rok"] = self._int(self.e_rok, 2010)
        self.cfg["filtry"]["max_najezd_nafta"] = self._int(self.e_najezd_nafta, 250000)
        self.cfg["filtry"]["max_najezd_benzin"] = self._int(self.e_najezd_benzin, 200000)
        self.cfg["filtry"].pop("max_najezd_km", None)  # stary klic uz nepotrebujeme
        self.cfg["filtry"]["max_cena_pln"] = self._int(self.e_cena_do, 120000)
        self.cfg["filtry"]["min_cena_pln"] = self._int(self.e_cena_od, 10000)
        self.cfg["min_zisk_kc"] = self._int(self.e_zisk, 20000)
        self.cfg["naklady_dovoz_kc"] = self._int(self.e_naklady, 10000)
        self.cfg["min_srovnani"] = self._int(self.e_srovnani, 5)
        self.cfg["kontrola_minut"] = self._int(self.e_minuty, 15)
        uloz(self.cfg)
        messagebox.showinfo("Uloženo", "Nastavení uloženo ✅\nPři další kontrole se použije.")


if __name__ == "__main__":
    root = tk.Tk()
    App(root)
    root.mainloop()
