export type Trh = "cz" | "sk";

const CS = {
  mena: "Kč",
  nastaveni: "Nastavení",
  nastaveniBota: "Nastavení bota",
  filtryHledani: "Filtry hledání",
  mojeAuta: "Moje auta",
  odhlasit: "Odhlásit",

  prihlasit: "Přihlásit",
  registrovat: "Registrovat",
  email: "E-mail",
  heslo: "Heslo",
  pracuji: "Pracuji...",
  prihlasitSe: "Přihlásit se",
  vytvoritUcet: "Vytvořit účet",
  registraceOk: "Registrace OK. Pokud projekt vyžaduje potvrzení e-mailu, zkontroluj schránku, jinak se hned přihlas.",
  inviteKod: "Invite kód",
  pristupVyprsel: "Přístup vypršel. Pro prodloužení kontaktuj administrátora.",
  nemasInviteKod: "Nemáš ještě svůj invite kód? Připoj se na Discord.",
  dniDoVyprseniPredlozka: "dní do vypršení",
  vyprsiDnes: "Přístup vyprší dnes",

  telegramBot: "Telegram bot",
  aktivni: "aktivní",
  pozastaveno: "pozastaveno",
  tokenBota: "Token bota",
  tvojeChatId: "Tvoje chat ID",
  navodBota: "Jak vytvořit bota",
  navodVideoPopisek: "Psaný návod (jména botů) najdeš v popisu videa na YouTube.",
  dalsiPrijemci: "Další příjemci (chat ID, čárkou)",
  testSpojeni: "Test spojení",
  testuji: "Testuji...",
  botAktivni: "Zapnout / vypnout bota",
  posledniKontrola: "Poslední kontrola",
  nikdyNebehl: "ještě neproběhla",
  predMinutami: "před {n} min",
  predHodinami: "před {n} h",
  vyplnTokenChatId: "Vyplň prosím token i chat ID.",
  botBezi: "✅ Bot běží a hledá",
  botCekaPrvniKontrola: "Bot je zapnutý, čeká na první kontrolu (do ~15 min).",
  botDlouhoBezKontroly: "⚠️ Dlouho neproběhla kontrola – zkontroluj token/chat ID.",
  botVypnuty: "Bot je vypnutý.",
  trh: "Trh",
  trhCesko: "🇨🇿 Česko",
  trhSlovensko: "🇸🇰 Slovensko",
  trhKratceCz: "CS-CZK",
  trhKratceSk: "SK-EUR",
  trhInfo: "SK-EUR: bot hledá a srovnává ceny na slovenském trhu (bazos.sk) v euro. CS-CZK: český trh (bazos.cz) v Kč.",

  prehled: "Přehled",
  celkovyZisk: "Celkový zisk z prodaných aut",
  pocetAutCelkem: "Aut celkem",
  celkoveNaklady: "Celkové náklady",
  prumernyZiskAuto: "Průměrný zisk na auto",
  prumernaDobaDrzeni: "Průměrná doba držení",
  dniZkratka: "dní",
  otevreneUkoly: "Otevřené úkoly",
  aiLimityNadpis: "AI limity tento měsíc",

  najdiTed: "Najít teď",
  najdiTedSpoustim: "Spouštím...",
  najdiTedSpusteno: "Hledám podle filtrů, výsledek přijde na Telegram za chvíli.",
  najdiTedBezi: "🔎 Hledám podle filtrů... může to trvat několik minut.",
  najdiTedHotovo: "✅ Hotovo, zkontroluj Telegram.",
  najdiTedChyba: "❌ Něco se nepovedlo, zkus to znovu.",
  najdiTedCooldown: "Zkus to znovu za",
  najdiTedMinut: "min",

  zdrojoveTrhy: "Zdrojové trhy",
  zdrojoveTrhyInfo: "Odkud se mají stahovat inzeráty k posouzení.",
  zadnyZdrojVarovani: "⚠️ Není vybraný žádný zdrojový trh – bot nic nenajde.",
  oblastNepouzitaVarovani: "⚠️ Zdroj {zeme} není zapnutý výše, tahle oblast se nepoužije.",
  cenaOdDoVarovani: "⚠️ Cena „od“ je vyšší než „do“.",
  rokVBudoucnostiVarovani: "⚠️ Rok je v budoucnosti.",
  zdrojPolsko: "Polsko - Otomoto",
  zdrojCesko: "Česko - Bazoš.cz",
  zdrojSlovensko: "Slovensko - Bazoš.sk",
  zdrojNemecko: "Německo - AutoScout24",
  zdrojRakousko: "Rakousko - Willhaben",
  zdrojItalie: "Itálie - AutoScout24",
  cenaCzOd: "Cena ČR od (Kč)",
  cenaCzDo: "Cena ČR do (Kč)",
  cenaSkOd: "Cena SK od (EUR)",
  cenaSkDo: "Cena SK do (EUR)",
  cenaZahranicniOd: "Cena DE/AT/IT od (EUR)",
  cenaZahranicniDo: "Cena DE/AT/IT do (EUR)",
  celySpolkovyKraj: "Celý spolkový kraj",
  zeme: "Země",

  filtryAut: "Filtry aut",
  znacky: "Značky",
  vybrano: "vybráno",
  hledatZnacku: "hledat značku...",
  zadnaZnacka: "Žádná značka neodpovídá hledání.",
  dalsiZnacky: "Další značky, co v seznamu nejsou (čárkou, malými písmeny)",
  palivo: "Palivo",
  vse: "vše",
  benzin: "benzín",
  diesel: "diesel",
  prevodovka: "Převodovka",
  manual: "manuál",
  automat: "automat",
  rokOd: "Rok od",
  maxNajezdDiesel: "Max nájezd diesel (km)",
  maxNajezdBenzin: "Max nájezd benzín (km)",
  cenaPlOd: "Cena PL od (PLN)",
  cenaPlDo: "Cena PL do (PLN)",
  oblasti: "Oblasti (prázdné = celý trh) – klikni do mapy, vznikne nová oblast. Barva pinu podle země (zelená PL, modrá ČR, oranžová SK).",
  nazev: "Název",
  okruhKm: "Okruh (km)",
  smazat: "Smazat",
  pridatOblast: "+ Přidat oblast",

  ziskovost: "Ziskovost",
  minimalniZisk: "Minimální zisk",
  nakladyDovoz: "Předpokládané náklady",
  minSrovnatelnych: "Min. srovnatelných inzerátů",
  ulozitNastaveni: "Uložit nastavení",
  ukladam: "Ukládám...",
  ulozeno: "Uloženo.",
  chybaUkladani: "Chyba při ukládání: ",
  testOk: "Test OK, zpráva odeslána na Telegram.",
  telegramChyba: "Telegram chyba: ",
  neznama: "neznámá",
  chybaSite: "Chyba sítě: ",

  pridatAuto: "+ Přidat auto",
  vytvarim: "Vytvářím...",
  zadneAuto: 'Zatím žádné auto. Klikni na "+ Přidat auto".',
  bezNazvu: "Bez názvu",
  koupeno: "koupeno",
  vInzerci: "v inzerci",
  prodano: "prodáno",
  koupenoZa: "Koupeno za",
  naklady: "Náklady",
  zisk: "Zisk",
  vazanyKapital: "Vázaný kapitál",
  prodanoZa: "Prodáno za",
  celkemVAute: "Celkem v autě",
  ziskZtrata: "Zisk / Ztráta",
  porizeni: "Pořízení",
  dobaProdeje: "Doba prodeje",
  dni: "dní",
  najezd: "Nájezd",

  zakladniInfo: "Základní info",
  nazevModel: "Název / model",
  stav: "Stav",
  linkOtomoto: "Link na Otomoto inzerát",
  aiRozbor: "🤖 AI rozbor inzerátu",
  aiRozborNadpis: "AI rozbor",
  aiHistorie: "Historie rozborů",
  zadneRozbory: "Zatím žádný rozbor.",
  vlozLink: "Vlož link na inzerát (Otomoto, Bazoš.cz/sk, AutoScout24, Willhaben)",
  spustitRozbor: "Spustit rozbor",
  analyzuji: "Analyzuji...",
  aiRozborProbiha: "Rozbor probíhá – AI analyzuje data, vyčkej na výsledek (může trvat i 30 s).",
  aiVyuzitoZLimitu: "rozborů využito tento měsíc",
  aiLimitDosazen: "Dosáhl jsi měsíčního limitu AI rozborů. Limit se obnoví příští měsíc.",
  aiDisclaimer: `⚠️ Než vyrazíte pro auto: Jak správně chápat tuto AI analýzu?
Tento rozbor je skvělý parťák, ale umělá inteligence je stále jen stroj, který auto fyzicky neviděl a vychází pouze z textu inzerátu, obecných technických dat a často hlášených závad.

Mějte proto na paměti, že AI:
❌ Nevidí realitu: Vychází jen z toho, co prodejce v inzerátu přiznal (nebo záměrně zamlčel).
❌ Nezná historii: Neodhalí stočené kilometry, zamaskovanou bouračku ani zanedbaný servis tohoto konkrétního kusu.

Jak s tím správně naložit?
Použijte tento rozbor jako super přípravu a vždy si ověřujte data z více zdrojů – i AI na něco může zapomenout, popřípadě říct něco, co u daného modelu nemusí být akurátní. Uložte si body, na které AI upozornila, a na místě to zkontrolujte.

ℹ️ Právní doložka: Výstupy generované tímto AI nástrojem mají čistě orientační a informativní charakter a nenahrazují profesionální technickou inspekci. Rozhodnutí o koupi vozidla činíte výhradně na vlastní riziko a provozovatel webu nenese žádnou odpovědnost za případné vady vozidla, finanční ztráty nebo škody vzniklé nákupem vozu.`,

  aiInzeratNadpis: "AI generátor inzerátu",
  rokVyroby: "Rok výroby",
  cena: "Cena",
  vykonKw: "Výkon (kW)",
  spotrebaKombinovana: "Kombinovaná spotřeba (l/100km)",
  palivoBenzinLpg: "benzín + LPG",
  palivoBenzinCng: "benzín + CNG",
  palivoElektrina: "elektřina",
  palivoHybrid: "hybrid",
  palivoPluginHybrid: "plug-in hybrid",
  vinCislo: "VIN",
  aiInzeratNepovinne: "Vyplň, co uznáš za vhodné.",
  aiInzeratProbiha: "Generuji inzerát – může to trvat i 30 s.",
  motor: "Motor",
  aiInzeratPoznamky: "Co doporučuji v inzerátu zmínit (výbava, stav exteriéru a interiéru, servis, závady, kola a pneu, auto po detailingu a pro koho je auto vhodné)",
  generujInzerat: "Vygenerovat text",
  generuji: "Generuji...",
  vystupInzeratu: "Vygenerovaný text",
  zkopirovat: "Zkopírovat",
  zkopirovano: "Zkopírováno!",
  aiInzeratVyuzitoZLimitu: "inzerátů využito tento měsíc",
  aiInzeratLimitDosazen: "Dosáhl jsi měsíčního limitu AI inzerátů. Limit se obnoví příští měsíc.",
  aiInzeratDisclaimer: `🚀 Text je na světě! Než ho ale zkopírujete na Bazoš...
Umělá inteligence vám sice ušetřila spoustu práce a napsala text, ale auto nezná tak dobře jako vy. Před publikováním inzerátu si text prosím pozorně přečtěte a zkontrolujte.

Na co si dát největší pozor?

🔍 Skutečný stav: Odpovídá text realitě? Pokud AI napsala „perfektní stav laku", ale na autě je škrábanec přes celé dveře, raději to upravte. Upřímnost prodává nejlépe.

🛠️ Výbava a motor: Zkontrolujte, zda AI omylem nepřidala výbavu, kterou vaše auto nemá (např. panoramatickou střechu nebo jiný typ převodovky).

📝 Pravopis jmen a názvů: Občas může AI poplést specifický název motorizace nebo výbavového stupně.

ℹ️ Právní doložka: Tento text byl vygenerován umělou inteligencí. Provozovatel webu neodpovídá za správnost, pravdivost ani úplnost vygenerovaného inzerátu. Jako prodejce nesete plnou odpovědnost za to, že informace, které o vozidle zveřejníte, odpovídají skutečnému stavu.`,

  aiMechanikNadpis: "AI pro mechaniky",
  mechZnacka: "Značka",
  mechModel: "Model",
  mechMotor: "Motor (např. 1.6 TDI)",
  vyplnUdajeAuta: "Vyplň značku, model, rok, motor a výkon, ať AI přesně ví, s čím pracuje.",
  zacniChat: "Začít chat",
  napisOtazku: "Napiš otázku...",
  odeslat: "Odeslat",
  novyAutoDoChatu: "Nové auto",
  mechAsistent: "AI mechanik",
  aiMechanikVyuzitoZLimitu: "nových chatů využito tento měsíc",
  aiMechanikLimitDosazen: "Dosáhl jsi měsíčního limitu nových chatů. Limit se obnoví příští měsíc - staré chaty si ale dál můžeš otevřít a pokračovat v nich.",
  aiMechanikProbiha: "Mechanik přemýšlí – může to trvat i 30 s.",
  aiMechanikHistorie: "Historie chatů",
  pokracovatVChatu: "Pokračovat",
  aiMechanikDisclaimer: `🛠️ K čemu je tento AI asistent skvěle použitelný?
Umělá inteligence je fantastický parťák pro brainstorming a rychlou diagnostiku. Dokáže vám ušetřit hodiny tápání, protože:

✅ Propojuje symptomy: Zadáte jí chybové kódy společně s tím, jak se auto chová (např. cuká za studena, ztrácí tlak), a ona vám okamžitě vyplivne seznam nejčastějších příčin.

✅ Zná typické bolesti aut: Ví, co u konkrétních modelů a motorů odchází nejčastěji (např. „u tohoto nájezdu na tomto motoru často odchází podtlaková regulace turba"). Máte tak hned tip, na co se zaměřit nejdřív.

✅ Poradí s logickým postupem: Navrhne vám efektivní postup měření a testování, abyste nemuseli měnit díly stylem pokus-omyl.

🛑 STOP! Ale pozor na tvrdá data:
Tento AI asistent slouží výhradně jako myšlenková inspirace, kde začít hledat závadu, když už si nevíte rady s diagnostikou. Nikdy ho nepoužívejte jako zdroj technických dat!

Co od AI NIKDY nebrat vážně:

❌ Utahovací momenty: AI si čísla a Newtonmetry často vymýšlí nebo plete modely. Hrozí stržení závitů nebo zničení dílů.

❌ Elektrická schémata a piny: Barvy drátů, čísla pinů a schémata zapojení musíte brát jako neověřená. Stačí jeden přehozený pin a odpálíte řídicí jednotku.

❌ Servisní postupy (Rozvody apod.): Přesné postupy montáže a nastavení motoru z AI nelze považovat za bezpečné.

🛠️ Zlaté pravidlo: Všechny utahovací momenty, schémata a přesné postupy si vždy a bezvýhradně ověřte a porovnejte z více nezávislých zdrojů a oficiálních dílenských příruček (Autodata, Vivid, ElsaWin, TecRMI atd.) podle konkrétního kódu motoru a VIN. Spoléhat se pouze na jeden zdroj informací, natož na AI, je v dílně obrovský hazard.

ℹ️ Právní doložka: Provozovatel webu důrazně varuje před slepým následováním technických hodnot vygenerovaných AI. Data jsou bez záruky. Za jakékoliv škody na vozidle, zničené díly nebo finanční ztráty způsobené nesprávným postupem nese plnou odpovědnost mechanik provádějící opravu.`,
  pridatDoPoznamek: "Přidat do poznámek",
  cenaKoupeno: "Cena koupeno",
  cenaProdano: "Cena prodáno",
  datumKoupeno: "Datum koupeno",
  datumProdano: "Datum prodáno",
  poznamky: "Poznámky",
  poznamkyPlaceholder: "Napiš si sem cokoliv k tomuto autu...",
  ulozit: "Uložit",
  celkem: "celkem",
  popisNakladu: "Popis (např. Dovoz, STK, pojistka)",
  castka: "Částka",
  pridat: "+ Přidat",
  smazatMale: "smazat",
  cistyZisk: "Čistý zisk:",
  fotky: "Fotky",
  pridatFotky: "+ Přidat fotky",
  nahravam: "Nahrávám...",
  zpetNaAuta: "← Zpět na moje auta",
  smazatAuto: "Smazat auto",
  potvrditSmazani: "Smazat tohle auto i se všemi náklady a fotkami?",

  prodatAuto: "Prodat auto",
  zrusitProdej: "Zrušit prodej",
  prodejniCena: "Prodejní cena",
  datumProdeje: "Datum prodeje",
  oznacitProdano: "Označit jako prodané",
  zrusit: "Zrušit",
  datum: "Datum",

  novyAutoNazev: "Název auta",
  vytvoritAuto: "Vytvořit auto",
  zalozitProjekt: "Nový projekt — auto",
  upravit: "Upravit",
  ukoly: "Úkoly",
  novyUkol: "Co je potřeba udělat...",
  zadneUkoly: "Zatím žádné úkoly.",
};

