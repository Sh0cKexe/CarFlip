# -*- coding: utf-8 -*-
"""Pamet jiz videnych inzeratu (aby upozorneni nechodilo dvakrat)."""
import os
import sqlite3

DB = os.path.join(os.path.dirname(__file__), "videno.db")


def _spoj():
    con = sqlite3.connect(DB)
    con.execute("CREATE TABLE IF NOT EXISTS videno ("
                "id TEXT PRIMARY KEY, "
                "kdy TEXT DEFAULT CURRENT_TIMESTAMP)")
    return con


def uz_videno(ad_id):
    con = _spoj()
    cur = con.execute("SELECT 1 FROM videno WHERE id=?", (str(ad_id),))
    found = cur.fetchone() is not None
    con.close()
    return found


def oznac_videno(ad_id):
    con = _spoj()
    con.execute("INSERT OR IGNORE INTO videno (id) VALUES (?)", (str(ad_id),))
    con.commit()
    con.close()


if __name__ == "__main__":
    print("videno 123?", uz_videno("123"))
    oznac_videno("123")
    print("videno 123?", uz_videno("123"))
