# 🚗 CarFlip – návod (prototyp)

Aplikace hlídá inzeráty na **Otomoto (Polsko)**, odhadne prodejní cenu v ČR
podle **Bazoše**, spočítá zisk a když je **vyšší než tvůj limit** (např. 20 000 Kč),
pošle ti upozornění na **Telegram** – s fotkou, cenami, ziskem, odkazem
a přeloženým popisem.

---

## ✅ Co potřebuješ jednou připravit

### KROK 1 – Nainstaluj knihovny
Dvakrát klikni na **`1-INSTALACE.bat`**. Otevře se černé okno, chvíli to bude
instalovat a napíše „Hotovo". Pak okno zavři. (Stačí udělat jen jednou.)

> Pokud to napíše, že „py" není známý příkaz, musíš nejdřív nainstalovat Python
> z https://www.python.org/downloads/ a při instalaci zaškrtnout
> **„Add Python to PATH"**.

---

### KROK 2 – Vytvoř si Telegram bota (2 minuty)
1. V Telegramu nahoře do vyhledávání napiš **@BotFather** a otevři ho
   (má modré ověřené kolečko).
2. Napiš mu příkaz: **/newbot**
3. Zeptá se na jméno bota – napiš cokoliv, např. `Moje CarFlip`.
4. Pak chce „username" – musí končit na `bot`, např. `mojecarflip_bot`.
5. BotFather ti pošle **token** – dlouhý kód jako
   `8123456789:AAH...xyz`. **Ten si zkopíruj.**

### KROK 3 – Zjisti svoje Chat ID
1. Ve vyhledávání Telegramu najdi svého nového bota (podle username z kroku 2)
   a napiš mu cokoliv, třeba „ahoj". (Důležité – bez toho ti nemůže psát.)
2. Pak najdi bota **@userinfobot**, otevři ho a napiš `/start`.
3. Pošle ti tvoje **Id** (číslo, např. `123456789`). **To je tvoje Chat ID.**

---

### KROK 4 – Vyplň nastavení
Dvakrát klikni na **`2-NASTAVENI.bat`**. Otevře se okno, kde:
- nahoře vlož **Token** a **Chat ID** z předchozích kroků,
- klikni **🔔 Otestovat Telegram** – musí ti přijít zpráva do Telegramu,
- vyber **značky** (jsou tlačítka „🇩🇪 Německé koncerny", „🇫🇷 Francouzské"),
- klikni na **🗺️ Vybrat oblasti na mapě** – otevře se mapa Polska. **Levým klikem**
  přidáš okruh (kruh kolem místa), **posuvníkem** vlevo nastavíš poloměr v km.
  Můžeš přidat **víc okruhů** (např. Wrocław i Kraków). Nic nevybráno = celé Polsko,
- nastav **palivo**, **převodovku** (Vše/Automat/Manuál), **max nájezd zvlášť pro
  naftu a benzín** (např. nafta 250 000, benzín 200 000), **ceny**,
  **min. zisk** (výchozí 20 000),
  **náklady na dovoz** (výchozí 10 000) a jak často kontrolovat (výchozí 15 min),
- dole klikni **💾 ULOŽIT NASTAVENÍ**.

---

## ▶️ Spuštění

Dvakrát klikni na **`3-START.bat`**.
- Otevře se okno, které píše, co dělá.
- **První spuštění** jen načte aktuální nabídku (nepošle nic) – aby tě to
  nezavalilo všemi auty co už na trhu jsou.
- Od té chvíle ti chodí upozornění **jen na nově přidaná auta**, která splní
  tvůj zisk.
- Okno **nech otevřené** – dokud běží, hlídá. Zavřením okna hlídání zastavíš.

> ⚠️ Teď to běží na tvém PC, takže hlídá jen když je počítač zapnutý.
> V další fázi to přesuneme na **cloud zdarma (GitHub Actions)**, aby to
> běželo 24/7 i s vypnutým počítačem.

---

## 👥 Sdílení s kamarádem (stejná upozornění)
Chceš, aby stejná auta chodila i kamarádovi? Bot umí posílat víc lidem najednou:
1. Kamarád v Telegramu najde **tvého bota** (podle username) a napíše mu cokoliv
   (např. „ahoj") – jinak mu bot nemůže psát.
2. Kamarád otevře **@userinfobot**, napíše `/start` a opíše si svoje **Id** (číslo).
3. To číslo pošle tobě.
4. Ty otevřeš **`2-NASTAVENI.bat`** → pole **„Chat ID kamarádů"** → vložíš jeho číslo
   (víc kamarádů odděl čárkou) → **Ulož**.
Hotovo – od teď chodí upozornění tobě i jemu. (Filtry máte společné, řídíš je ty.)

## ▶️ „Najdi teď" – projet aktuální nabídku (`NAJDI-TED.bat`)
Normální hlídání (`3-START.bat`) hlásí jen **nově přidaná** auta. Když chceš
**hned projet celý aktuální trh** a poslat všechna ziskovaná auta, spusť
**`NAJDI-TED.bat`**:
- projede **celou** nabídku podle tvých filtrů (všechny stránky),
- pošle ziskové kusy na Telegram **tobě i kolegovi**, seřazené od nejvyššího zisku
  (max 12 aut, ať tě to nezahltí),
- **nesáhne** na hlídání ani na paměť (`videno.db`),
- v okně vypíše statistiku (kolik a proč přeskočil) – hodí se na ladění.

Trvá to pár minut (čeká mezi dotazy, ať šetří Bazoš). Když ho spustíš znovu
brzy po sobě, je rychlejší (ceny má 12 h v paměti).

## 🔧 Změna filtrů kdykoliv
Otevři **`2-NASTAVENI.bat`**, změň co chceš, ulož. Při příští kontrole se to
samo použije (není nutné restartovat).

---

## 🧪 Test bez Telegramu
Chceš jen vidět, co by to našlo, bez posílání? Spusť v okně příkaz:
`py -3.10 _test_dryrun.py` – vypíše kandidáty rovnou do okna.

---

## 🚫 Co aplikace automaticky přeskočí (nepošle)
- auta **bez polských značek** (dovoz z Německa apod., které ještě nejsou
  registrované v Polsku),
- auta na **LPG / CNG / plyn**,
- auta označená jako **poškozená** nebo s náznakem nepojízdnosti v popisu
  (vadný motor, převodovka, „do remontu" apod.).

## 📊 Jak se počítá cena v ČR
Porovnává se jen s auty, která **sedí**:
- **stejný model** (musí být v názvu inzerátu, ne jen v popisu),
- **stejné palivo + podobný objem motoru** (±0,25 l) – benzín se neporovnává s naftou,
- **stejný rok nebo starší** (max o 3 roky), **nikdy novější**,
- **nájezd ±50 000 km**, **cena ≤ 2,5×** ceny polského auta.

Aby mělo porovnání smysl, musí se najít **aspoň 3 takto sedící auta** (jinak se
auto přeskočí – radši nic než špatný odhad). Počet si změníš v nastavení
(„Min. srovnatelných aut v ČR").

## ⚠️ Na čem ještě musíme zapracovat (přesnost odhadu)
Odhad ceny v ČR je zatím **hrubý** – bere medián z Bazoše bez ohledu na
nájezd a výbavu a míchá tam ceny autobazarů (které bývají nadsazené).
Proto ber čísla zisku zatím **orientačně** a u každého auta si přes přiložené
odkazy ověř srovnatelné kusy. Tohle společně vylepšíme.