const SK: typeof CS = {
  mena: "€",
  nastaveni: "Nastavenia",
  nastaveniBota: "Nastavenia bota",
  filtryHledani: "Filtre hľadania",
  mojeAuta: "Moje autá",
  odhlasit: "Odhlásiť",

  prihlasit: "Prihlásiť",
  registrovat: "Registrovať",
  email: "E-mail",
  heslo: "Heslo",
  pracuji: "Pracujem...",
  prihlasitSe: "Prihlásiť sa",
  vytvoritUcet: "Vytvoriť účet",
  registraceOk: "Registrácia OK. Ak projekt vyžaduje potvrdenie e-mailu, skontroluj schránku, inak sa hneď prihlás.",
  inviteKod: "Invite kód",
  pristupVyprsel: "Prístup vypršal. Pre predĺženie kontaktuj administrátora.",
  nemasInviteKod: "Nemáš ešte svoj invite kód? Pripoj sa na Discord.",
  dniDoVyprseniPredlozka: "dní do vypršania",
  vyprsiDnes: "Prístup vyprší dnes",

  telegramBot: "Telegram bot",
  aktivni: "aktívny",
  pozastaveno: "pozastavené",
  tokenBota: "Token bota",
  tvojeChatId: "Tvoje chat ID",
  navodBota: "Ako vytvoriť bota",
  navodVideoPopisek: "Písaný návod (mená botov) nájdeš v popise videa na YouTube.",
  dalsiPrijemci: "Ďalší príjemcovia (chat ID, čiarkou)",
  testSpojeni: "Test spojenia",
  testuji: "Testujem...",
  botAktivni: "Zapnúť / vypnúť bota",
  posledniKontrola: "Posledná kontrola",
  nikdyNebehl: "ešte neprebehla",
  predMinutami: "pred {n} min",
  predHodinami: "pred {n} h",
  vyplnTokenChatId: "Vyplň prosím token aj chat ID.",
  botBezi: "✅ Bot beží a hľadá",
  botCekaPrvniKontrola: "Bot je zapnutý, čaká na prvú kontrolu (do ~15 min).",
  botDlouhoBezKontroly: "⚠️ Dlho neprebehla kontrola – skontroluj token/chat ID.",
  botVypnuty: "Bot je vypnutý.",
  trh: "Trh",
  trhCesko: "🇨🇿 Česko",
  trhSlovensko: "🇸🇰 Slovensko",
  trhKratceCz: "CS-CZK",
  trhKratceSk: "SK-EUR",
  trhInfo: "SK-EUR: bot hľadá a porovnáva ceny na slovenskom trhu (bazos.sk) v euro. CS-CZK: český trh (bazos.cz) v Kč.",

  prehled: "Prehľad",
  celkovyZisk: "Celkový zisk z predaných áut",
  pocetAutCelkem: "Áut celkom",
  celkoveNaklady: "Celkové náklady",
  prumernyZiskAuto: "Priemerný zisk na auto",
  prumernaDobaDrzeni: "Priemerná doba držania",
  dniZkratka: "dní",
  otevreneUkoly: "Otvorené úlohy",
  aiLimityNadpis: "AI limity tento mesiac",

  najdiTed: "Nájsť teraz",
  najdiTedSpoustim: "Spúšťam...",
  najdiTedSpusteno: "Hľadám podľa filtrov, výsledok prijde na Telegram za chvíľu.",
  najdiTedBezi: "🔎 Hľadám podľa filtrov... môže to trvať niekoľko minút.",
  najdiTedHotovo: "✅ Hotovo, skontroluj Telegram.",
  najdiTedChyba: "❌ Niečo sa nepodarilo, skús to znova.",
  najdiTedCooldown: "Skús to znova za",
  najdiTedMinut: "min",

  zdrojoveTrhy: "Zdrojové trhy",
  zdrojoveTrhyInfo: "Odkiaľ sa majú stahovať inzeráty na posúdenie.",
  zadnyZdrojVarovani: "⚠️ Nie je vybraný žiadny zdrojový trh – bot nič nenájde.",
  oblastNepouzitaVarovani: "⚠️ Zdroj {zeme} nie je zapnutý vyššie, táto oblasť sa nepoužije.",
  cenaOdDoVarovani: "⚠️ Cena „od“ je vyššia než „do“.",
  rokVBudoucnostiVarovani: "⚠️ Rok je v budúcnosti.",
  zdrojPolsko: "Poľsko - Otomoto",
  zdrojCesko: "Česko - Bazoš.cz",
  zdrojSlovensko: "Slovensko - Bazoš.sk",
  zdrojNemecko: "Nemecko - AutoScout24",
  zdrojRakousko: "Rakúsko - Willhaben",
  zdrojItalie: "Taliansko - AutoScout24",
  cenaCzOd: "Cena ČR od (Kč)",
  cenaCzDo: "Cena ČR do (Kč)",
  cenaSkOd: "Cena SK od (EUR)",
  cenaSkDo: "Cena SK do (EUR)",
  cenaZahranicniOd: "Cena DE/AT/IT od (EUR)",
  cenaZahranicniDo: "Cena DE/AT/IT do (EUR)",
  celySpolkovyKraj: "Celý spolkový kraj",
  zeme: "Krajina",

  filtryAut: "Filtre áut",
  znacky: "Značky",
  vybrano: "vybraných",
  hledatZnacku: "hľadať značku...",
  zadnaZnacka: "Žiadna značka nezodpovedá hľadaniu.",
  dalsiZnacky: "Ďalšie značky, čo v zozname nie sú (čiarkou, malými písmenami)",
  palivo: "Palivo",
  vse: "všetko",
  benzin: "benzín",
  diesel: "diesel",
  prevodovka: "Prevodovka",
  manual: "manuál",
  automat: "automat",
  rokOd: "Rok od",
  maxNajezdDiesel: "Max nájazd diesel (km)",
  maxNajezdBenzin: "Max nájazd benzín (km)",
  cenaPlOd: "Cena PL od (PLN)",
  cenaPlDo: "Cena PL do (PLN)",
  oblasti: "Oblasti (prázdne = celý trh) – klikni do mapy, vznikne nová oblasť. Farba pinu podľa krajiny (zelená PL, modrá ČR, oranžová SK).",
  nazev: "Názov",
  okruhKm: "Okruh (km)",
  smazat: "Vymazať",
  pridatOblast: "+ Pridať oblasť",

  ziskovost: "Ziskovosť",
  minimalniZisk: "Minimálny zisk",
  nakladyDovoz: "Predpokladané náklady",
  minSrovnatelnych: "Min. porovnateľných inzerátov",
  ulozitNastaveni: "Uložiť nastavenia",
  ukladam: "Ukladám...",
  ulozeno: "Uložené.",
  chybaUkladani: "Chyba pri ukladaní: ",
  testOk: "Test OK, správa odoslaná na Telegram.",
  telegramChyba: "Telegram chyba: ",
  neznama: "neznáma",
  chybaSite: "Chyba siete: ",

  pridatAuto: "+ Pridať auto",
  vytvarim: "Vytváram...",
  zadneAuto: 'Zatiaľ žiadne auto. Klikni na "+ Pridať auto".',
  bezNazvu: "Bez názvu",
  koupeno: "kúpené",
  vInzerci: "v inzercii",
  prodano: "predané",
  koupenoZa: "Kúpené za",
  naklady: "Náklady",
  zisk: "Zisk",
  vazanyKapital: "Viazaný kapitál",
  prodanoZa: "Predané za",
  celkemVAute: "Celkom v aute",
  ziskZtrata: "Zisk / Strata",
  porizeni: "Obstaranie",
  dobaProdeje: "Doba predaja",
  dni: "dní",
  najezd: "Nájazd",

  zakladniInfo: "Základné info",
  nazevModel: "Názov / model",
  stav: "Stav",
  linkOtomoto: "Link na Otomoto inzerát",
  aiRozbor: "🤖 AI rozbor inzerátu",
  aiRozborNadpis: "AI rozbor",
  aiHistorie: "História rozborov",
  zadneRozbory: "Zatiaľ žiadny rozbor.",
  vlozLink: "Vlož link na inzerát (Otomoto, Bazoš.cz/sk, AutoScout24, Willhaben)",
  spustitRozbor: "Spustiť rozbor",
  analyzuji: "Analyzujem...",
  aiRozborProbiha: "Rozbor prebieha – AI analyzuje dáta, vyčkaj na výsledok (môže trvať aj 30 s).",
  aiVyuzitoZLimitu: "rozborov využitých tento mesiac",
  aiLimitDosazen: "Dosiahol si mesačný limit AI rozborov. Limit sa obnoví budúci mesiac.",
  aiDisclaimer: `⚠️ Skôr než vyrazíte pre auto: Ako správne chápať túto AI analýzu?
Tento rozbor je skvelý parťák, ale umelá inteligencia je stále len stroj, ktorý auto fyzicky nevidel a vychádza len z textu inzerátu, všeobecných technických dát a často hlásených závad.

Majte preto na pamäti, že AI:
❌ Nevidí realitu: Vychádza len z toho, čo predajca v inzeráte priznal (alebo zámerne zamlčal).
❌ Nepozná históriu: Neodhalí stočené kilometre, zamaskovanú nehodu ani zanedbaný servis tohto konkrétneho kusu.

Ako s tým správne naložiť?
Použite tento rozbor ako super prípravu a vždy si overujte dáta z viacerých zdrojov – aj AI môže na niečo zabudnúť, prípadne povedať niečo, čo pri danom modeli nemusí byť presné. Uložte si body, na ktoré AI upozornila, a na mieste to skontrolujte.

ℹ️ Právna doložka: Výstupy generované týmto AI nástrojom majú čisto orientačný a informatívny charakter a nenahrádzajú profesionálnu technickú inšpekciu. Rozhodnutie o kúpe vozidla robíte výhradne na vlastné riziko a provozovateľ webu nenesie žiadnu zodpovednosť za prípadné vady vozidla, finančné straty alebo škody vzniknuté nákupom vozu.`,

  aiInzeratNadpis: "AI generátor inzerátu",
  rokVyroby: "Rok výroby",
  cena: "Cena",
  vykonKw: "Výkon (kW)",
  spotrebaKombinovana: "Kombinovaná spotreba (l/100km)",
  palivoBenzinLpg: "benzín + LPG",
  palivoBenzinCng: "benzín + CNG",
  palivoElektrina: "elektrina",
  palivoHybrid: "hybrid",
  palivoPluginHybrid: "plug-in hybrid",
  vinCislo: "VIN",
  aiInzeratNepovinne: "Vyplň, čo uznáš za vhodné.",
  aiInzeratProbiha: "Generujem inzerát – môže to trvať aj 30 s.",
  motor: "Motor",
  aiInzeratPoznamky: "Čo odporúčam v inzeráte spomenúť (výbava, stav exteriéru a interiéru, servis, závady, kolesá a pneumatiky, auto po detailingu a pre koho je auto vhodné)",
  generujInzerat: "Vygenerovať text",
  generuji: "Generujem...",
  vystupInzeratu: "Vygenerovaný text",
  zkopirovat: "Skopírovať",
  zkopirovano: "Skopírované!",
  aiInzeratVyuzitoZLimitu: "inzerátov využitých tento mesiac",
  aiInzeratLimitDosazen: "Dosiahol si mesačný limit AI inzerátov. Limit sa obnoví budúci mesiac.",
  aiInzeratDisclaimer: `🚀 Text je na svete! Než ho ale skopírujete na Bazoš...
Umelá inteligencia vám síce ušetrila veľa práce a napísala text, ale auto nepozná tak dobre ako vy. Pred publikovaním inzerátu si text prosím pozorne prečítajte a skontrolujte.

Na čo si dať najväčší pozor?

🔍 Skutočný stav: Zodpovedá text realite? Ak AI napísala „perfektný stav laku", ale na aute je škrabanec cez celé dvere, radšej to upravte. Úprimnosť predáva najlepšie.

🛠️ Výbava a motor: Skontrolujte, či AI omylom nepridala výbavu, ktorú vaše auto nemá (napr. panoramatickú strechu alebo iný typ prevodovky).

📝 Pravopis mien a názvov: Občas môže AI pomýliť konkrétny názov motorizácie alebo výbavového stupňa.

ℹ️ Právna doložka: Tento text bol vygenerovaný umelou inteligenciou. Provozovateľ webu nezodpovedá za správnosť, pravdivosť ani úplnosť vygenerovaného inzerátu. Ako predajca nesiete plnú zodpovednosť za to, že informácie, ktoré o vozidle zverejníte, zodpovedajú skutočnému stavu.`,

  aiMechanikNadpis: "AI pre mechanikov",
  mechZnacka: "Značka",
  mechModel: "Model",
  mechMotor: "Motor (napr. 1.6 TDI)",
  vyplnUdajeAuta: "Vyplň značku, model, rok, motor a výkon, aby AI presne vedela, s čím pracuje.",
  zacniChat: "Začať chat",
  napisOtazku: "Napíš otázku...",
  odeslat: "Odoslať",
  novyAutoDoChatu: "Nové auto",
  mechAsistent: "AI mechanik",
  aiMechanikVyuzitoZLimitu: "nových chatov využitých tento mesiac",
  aiMechanikLimitDosazen: "Dosiahol si mesačný limit nových chatov. Limit sa obnoví budúci mesiac - staré chaty si ale stále môžeš otvoriť a pokračovať v nich.",
  aiMechanikProbiha: "Mechanik rozmýšľa – môže to trvať aj 30 s.",
  aiMechanikHistorie: "História chatov",
  pokracovatVChatu: "Pokračovať",
  aiMechanikDisclaimer: `🛠️ Na čo je tento AI asistent skvele použiteľný?
Umelá inteligencia je fantastický partner na brainstorming a rýchlu diagnostiku. Dokáže vám ušetriť hodiny tápania, pretože:

✅ Spája symptómy: Zadáte jej chybové kódy spolu s tým, ako sa auto správa (napr. cuká za studena, stráca tlak), a ona vám okamžite vypľuje zoznam najčastejších príčin.

✅ Pozná typické bolesti áut: Vie, čo pri konkrétnych modeloch a motoroch odchádza najčastejšie (napr. „pri tomto nájazde na tomto motore často odchádza podtlaková regulácia turba"). Máte tak hneď tip, na čo sa zamerať najskôr.

✅ Poradí s logickým postupom: Navrhne vám efektívny postup merania a testovania, aby ste nemuseli meniť diely metódou pokus-omyl.

🛑 STOP! Ale pozor na tvrdé dáta:
Tento AI asistent slúži výhradne ako myšlienková inšpirácia, kde začať hľadať závadu, keď už si neviete rady s diagnostikou. Nikdy ho nepoužívajte ako zdroj technických dát!

Čo od AI NIKDY nebrať vážne:

❌ Uťahovacie momenty: AI si čísla a Newtonmetre často vymýšľa alebo pletie modely. Hrozí strhnutie závitov alebo zničenie dielov.

❌ Elektrické schémy a piny: Farby drôtov, čísla pinov a schémy zapojenia musíte brať ako neoverené. Stačí jeden prehodený pin a odpálite riadiacu jednotku.

❌ Servisné postupy (rozvody a pod.): Presné postupy montáže a nastavenia motora z AI nie je možné považovať za bezpečné.

🛠️ Zlaté pravidlo: Všetky uťahovacie momenty, schémy a presné postupy si vždy a bezvýhradne overte a porovnajte z viacerých nezávislých zdrojov a oficiálnych dielenských príručiek (Autodata, Vivid, ElsaWin, TecRMI atď.) podľa konkrétneho kódu motora a VIN. Spoliehať sa len na jeden zdroj informácií, nieto na AI, je v dielni obrovský hazard.

ℹ️ Právna doložka: Provozovateľ webu dôrazne varuje pred slepým nasledovaním technických hodnôt vygenerovaných AI. Dáta sú bez záruky. Za akékoľvek škody na vozidle, zničené diely alebo finančné straty spôsobené nesprávnym postupom nesie plnú zodpovednosť mechanik vykonávajúci opravu.`,
  pridatDoPoznamek: "Pridať do poznámok",
  cenaKoupeno: "Cena kúpené",
  cenaProdano: "Cena predané",
  datumKoupeno: "Dátum kúpenia",
  datumProdano: "Dátum predaja",
  poznamky: "Poznámky",
  poznamkyPlaceholder: "Napíš si sem čokoľvek k tomuto autu...",
  ulozit: "Uložiť",
  celkem: "celkom",
  popisNakladu: "Popis (napr. Doprava, STK, poistka)",
  castka: "Suma",
  pridat: "+ Pridať",
  smazatMale: "vymazať",
  cistyZisk: "Čistý zisk:",
  fotky: "Fotky",
  pridatFotky: "+ Pridať fotky",
  nahravam: "Nahrávam...",
  zpetNaAuta: "← Späť na moje autá",
  smazatAuto: "Vymazať auto",
  potvrditSmazani: "Vymazať toto auto aj so všetkými nákladmi a fotkami?",

  prodatAuto: "Predať auto",
  zrusitProdej: "Zrušiť predaj",
  prodejniCena: "Predajná cena",
  datumProdeje: "Dátum predaja",
  oznacitProdano: "Označiť ako predané",
  zrusit: "Zrušiť",
  datum: "Dátum",

  novyAutoNazev: "Názov auta",
  vytvoritAuto: "Vytvoriť auto",
  zalozitProjekt: "Nový projekt — auto",
  upravit: "Upraviť",
  ukoly: "Úlohy",
  novyUkol: "Čo treba urobiť...",
  zadneUkoly: "Zatiaľ žiadne úlohy.",
};

const I18N: Record<Trh, typeof CS> = { cz: CS, sk: SK };

export function T(trh: string | null | undefined): typeof CS {
  return I18N[(trh as Trh) ?? "cz"] ?? CS;
}
