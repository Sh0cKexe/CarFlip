// Typy a data pro výběr značek + modelů + generací v filtrech hledání.
// slug = canonical slug (Otomoto + Bazos), as24 = AutoScout24 pokud se liší.

export type ModelSelekce = {
  slug: string;
  rokOd?: number;
  rokDo?: number;
  generaceLabel?: string;
};

export type ZnackaFiltr = { znacka: string; modely: ModelSelekce[] };

export type ModelDef = {
  slug: string;
  label: string;
  as24?: string;
  generace?: { label: string; rokOd: number; rokDo: number }[];
};

type ZnackaDef = {
  slug: string;
  label: string;
  modely: ModelDef[];
};

export const ZNACKY_S_MODELY: ZnackaDef[] = [
  {
    slug: "abarth", label: "Abarth",
    modely: [
      { slug: "500", label: "500" }, { slug: "595", label: "595" },
      { slug: "695", label: "695" }, { slug: "punto-evo", label: "Punto Evo" },
      { slug: "124-spider", label: "124 Spider" },
    ],
  },
  {
    slug: "alfa-romeo", label: "Alfa Romeo",
    modely: [
      { slug: "147", label: "147" }, { slug: "156", label: "156" },
      { slug: "159", label: "159" }, { slug: "166", label: "166" },
      { slug: "gt", label: "GT" }, { slug: "brera", label: "Brera" },
      { slug: "spider", label: "Spider" }, { slug: "mito", label: "MiTo" },
      { slug: "giulietta", label: "Giulietta" }, { slug: "giulia", label: "Giulia" },
      { slug: "stelvio", label: "Stelvio" }, { slug: "tonale", label: "Tonale" },
    ],
  },
  {
    slug: "alpine", label: "Alpine",
    modely: [
      { slug: "a110", label: "A110" },
    ],
  },
  {
    slug: "aston-martin", label: "Aston Martin",
    modely: [
      { slug: "db9", label: "DB9" }, { slug: "db11", label: "DB11" },
      { slug: "vantage", label: "Vantage" }, { slug: "dbs", label: "DBS" },
      { slug: "dbx", label: "DBX" },
    ],
  },
  {
    slug: "audi", label: "Audi",
    modely: [
      { slug: "a1", label: "A1" },
      {
        slug: "a3", label: "A3",
        generace: [
          { label: "8L", rokOd: 1996, rokDo: 2003 },
          { label: "8P", rokOd: 2003, rokDo: 2013 },
          { label: "8V", rokOd: 2012, rokDo: 2021 },
          { label: "8Y", rokOd: 2020, rokDo: 2025 },
        ],
      },
      {
        slug: "a4", label: "A4",
        generace: [
          { label: "B5", rokOd: 1994, rokDo: 2001 },
          { label: "B6", rokOd: 2000, rokDo: 2006 },
          { label: "B7", rokOd: 2004, rokDo: 2009 },
          { label: "B8", rokOd: 2007, rokDo: 2015 },
          { label: "B9", rokOd: 2015, rokDo: 2025 },
        ],
      },
      { slug: "a5", label: "A5" },
      {
        slug: "a6", label: "A6",
        generace: [
          { label: "C5", rokOd: 1997, rokDo: 2005 },
          { label: "C6", rokOd: 2004, rokDo: 2011 },
          { label: "C7", rokOd: 2011, rokDo: 2018 },
          { label: "C8", rokOd: 2018, rokDo: 2025 },
        ],
      },
      { slug: "a7", label: "A7" }, { slug: "a8", label: "A8" },
      { slug: "q2", label: "Q2" }, { slug: "q3", label: "Q3" },
      { slug: "q5", label: "Q5" }, { slug: "q7", label: "Q7" },
      { slug: "q8", label: "Q8" }, { slug: "tt", label: "TT" },
      { slug: "r8", label: "R8" }, { slug: "e-tron", label: "e-tron" },
    ],
  },
  {
    slug: "bentley", label: "Bentley",
    modely: [
      { slug: "continental", label: "Continental" },
      { slug: "flying-spur", label: "Flying Spur" },
      { slug: "bentayga", label: "Bentayga" },
      { slug: "mulsanne", label: "Mulsanne" },
    ],
  },
  {
    slug: "bmw", label: "BMW",
    modely: [
      {
        slug: "seria-1", label: "Řada 1", as24: "1er",
        generace: [
          { label: "E87", rokOd: 2004, rokDo: 2011 },
          { label: "F20", rokOd: 2011, rokDo: 2019 },
          { label: "F40", rokOd: 2019, rokDo: 2025 },
        ],
      },
      { slug: "seria-2", label: "Řada 2", as24: "2er" },
      {
        slug: "seria-3", label: "Řada 3", as24: "3er",
        generace: [
          { label: "E46", rokOd: 1998, rokDo: 2006 },
          { label: "E90", rokOd: 2005, rokDo: 2012 },
          { label: "F30", rokOd: 2012, rokDo: 2019 },
          { label: "G20", rokOd: 2019, rokDo: 2025 },
        ],
      },
      { slug: "seria-4", label: "Řada 4", as24: "4er" },
      {
        slug: "seria-5", label: "Řada 5", as24: "5er",
        generace: [
          { label: "E39", rokOd: 1995, rokDo: 2004 },
          { label: "E60", rokOd: 2003, rokDo: 2010 },
          { label: "F10", rokOd: 2010, rokDo: 2017 },
          { label: "G30", rokOd: 2017, rokDo: 2025 },
        ],
      },
      { slug: "seria-6", label: "Řada 6", as24: "6er" },
      { slug: "seria-7", label: "Řada 7", as24: "7er" },
      { slug: "x1", label: "X1" }, { slug: "x2", label: "X2" },
      {
        slug: "x3", label: "X3",
        generace: [
          { label: "E83", rokOd: 2003, rokDo: 2010 },
          { label: "F25", rokOd: 2010, rokDo: 2017 },
          { label: "G01", rokOd: 2017, rokDo: 2025 },
        ],
      },
      { slug: "x4", label: "X4" },
      {
        slug: "x5", label: "X5",
        generace: [
          { label: "E53", rokOd: 1999, rokDo: 2006 },
          { label: "E70", rokOd: 2006, rokDo: 2013 },
          { label: "F15", rokOd: 2013, rokDo: 2019 },
          { label: "G05", rokOd: 2018, rokDo: 2025 },
        ],
      },
      { slug: "x6", label: "X6" }, { slug: "z4", label: "Z4" },
      { slug: "i3", label: "i3" }, { slug: "i4", label: "i4" }, { slug: "ix", label: "iX" },
    ],
  },
  {
    slug: "byd", label: "BYD",
    modely: [
      { slug: "atto-3", label: "Atto 3" }, { slug: "han", label: "Han" },
      { slug: "seal", label: "Seal" }, { slug: "dolphin", label: "Dolphin" },
      { slug: "tang", label: "Tang" }, { slug: "seagull", label: "Seagull" },
    ],
  },
  {
    slug: "chevrolet", label: "Chevrolet",
    modely: [
      { slug: "aveo", label: "Aveo" }, { slug: "spark", label: "Spark" },
      { slug: "cruze", label: "Cruze" }, { slug: "malibu", label: "Malibu" },
      { slug: "captiva", label: "Captiva" }, { slug: "orlando", label: "Orlando" },
      { slug: "trax", label: "Trax" }, { slug: "trailblazer", label: "Trailblazer" },
      { slug: "camaro", label: "Camaro" }, { slug: "corvette", label: "Corvette" },
      { slug: "tahoe", label: "Tahoe" },
    ],
  },
  {
    slug: "citroen", label: "Citroën",
    modely: [
      { slug: "c1", label: "C1" }, { slug: "c2", label: "C2" },
      { slug: "c3", label: "C3" }, { slug: "c4", label: "C4" },
      { slug: "c5", label: "C5" }, { slug: "c3-aircross", label: "C3 Aircross" },
      { slug: "c4-picasso", label: "C4 Picasso" }, { slug: "c5-aircross", label: "C5 Aircross" },
      { slug: "berlingo", label: "Berlingo" }, { slug: "ds3", label: "DS3 (starý)" },
      { slug: "xsara", label: "Xsara" }, { slug: "saxo", label: "Saxo" },
    ],
  },
  {
    slug: "cupra", label: "CUPRA",
    modely: [
      { slug: "born", label: "Born" }, { slug: "formentor", label: "Formentor" },
      { slug: "leon", label: "Leon" }, { slug: "ateca", label: "Ateca" },
      { slug: "terramar", label: "Terramar" },
    ],
  },
  {
    slug: "dacia", label: "Dacia",
    modely: [
      { slug: "sandero", label: "Sandero" }, { slug: "logan", label: "Logan" },
      { slug: "duster", label: "Duster" }, { slug: "lodgy", label: "Lodgy" },
      { slug: "dokker", label: "Dokker" }, { slug: "jogger", label: "Jogger" },
      { slug: "spring", label: "Spring" },
    ],
  },
  {
    slug: "daewoo", label: "Daewoo",
    modely: [
      { slug: "matiz", label: "Matiz" }, { slug: "tico", label: "Tico" },
      { slug: "lanos", label: "Lanos" }, { slug: "nubira", label: "Nubira" },
      { slug: "lacetti", label: "Lacetti" }, { slug: "kalos", label: "Kalos" },
      { slug: "espero", label: "Espero" }, { slug: "leganza", label: "Leganza" },
    ],
  },
  {
    slug: "daihatsu", label: "Daihatsu",
    modely: [
      { slug: "cuore", label: "Cuore" }, { slug: "sirion", label: "Sirion" },
      { slug: "terios", label: "Terios" }, { slug: "copen", label: "Copen" },
      { slug: "materia", label: "Materia" },
    ],
  },
  {
    slug: "dodge", label: "Dodge",
    modely: [
      { slug: "caliber", label: "Caliber" }, { slug: "journey", label: "Journey" },
      { slug: "charger", label: "Charger" }, { slug: "challenger", label: "Challenger" },
      { slug: "nitro", label: "Nitro" }, { slug: "durango", label: "Durango" },
      { slug: "avenger", label: "Avenger" },
    ],
  },
  {
    slug: "ds-automobiles", label: "DS Automobiles",
    modely: [
      { slug: "ds3", label: "DS3" }, { slug: "ds4", label: "DS4" },
      { slug: "ds5", label: "DS5" }, { slug: "ds7", label: "DS7" },
      { slug: "ds9", label: "DS9" },
    ],
  },
  {
    slug: "ferrari", label: "Ferrari",
    modely: [
      { slug: "458", label: "458" }, { slug: "488", label: "488" },
      { slug: "f8", label: "F8" }, { slug: "portofino", label: "Portofino" },
      { slug: "roma", label: "Roma" }, { slug: "sf90", label: "SF90" },
      { slug: "california", label: "California" },
    ],
  },
  {
    slug: "fiat", label: "Fiat",
    modely: [
      { slug: "panda", label: "Panda" }, { slug: "punto", label: "Punto" },
      { slug: "grande-punto", label: "Grande Punto" }, { slug: "stilo", label: "Stilo" },
      { slug: "bravo", label: "Bravo" }, { slug: "tipo", label: "Tipo" },
      { slug: "500", label: "500" }, { slug: "500x", label: "500X" },
      { slug: "500l", label: "500L" }, { slug: "doblo", label: "Doblò" },
      { slug: "sedici", label: "Sedici" }, { slug: "freemont", label: "Freemont" },
    ],
  },
  {
    slug: "ford", label: "Ford",
    modely: [
      {
        slug: "fiesta", label: "Fiesta",
        generace: [
          { label: "Mk5", rokOd: 2001, rokDo: 2008 },
          { label: "Mk6", rokOd: 2008, rokDo: 2017 },
          { label: "Mk7", rokOd: 2017, rokDo: 2025 },
        ],
      },
      {
        slug: "focus", label: "Focus",
        generace: [
          { label: "Mk1", rokOd: 1998, rokDo: 2004 },
          { label: "Mk2", rokOd: 2004, rokDo: 2011 },
          { label: "Mk3", rokOd: 2011, rokDo: 2018 },
          { label: "Mk4", rokOd: 2018, rokDo: 2025 },
        ],
      },
      { slug: "mondeo", label: "Mondeo" }, { slug: "kuga", label: "Kuga" },
      { slug: "puma", label: "Puma" }, { slug: "edge", label: "Edge" },
      { slug: "galaxy", label: "Galaxy" }, { slug: "s-max", label: "S-Max" },
      { slug: "ranger", label: "Ranger" }, { slug: "mustang", label: "Mustang" },
      { slug: "ecosport", label: "EcoSport" }, { slug: "fusion", label: "Fusion" },
    ],
  },
  {
    slug: "honda", label: "Honda",
    modely: [
      { slug: "jazz", label: "Jazz" }, { slug: "civic", label: "Civic" },
      { slug: "accord", label: "Accord" }, { slug: "cr-v", label: "CR-V" },
      { slug: "hr-v", label: "HR-V" }, { slug: "fr-v", label: "FR-V" },
      { slug: "legend", label: "Legend" }, { slug: "element", label: "Element" },
      { slug: "insight", label: "Insight" }, { slug: "e", label: "e" },
    ],
  },
  {
    slug: "hummer", label: "Hummer",
    modely: [
      { slug: "h2", label: "H2" }, { slug: "h3", label: "H3" },
    ],
  },
  {
    slug: "hyundai", label: "Hyundai",
    modely: [
      { slug: "i10", label: "i10" }, { slug: "i20", label: "i20" },
      {
        slug: "i30", label: "i30",
        generace: [
          { label: "Mk1", rokOd: 2007, rokDo: 2012 },
          { label: "Mk2", rokOd: 2011, rokDo: 2017 },
          { label: "Mk3", rokOd: 2017, rokDo: 2025 },
        ],
      },
      { slug: "i40", label: "i40" }, { slug: "ix20", label: "ix20" },
      { slug: "ix35", label: "ix35" }, { slug: "tucson", label: "Tucson" },
      { slug: "kona", label: "Kona" }, { slug: "santa-fe", label: "Santa Fe" },
      { slug: "ioniq", label: "Ioniq" }, { slug: "ioniq-5", label: "Ioniq 5" },
      { slug: "ioniq-6", label: "Ioniq 6" }, { slug: "accent", label: "Accent" },
      { slug: "getz", label: "Getz" },
    ],
  },
  {
    slug: "infiniti", label: "Infiniti",
    modely: [
      { slug: "q30", label: "Q30" }, { slug: "q50", label: "Q50" },
      { slug: "q60", label: "Q60" }, { slug: "qx30", label: "QX30" },
      { slug: "qx50", label: "QX50" }, { slug: "qx70", label: "QX70" },
      { slug: "fx", label: "FX" },
    ],
  },
  {
    slug: "isuzu", label: "Isuzu",
    modely: [
      { slug: "d-max", label: "D-Max" }, { slug: "trooper", label: "Trooper" },
    ],
  },
  {
    slug: "jaguar", label: "Jaguar",
    modely: [
      { slug: "xe", label: "XE" }, { slug: "xf", label: "XF" },
      { slug: "xj", label: "XJ" }, { slug: "e-pace", label: "E-Pace" },
      { slug: "f-pace", label: "F-Pace" }, { slug: "f-type", label: "F-Type" },
      { slug: "i-pace", label: "I-Pace" }, { slug: "s-type", label: "S-Type" },
      { slug: "x-type", label: "X-Type" },
    ],
  },
  {
    slug: "jeep", label: "Jeep",
    modely: [
      { slug: "renegade", label: "Renegade" }, { slug: "compass", label: "Compass" },
      { slug: "cherokee", label: "Cherokee" }, { slug: "grand-cherokee", label: "Grand Cherokee" },
      { slug: "wrangler", label: "Wrangler" }, { slug: "avenger", label: "Avenger" },
      { slug: "gladiator", label: "Gladiator" }, { slug: "commander", label: "Commander" },
    ],
  },
  {
    slug: "kia", label: "Kia",
    modely: [
      { slug: "picanto", label: "Picanto" }, { slug: "rio", label: "Rio" },
      { slug: "ceed", label: "Ceed" }, { slug: "sportage", label: "Sportage" },
      { slug: "sorento", label: "Sorento" }, { slug: "soul", label: "Soul" },
      { slug: "niro", label: "Niro" }, { slug: "stinger", label: "Stinger" },
      { slug: "optima", label: "Optima" }, { slug: "xceed", label: "XCeed" },
      { slug: "ev6", label: "EV6" }, { slug: "carens", label: "Carens" },
      { slug: "venga", label: "Venga" },
    ],
  },
  {
    slug: "lada", label: "Lada",
    modely: [
      { slug: "vesta", label: "Vesta" }, { slug: "granta", label: "Granta" },
      { slug: "largus", label: "Largus" }, { slug: "niva", label: "Niva" },
      { slug: "kalina", label: "Kalina" }, { slug: "priora", label: "Priora" },
      { slug: "2101", label: "2101 (Žiguľ)" }, { slug: "2107", label: "2107" },
      { slug: "samara", label: "Samara" },
    ],
  },
  {
    slug: "lamborghini", label: "Lamborghini",
    modely: [
      { slug: "huracan", label: "Huracán" }, { slug: "aventador", label: "Aventador" },
      { slug: "urus", label: "Urus" }, { slug: "gallardo", label: "Gallardo" },
    ],
  },
  {
    slug: "lancia", label: "Lancia",
    modely: [
      { slug: "ypsilon", label: "Ypsilon" }, { slug: "musa", label: "Musa" },
      { slug: "delta", label: "Delta" }, { slug: "phedra", label: "Phedra" },
      { slug: "lybra", label: "Lybra" }, { slug: "thesis", label: "Thesis" },
    ],
  },
  {
    slug: "land-rover", label: "Land Rover",
    modely: [
      { slug: "defender", label: "Defender" }, { slug: "discovery", label: "Discovery" },
      { slug: "discovery-sport", label: "Discovery Sport" },
      { slug: "freelander", label: "Freelander" },
      { slug: "range-rover", label: "Range Rover" },
      { slug: "range-rover-evoque", label: "Range Rover Evoque" },
      { slug: "range-rover-sport", label: "Range Rover Sport" },
      { slug: "range-rover-velar", label: "Range Rover Velar" },
    ],
  },
  {
    slug: "leapmotor", label: "Leapmotor",
    modely: [
      { slug: "t03", label: "T03" }, { slug: "c10", label: "C10" },
    ],
  },
  {
    slug: "lexus", label: "Lexus",
    modely: [
      { slug: "ct", label: "CT 200h" }, { slug: "is", label: "IS" },
      { slug: "gs", label: "GS" }, { slug: "ls", label: "LS" },
      { slug: "es", label: "ES" }, { slug: "nx", label: "NX" },
      { slug: "rx", label: "RX" }, { slug: "ux", label: "UX" },
      { slug: "lc", label: "LC" }, { slug: "rc", label: "RC" },
      { slug: "rz", label: "RZ" },
    ],
  },
  {
    slug: "lotus", label: "Lotus",
    modely: [
      { slug: "elise", label: "Elise" }, { slug: "exige", label: "Exige" },
      { slug: "evora", label: "Evora" }, { slug: "emira", label: "Emira" },
    ],
  },
  {
    slug: "maserati", label: "Maserati",
    modely: [
      { slug: "ghibli", label: "Ghibli" }, { slug: "granturismo", label: "GranTurismo" },
      { slug: "levante", label: "Levante" }, { slug: "quattroporte", label: "Quattroporte" },
      { slug: "grecale", label: "Grecale" },
    ],
  },
  {
    slug: "mazda", label: "Mazda",
    modely: [
      { slug: "mazda2", label: "Mazda2" },
      {
        slug: "mazda3", label: "Mazda3",
        generace: [
          { label: "BK", rokOd: 2003, rokDo: 2009 },
          { label: "BL", rokOd: 2009, rokDo: 2014 },
          { label: "BM", rokOd: 2013, rokDo: 2019 },
          { label: "BP", rokOd: 2019, rokDo: 2025 },
        ],
      },
      { slug: "mazda6", label: "Mazda6" }, { slug: "cx-3", label: "CX-3" },
      { slug: "cx-5", label: "CX-5" }, { slug: "cx-30", label: "CX-30" },
      { slug: "mx-5", label: "MX-5" }, { slug: "cx-60", label: "CX-60" },
    ],
  },
  {
    slug: "mercedes-benz", label: "Mercedes-Benz",
    modely: [
      { slug: "klasa-a", label: "Třída A", as24: "a-klasse" },
      { slug: "klasa-b", label: "Třída B", as24: "b-klasse" },
      { slug: "klasa-c", label: "Třída C", as24: "c-klasse" },
      { slug: "klasa-e", label: "Třída E", as24: "e-klasse" },
      { slug: "klasa-s", label: "Třída S", as24: "s-klasse" },
      { slug: "cla", label: "CLA" }, { slug: "cle", label: "CLE" },
      { slug: "gla", label: "GLA" }, { slug: "glb", label: "GLB" },
      { slug: "glc", label: "GLC" }, { slug: "gle", label: "GLE" },
      { slug: "slk", label: "SLK" }, { slug: "sl", label: "SL" },
      { slug: "eqa", label: "EQA" }, { slug: "eqb", label: "EQB" },
      { slug: "eqc", label: "EQC" },
    ],
  },
  {
    slug: "mg", label: "MG",
    modely: [
      { slug: "3", label: "MG3" }, { slug: "4", label: "MG4" },
      { slug: "5", label: "MG5" }, { slug: "zs", label: "ZS" },
      { slug: "hs", label: "HS" }, { slug: "marvel-r", label: "Marvel R" },
    ],
  },
  {
    slug: "mini", label: "MINI",
    modely: [
      { slug: "mini", label: "Mini Hatch" }, { slug: "countryman", label: "Countryman" },
      { slug: "clubman", label: "Clubman" }, { slug: "cabrio", label: "Cabrio" },
      { slug: "paceman", label: "Paceman" }, { slug: "coupe", label: "Coupé" },
      { slug: "roadster", label: "Roadster" },
    ],
  },
  {
    slug: "mitsubishi", label: "Mitsubishi",
    modely: [
      { slug: "lancer", label: "Lancer" }, { slug: "outlander", label: "Outlander" },
      { slug: "asx", label: "ASX" }, { slug: "pajero", label: "Pajero" },
      { slug: "eclipse-cross", label: "Eclipse Cross" }, { slug: "colt", label: "Colt" },
      { slug: "carisma", label: "Carisma" }, { slug: "galant", label: "Galant" },
      { slug: "space-star", label: "Space Star" },
    ],
  },
  {
    slug: "nissan", label: "Nissan",
    modely: [
      { slug: "micra", label: "Micra" }, { slug: "juke", label: "Juke" },
      { slug: "qashqai", label: "Qashqai" }, { slug: "x-trail", label: "X-Trail" },
      { slug: "leaf", label: "Leaf" }, { slug: "navara", label: "Navara" },
      { slug: "note", label: "Note" }, { slug: "almera", label: "Almera" },
      { slug: "primera", label: "Primera" }, { slug: "pathfinder", label: "Pathfinder" },
      { slug: "ariya", label: "Ariya" },
    ],
  },
  {
    slug: "opel", label: "Opel",
    modely: [
      { slug: "corsa", label: "Corsa" },
      {
        slug: "astra", label: "Astra",
        generace: [
          { label: "G", rokOd: 1998, rokDo: 2005 },
          { label: "H", rokOd: 2004, rokDo: 2014 },
          { label: "J", rokOd: 2009, rokDo: 2016 },
          { label: "K", rokOd: 2015, rokDo: 2025 },
        ],
      },
      { slug: "vectra", label: "Vectra" }, { slug: "insignia", label: "Insignia" },
      { slug: "zafira", label: "Zafira" }, { slug: "mokka", label: "Mokka" },
      { slug: "crossland", label: "Crossland" }, { slug: "grandland", label: "Grandland" },
      { slug: "meriva", label: "Meriva" }, { slug: "antara", label: "Antara" },
      { slug: "agila", label: "Agila" }, { slug: "omega", label: "Omega" },
      { slug: "frontera", label: "Frontera" },
    ],
  },
  {
    slug: "peugeot", label: "Peugeot",
    modely: [
      { slug: "106", label: "106" }, { slug: "107", label: "107" },
      { slug: "206", label: "206" }, { slug: "207", label: "207" },
      { slug: "208", label: "208" }, { slug: "306", label: "306" },
      { slug: "307", label: "307" },
      {
        slug: "308", label: "308",
        generace: [
          { label: "Mk1", rokOd: 2007, rokDo: 2013 },
          { label: "Mk2", rokOd: 2013, rokDo: 2021 },
          { label: "Mk3", rokOd: 2021, rokDo: 2025 },
        ],
      },
      { slug: "407", label: "407" }, { slug: "408", label: "408" },
      { slug: "508", label: "508" }, { slug: "2008", label: "2008" },
      { slug: "3008", label: "3008" }, { slug: "5008", label: "5008" },
      { slug: "partner", label: "Partner" }, { slug: "rifter", label: "Rifter" },
    ],
  },
  {
    slug: "polestar", label: "Polestar",
    modely: [
      { slug: "1", label: "Polestar 1" }, { slug: "2", label: "Polestar 2" },
      { slug: "3", label: "Polestar 3" }, { slug: "4", label: "Polestar 4" },
    ],
  },
  {
    slug: "porsche", label: "Porsche",
    modely: [
      { slug: "911", label: "911" }, { slug: "boxster", label: "Boxster" },
      { slug: "cayman", label: "Cayman" }, { slug: "cayenne", label: "Cayenne" },
      { slug: "macan", label: "Macan" }, { slug: "panamera", label: "Panamera" },
      { slug: "taycan", label: "Taycan" },
    ],
  },
  {
    slug: "renault", label: "Renault",
    modely: [
      {
        slug: "clio", label: "Clio",
        generace: [
          { label: "II", rokOd: 1998, rokDo: 2005 },
          { label: "III", rokOd: 2005, rokDo: 2012 },
          { label: "IV", rokOd: 2012, rokDo: 2019 },
          { label: "V", rokOd: 2019, rokDo: 2025 },
        ],
      },
      {
        slug: "megane", label: "Mégane",
        generace: [
          { label: "II", rokOd: 2002, rokDo: 2009 },
          { label: "III", rokOd: 2008, rokDo: 2016 },
          { label: "IV", rokOd: 2016, rokDo: 2025 },
        ],
      },
      { slug: "laguna", label: "Laguna" }, { slug: "scenic", label: "Scénic" },
      { slug: "captur", label: "Captur" }, { slug: "kadjar", label: "Kadjar" },
      { slug: "koleos", label: "Koleos" }, { slug: "talisman", label: "Talisman" },
      { slug: "arkana", label: "Arkana" }, { slug: "zoe", label: "Zoé" },
      { slug: "twingo", label: "Twingo" }, { slug: "kangoo", label: "Kangoo" },
      { slug: "espace", label: "Espace" }, { slug: "symbol", label: "Symbol" },
    ],
  },
  {
    slug: "rolls-royce", label: "Rolls-Royce",
    modely: [
      { slug: "ghost", label: "Ghost" }, { slug: "phantom", label: "Phantom" },
      { slug: "wraith", label: "Wraith" }, { slug: "cullinan", label: "Cullinan" },
      { slug: "dawn", label: "Dawn" },
    ],
  },
  {
    slug: "rover", label: "Rover",
    modely: [
      { slug: "25", label: "25" }, { slug: "45", label: "45" },
      { slug: "75", label: "75" }, { slug: "200", label: "200" },
      { slug: "400", label: "400" },
    ],
  },
  {
    slug: "saab", label: "Saab",
    modely: [
      { slug: "9-3", label: "9-3" }, { slug: "9-5", label: "9-5" },
      { slug: "9-4x", label: "9-4X" },
    ],
  },
  {
    slug: "seat", label: "SEAT",
    modely: [
      { slug: "ibiza", label: "Ibiza" }, { slug: "leon", label: "Leon" },
      { slug: "toledo", label: "Toledo" }, { slug: "altea", label: "Altea" },
      { slug: "alhambra", label: "Alhambra" }, { slug: "arona", label: "Arona" },
      { slug: "ateca", label: "Ateca" }, { slug: "tarraco", label: "Tarraco" },
      { slug: "cordoba", label: "Córdoba" },
    ],
  },
  {
    slug: "skoda", label: "Škoda",
    modely: [
      { slug: "citigo", label: "Citigo" },
      {
        slug: "fabia", label: "Fabia",
        generace: [
          { label: "I", rokOd: 1999, rokDo: 2008 },
          { label: "II", rokOd: 2007, rokDo: 2015 },
          { label: "III", rokOd: 2014, rokDo: 2022 },
          { label: "IV", rokOd: 2021, rokDo: 2025 },
        ],
      },
      { slug: "rapid", label: "Rapid" }, { slug: "scala", label: "Scala" },
      {
        slug: "octavia", label: "Octavia",
        generace: [
          { label: "I", rokOd: 1996, rokDo: 2010 },
          { label: "II", rokOd: 2004, rokDo: 2013 },
          { label: "III", rokOd: 2012, rokDo: 2020 },
          { label: "IV", rokOd: 2019, rokDo: 2025 },
        ],
      },
      {
        slug: "superb", label: "Superb",
        generace: [
          { label: "I", rokOd: 2001, rokDo: 2008 },
          { label: "II", rokOd: 2008, rokDo: 2015 },
          { label: "III", rokOd: 2015, rokDo: 2025 },
        ],
      },
      { slug: "kamiq", label: "Kamiq" }, { slug: "karoq", label: "Karoq" },
      { slug: "kodiaq", label: "Kodiaq" }, { slug: "enyaq", label: "Enyaq" },
      { slug: "felicia", label: "Felicia" },
    ],
  },
  {
    slug: "smart", label: "Smart",
    modely: [
      { slug: "fortwo", label: "ForTwo" }, { slug: "forfour", label: "ForFour" },
      { slug: "smart-1", label: "#1" }, { slug: "smart-3", label: "#3" },
    ],
  },
  {
    slug: "ssangyong", label: "SsangYong",
    modely: [
      { slug: "tivoli", label: "Tivoli" }, { slug: "rexton", label: "Rexton" },
      { slug: "korando", label: "Korando" }, { slug: "musso", label: "Musso" },
      { slug: "actyon", label: "Actyon" }, { slug: "rodius", label: "Rodius" },
    ],
  },
  {
    slug: "subaru", label: "Subaru",
    modely: [
      { slug: "impreza", label: "Impreza" }, { slug: "legacy", label: "Legacy" },
      { slug: "outback", label: "Outback" }, { slug: "forester", label: "Forester" },
      { slug: "xv", label: "XV" }, { slug: "brz", label: "BRZ" },
      { slug: "levorg", label: "Levorg" }, { slug: "solterra", label: "Solterra" },
    ],
  },
  {
    slug: "suzuki", label: "Suzuki",
    modely: [
      { slug: "swift", label: "Swift" }, { slug: "baleno", label: "Baleno" },
      { slug: "vitara", label: "Vitara" }, { slug: "grand-vitara", label: "Grand Vitara" },
      { slug: "sx4", label: "SX4" }, { slug: "jimny", label: "Jimny" },
      { slug: "ignis", label: "Ignis" }, { slug: "across", label: "Across" },
      { slug: "swace", label: "Swace" }, { slug: "wagon-r", label: "Wagon R" },
    ],
  },
  {
    slug: "tesla", label: "Tesla",
    modely: [
      { slug: "model-3", label: "Model 3" }, { slug: "model-y", label: "Model Y" },
      { slug: "model-s", label: "Model S" }, { slug: "model-x", label: "Model X" },
    ],
  },
  {
    slug: "toyota", label: "Toyota",
    modely: [
      { slug: "aygo", label: "Aygo" },
      {
        slug: "yaris", label: "Yaris",
        generace: [
          { label: "XP10", rokOd: 1999, rokDo: 2005 },
          { label: "XP90", rokOd: 2005, rokDo: 2011 },
          { label: "XP130", rokOd: 2011, rokDo: 2020 },
          { label: "XP210", rokOd: 2020, rokDo: 2025 },
        ],
      },
      { slug: "auris", label: "Auris" },
      {
        slug: "corolla", label: "Corolla",
        generace: [
          { label: "E120", rokOd: 2001, rokDo: 2007 },
          { label: "E140", rokOd: 2007, rokDo: 2013 },
          { label: "E210", rokOd: 2018, rokDo: 2025 },
        ],
      },
      { slug: "camry", label: "Camry" }, { slug: "prius", label: "Prius" },
      { slug: "chr", label: "C-HR" }, { slug: "rav4", label: "RAV4" },
      { slug: "hilux", label: "Hilux" }, { slug: "land-cruiser", label: "Land Cruiser" },
      { slug: "avensis", label: "Avensis" }, { slug: "verso", label: "Verso" },
      { slug: "proace-city", label: "Proace City" }, { slug: "bz4x", label: "bZ4X" },
    ],
  },
  {
    slug: "volkswagen", label: "Volkswagen",
    modely: [
      { slug: "up", label: "up!" }, { slug: "polo", label: "Polo" },
      {
        slug: "golf", label: "Golf",
        generace: [
          { label: "Mk4", rokOd: 1997, rokDo: 2004 },
          { label: "Mk5", rokOd: 2003, rokDo: 2009 },
          { label: "Mk6", rokOd: 2008, rokDo: 2013 },
          { label: "Mk7", rokOd: 2012, rokDo: 2020 },
          { label: "Mk8", rokOd: 2019, rokDo: 2025 },
        ],
      },
      { slug: "jetta", label: "Jetta" },
      {
        slug: "passat", label: "Passat",
        generace: [
          { label: "B5", rokOd: 1996, rokDo: 2005 },
          { label: "B6", rokOd: 2005, rokDo: 2011 },
          { label: "B7", rokOd: 2010, rokDo: 2015 },
          { label: "B8", rokOd: 2014, rokDo: 2025 },
        ],
      },
      { slug: "arteon", label: "Arteon" }, { slug: "t-cross", label: "T-Cross" },
      { slug: "t-roc", label: "T-Roc" },
      {
        slug: "tiguan", label: "Tiguan",
        generace: [
          { label: "Mk1", rokOd: 2007, rokDo: 2016 },
          { label: "Mk2", rokOd: 2016, rokDo: 2025 },
        ],
      },
      { slug: "touareg", label: "Touareg" }, { slug: "touran", label: "Touran" },
      { slug: "sharan", label: "Sharan" }, { slug: "caddy", label: "Caddy" },
      { slug: "id-3", label: "ID.3" }, { slug: "id-4", label: "ID.4" },
      { slug: "id-5", label: "ID.5" },
    ],
  },
  {
    slug: "volvo", label: "Volvo",
    modely: [
      { slug: "c30", label: "C30" }, { slug: "v40", label: "V40" },
      { slug: "v60", label: "V60" }, { slug: "v70", label: "V70" },
      { slug: "v90", label: "V90" }, { slug: "s60", label: "S60" },
      { slug: "s90", label: "S90" }, { slug: "xc40", label: "XC40" },
      { slug: "xc60", label: "XC60" }, { slug: "xc90", label: "XC90" },
      { slug: "c40", label: "C40" }, { slug: "ex30", label: "EX30" },
      { slug: "s40", label: "S40" }, { slug: "s80", label: "S80" },
    ],
  },
];

export const MODELY_MAP = new Map<string, ZnackaDef>(
  ZNACKY_S_MODELY.map((z) => [z.slug, z])
);

// Slug mapping pro AutoScout24 + Willhaben (kde se liší od canonical/Otomoto).
export const AS24_MODEL_SLUG = Object.fromEntries(
  ZNACKY_S_MODELY.flatMap((z) =>
    z.modely.filter((m) => m.as24).map((m) => [m.slug, m.as24!])
  )
);
