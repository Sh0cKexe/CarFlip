# -*- coding: utf-8 -*-
"""
Okno s mapou pro vyber oblasti (okruhu).

Ovladani:
  - LEVY KLIK na mapu = pridat novy okruh (stred) s aktualnim polomerem
  - posuvnik vlevo nastavi polomer pro nove okruhy
  - okruhy se daji mazat ze seznamu
Kazdy okruh = stredove mesto + polomer v km (to Otomoto umi: mesto + dist).
"""
import math
import tkinter as tk
from tkinter import ttk, messagebox

import tkintermapview
import geokod


def _kruh_body(lat, lon, r_km, n=48):
    """Body polygonu aproximujici kruh o polomeru r_km kolem (lat, lon)."""
    body = []
    for i in range(n + 1):
        uhel = 2 * math.pi * i / n
        dlat = (r_km / 111.0) * math.cos(uhel)
        dlon = (r_km / (111.0 * math.cos(math.radians(lat)))) * math.sin(uhel)
        body.append((lat + dlat, lon + dlon))
    return body


def otevri_mapu(parent, existing_oblasti):
    """
    Otevre modalni okno s mapou. Vrati novy seznam okruhu, nebo None pri zruseni.
    Okruh = {"nazev", "mesto_slug", "lat", "lon", "okruh_km"}.
    """
    vysledek = {"data": None}
    okruhy = [dict(o) for o in (existing_oblasti or [])]

    win = tk.Toplevel(parent)
    win.title("Vyber oblasti na mapě")
    win.geometry("960x660")
    win.grab_set()

    # ----- leve ovladaci panely -----
    levy = tk.Frame(win, width=260)
    levy.pack(side="left", fill="y", padx=8, pady=8)
    levy.pack_propagate(False)

    tk.Label(levy, text="Oblasti (okruhy)", font=("Segoe UI", 13, "bold")).pack(anchor="w")
    tk.Label(levy, justify="left", fg="#444", font=("Segoe UI", 9),
             text="• LEVÝ KLIK na mapu = přidat okruh\n"
                  "• posuvníkem nastav poloměr\n"
                  "• klikni na okruh v seznamu a Smaž").pack(anchor="w", pady=(0, 8))

    tk.Label(levy, text="Poloměr pro nový okruh (km):").pack(anchor="w")
    polomer_var = tk.IntVar(value=50)
    tk.Scale(levy, from_=5, to=300, orient="horizontal", variable=polomer_var,
             resolution=5, length=240).pack(anchor="w")

    tk.Label(levy, text="Přidané okruhy:").pack(anchor="w", pady=(8, 0))
    seznam = tk.Listbox(levy, height=12, width=34)
    seznam.pack(anchor="w")

    stav = tk.Label(levy, text="", fg="#2e7d32", font=("Segoe UI", 9), wraplength=240, justify="left")
    stav.pack(anchor="w", pady=4)

    # ----- mapa -----
    pravy = tk.Frame(win)
    pravy.pack(side="right", fill="both", expand=True, padx=8, pady=8)
    mapa = tkintermapview.TkinterMapView(pravy, corner_radius=0)
    mapa.pack(fill="both", expand=True)
    mapa.set_position(52.0, 19.2)   # stred Polska
    mapa.set_zoom(6)

    def prekresli():
        mapa.delete_all_marker()
        mapa.delete_all_polygon()
        seznam.delete(0, tk.END)
        for o in okruhy:
            popis = "{} – {} km".format(o.get("nazev") or "?", o.get("okruh_km"))
            seznam.insert(tk.END, popis)
            mapa.set_marker(o["lat"], o["lon"], text=popis)
            mapa.set_polygon(_kruh_body(o["lat"], o["lon"], o["okruh_km"]),
                             outline_color="#1565c0", fill_color="#1565c0",
                             border_width=2)

    def pridej(coords):
        lat, lon = coords
        stav.config(text="Hledám město…", fg="#666")
        win.update_idletasks()
        nazev, slug = geokod.bod_na_mesto(lat, lon)
        okruhy.append({
            "nazev": nazev or "(neznámé)",
            "mesto_slug": slug,
            "lat": round(lat, 5),
            "lon": round(lon, 5),
            "okruh_km": int(polomer_var.get()),
        })
        if slug:
            stav.config(text="Přidáno: {} ({} km)".format(nazev, polomer_var.get()), fg="#2e7d32")
        else:
            stav.config(text="Bod přidán, ale město se nepodařilo určit – zkus kliknout blíž k městu.", fg="#c62828")
        prekresli()

    mapa.add_left_click_map_command(pridej)

    def smaz():
        vyber = seznam.curselection()
        if not vyber:
            return
        del okruhy[vyber[0]]
        prekresli()

    def uloz():
        platne = [o for o in okruhy if o.get("mesto_slug")]
        vynechano = len(okruhy) - len(platne)
        if vynechano:
            messagebox.showwarning("Pozor",
                "{} bodů bez určeného města bude vynecháno.".format(vynechano))
        vysledek["data"] = platne
        win.destroy()

    def zrus():
        vysledek["data"] = None
        win.destroy()

    tlac = tk.Frame(levy)
    tlac.pack(anchor="w", pady=8, fill="x")
    tk.Button(tlac, text="🗑 Smazat vybraný", command=smaz).pack(fill="x", pady=2)
    tk.Button(tlac, text="💾 Uložit oblasti", bg="#2e7d32", fg="white",
              font=("Segoe UI", 11, "bold"), command=uloz).pack(fill="x", pady=2)
    tk.Button(tlac, text="Zrušit", command=zrus).pack(fill="x", pady=2)

    # pokud uz nejake okruhy jsou, vykresli je a vycentruj na prvni
    if okruhy:
        mapa.set_position(okruhy[0]["lat"], okruhy[0]["lon"])
        mapa.set_zoom(8)
    prekresli()

    win.wait_window()
    return vysledek["data"]
