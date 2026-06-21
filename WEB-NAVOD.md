# 🌐 CarFlip web (login + nastavení pro víc uživatelů)

Tohle zařídí webovou stránku, kde si každý uživatel sám přes prohlížeč
nastaví svého telegram bota a filtry – beze zásahu do kódu. Starý osobní
běh (`main.py`, `3-START.bat`, `config.json`) zůstává funkční vedle toho.

---

## FÁZE 1 – Supabase (login + databáze, zdarma)
1. Jdi na **https://supabase.com** → **Start your project** → přihlas se
   (stačí přes GitHub účet, který už máš).
2. **New project** → název např. `carflip`, vymysli si heslo k databázi
   (ulož si ho), region klidně Frankfurt (nejblíž). Počkej ~1 minutu, než se vytvoří.
3. Vlevo menu **SQL Editor** → **New query**.
4. Otevři na PC soubor `supabase/schema.sql`, zkopíruj celý obsah, vlož do
   editoru a klikni **Run**. (Vytvoří tabulky pro nastavení uživatelů.)
5. Vlevo menu **Project Settings → API**. Tady jsou 3 hodnoty, co budeš
   potřebovat – **nikam je teď nepiš veřejně**, jen si je měj otevřené:
   - **Project URL**
   - **anon public** klíč
   - **service_role** klíč (tenhle je citlivý – nikdy do webu/frontendu!)

## FÁZE 2 – Nasazení webu na Vercel (zdarma)
1. Jdi na **https://vercel.com** → přihlas se přes GitHub.
2. **Add New → Project** → vyber repozitář **CarFlip**.
3. V nastavení projektu **Root Directory** přepni na **web** (důležité –
   web je v podsložce, ne v hlavní složce repa).
4. Sekce **Environment Variables** – přidej:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL ze Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public klíč ze Supabase
5. Klikni **Deploy**. Po chvíli dostaneš adresu typu `carflip.vercel.app` –
   to je tvůj web, klidně si ho ulož/přejmenuj v nastavení Vercelu.

## FÁZE 3 – Cloud bot pro všechny uživatele (GitHub secrets)
Tohle ti dopošlu/nastavím já, jen mi po fázi 1 dej (sem do chatu, nebo
mi řekni že máš hotovo a já tě navedu bezpečně je předat):
- `SUPABASE_URL` (= Project URL)
- `SUPABASE_SERVICE_KEY` (= service_role klíč)

Nastavím je jako GitHub Actions secrets (`Settings → Secrets and variables →
Actions`) u repozitáře CarFlip, stejně jako dřív TELEGRAM_TOKEN. Tyto dva
klíče se NIKDY nedostanou do webu ani do repozitáře – jen do GitHub secret,
který čte pouze cloud běh (`main_cloud.py`).

## FÁZE 4 – Druhý budík (cron-job.org)
Stejně jako máš dnes budík na `carflip.yml` (hlídání tvého osobního bota),
přidej druhý job, který spouští **carflip-cloud.yml** (hlídání všech
uživatelů webu):
1. Na **cron-job.org** → **Create cronjob**.
2. URL: `https://api.github.com/repos/Sh0cKexe/CarFlip/actions/workflows/carflip-cloud.yml/dispatches`
3. Metoda **POST**, stejná autentizační hlavička (GitHub PAT) jako u prvního budíku.
4. Tělo (body): `{"ref":"main"}`.
5. Interval: stejně každých 15 minut.

---

## Jak to potom použiješ ty/zákazníci
1. Otevři webovou adresu (Vercel) → **Registrovat** (e-mail + heslo).
2. Po přihlášení vyplň telegram token (z BotFathera), chat ID, filtry.
3. Klikni **Test spojení** – ověří, že bot funguje, hned přijde testovací zpráva.
4. **Uložit nastavení** – od dalšího běhu cloud bota (do ~15 min) začnou
   chodit upozornění na ziskové auta přesně podle těchto filtrů.

## Dobré vědět
- Prvních ~50 uživatelů je v pohodě na free tieru Supabase i Vercelu.
- Tvůj osobní bot (`carflip.yml`) běží dál nezávisle, nic se mu nezmění.
- Pole "Oblasti" ve webu je nepovinné (prázdné = hledá v celém Polsku) –
  pro konkrétní město stačí zadat název a slug (např. `wroclaw`) + okruh km.

## Aktualizace – účetní modul (auta, náklady, fotky)
Přibyla záložka **Moje auta** vedle Nastavení – ke každému autu na flipu si
napíšeš poznámky, náklady (dovoz, STK, pojistka…) a přiložíš fotky.

Potřebuje to dvě nové tabulky + Storage bucket navíc. Spusť znovu SQL:
1. Supabase → **SQL Editor** → New query.
2. Otevři znovu `supabase/schema.sql` (má teď víc řádků než předtím),
   zkopíruj **celý** obsah, vlož, **Run**. (Je to bezpečné spustit znovu i
   nad existující databází – nic nepřepíše/nesmaže.)

Žádné nové GitHub secrets ani Vercel env proměnné nejsou potřeba – fotky
i tabulky používají stejné Supabase přihlášení, co už web má.

## Aktualizace – AI rozbor inzerátu
U pole "Link na Otomoto inzerát" (na stránce auta) přibylo tlačítko
**🤖 AI rozbor inzerátu** – stáhne inzerát a Claude napíše shrnutí, typické
známé závady, red flags a doporučení koupit/nekoupit.

Potřebuje to API klíč (jen na serveru, nikdy ve webu/prohlížeči):
1. **https://console.anthropic.com** → založ účet (nový účet dostane malý
   free trial kredit – stačí na hodně testování, žádný "navždy zdarma" tier
   ale neexistuje).
2. **API Keys → Create Key**, zkopíruj hodnotu (začíná `sk-ant-...`).
3. Ve **Vercelu** → CarFlip projekt → **Settings → Environment Variables**:
   - Name: `ANTHROPIC_API_KEY`
   - Value: ten klíč z kroku 2
   - Environments: Production + Preview
4. **Redeploy** (Vercel → Deployments → ⋯ → Redeploy), ať se proměnná použije.

Cena: i bez kreditu řádově desetiny Kč na jeden rozbor (model Claude Opus 4.8).
Sleduj spotřebu v **console.anthropic.com → Usage**.
