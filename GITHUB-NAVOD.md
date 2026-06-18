# ☁️ CarFlip na serveru 24/7 zdarma (GitHub Actions)

Tohle zařídí, že hlídání běží na serverech GitHubu i s vypnutým počítačem.
Filtry/mapu nastavuješ dál u sebe (`2-NASTAVENI.bat`) a pak nahraješ `config.json`.

---

## FÁZE 1 – Účet a repozitář
1. Jdi na **https://github.com** → **Sign up**, založ účet (zdarma, e-mail + heslo).
2. Vpravo nahoře **+** → **New repository**.
3. Repository name: **CarFlip**.
4. Zaškrtni **Private** (důležité – ať to nikdo nevidí).
5. Klikni **Create repository**.

## FÁZE 2 – Nahrání souborů
1. V repozitáři: **Add file → Upload files**.
2. Z počítače ze složky `CarFlip` přetáhni VŠECHNY soubory **kromě**:
   - `videno.db` (ten NEnahrávej – ať server udělá první kompletní průjezd),
   - složky `__pycache__` (netřeba).
3. Dole klikni **Commit changes**.

## FÁZE 3 – Soubor pro automatické spouštění
1. **Add file → Create new file**.
2. Do názvu napiš přesně: `.github/workflows/carflip.yml`
   (GitHub sám vytvoří složky).
3. Otevři na PC soubor `.github/workflows/carflip.yml`, zkopíruj celý obsah
   a vlož ho tam.
4. **Commit changes**.

## FÁZE 4 – Tajný klíč (Telegram token)
1. V repozitáři: **Settings → Secrets and variables → Actions**.
2. **New repository secret**.
3. Name: `TELEGRAM_TOKEN`
4. Secret: vlož svůj token (ten z BotFathera).
5. **Add secret**.

## FÁZE 5 – Zapnout a vyzkoušet
1. Nahoře záložka **Actions** → pokud se ptá, potvrď **I understand... enable**.
2. Vlevo **CarFlip hlidani** → **Run workflow** → **Run workflow** (ruční zkouška).
3. Po chvíli uvidíš zelený zatržítko = běželo. Na Telegram dorazí auta.
4. Od teď to běží **samo každých ~15 minut**.

---

## Když budeš chtít změnit filtry
1. U sebe otevři `2-NASTAVENI.bat`, změň co chceš, ulož.
2. Na GitHubu otevři `config.json` → tužtička (Edit) → vlož nový obsah → Commit.
   (Nebo `Upload files` a přepiš `config.json`.)

## Dobré vědět
- **První běh na serveru** projede celý trh (pár minut) a pošle aktuální zisková
  auta. Další běhy už jen nová.
- GitHub může spouštění občas o pár minut zpozdit (normální).
- Pokud by Bazoš/Otomoto blokovaly servery GitHubu, vyřešíme to (mám pojistky).
