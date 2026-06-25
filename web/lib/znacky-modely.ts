// Typy a data pro výběr značek + modelů v filtrech hledání.
// slug = canonical slug (Otomoto + Bazos), as24 = AutoScout24 pokud se liší.

export type ZnackaFiltr = { znacka: string; modely: string[] };

type ModelDef = {
  slug: string;
  label: string;
  as24?: string;  // AutoScout24 + Willhaben slug pokud se liší od canonical
};

type ZnackaDef = {
  slug: string;
  label: string;
  modely: ModelDef[];
};

export const ZNACKY_S_MODELY: ZnackaDef[] = [
  {
    slug: "audi", label: "Audi",
    modely: [
      { slug: "a1", label: "A1" }, { slug: "a3", label: "A3" },
      { slug: "a4", label: "A4" }, { slug: "a5", label: "A5" },
      { slug: "a6", label: "A6" }, { slug: "a7", label: "A7" },
      { slug: "a8", label: "A8" }, { slug: "q2", label: "Q2" },
      { slug: "q3", label: "Q3" }, { slug: "q5", label: "Q5" },
      { slug: "q7", label: "Q7" }, { slug: "q8", label: "Q8" },
      { slug: "tt", label: "TT" },
    ],
  },
  {
    slug: "bmw", label: "BMW",
    modely: [
      { slug: "seria-1", label: "Řada 1", as24: "1er" },
      { slug: "seria-2", label: "Řada 2", as24: "2er" },
      { slug: "seria-3", label: "Řada 3", as24: "3er" },
      { slug: "seria-4", label: "Řada 4", as24: "4er" },
      { slug: "seria-5", label: "Řada 5", as24: "5er" },
      { slug: "seria-6", label: "Řada 6", as24: "6er" },
      { slug: "seria-7", label: "Řada 7", as24: "7er" },
      { slug: "x1", label: "X1" }, { slug: "x2", label: "X2" },
      { slug: "x3", label: "X3" }, { slug: "x4", label: "X4" },
      { slug: "x5", label: "X5" }, { slug: "x6", label: "X6" },
      { slug: "z4", label: "Z4" },
    ],
  },
  {
    slug: "citroen", label: "Citroën",
    modely: [
      { slug: "c1", label: "C1" }, { slug: "c2", label: "C2" },
      { slug: "c3", label: "C3" }, { slug: "c4", label: "C4" },
      { slug: "c5", label: "C5" }, { slug: "c3-aircross", label: "C3 Aircross" },
      { slug: "c4-picasso", label: "C4 Picasso" }, { slug: "c5-aircross", label: "C5 Aircross" },
      { slug: "berlingo", label: "Berlingo" },
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
    slug: "fiat", label: "Fiat",
    modely: [
      { slug: "panda", label: "Panda" }, { slug: "punto", label: "Punto" },
      { slug: "grande-punto", label: "Grande Punto" }, { slug: "stilo", label: "Stilo" },
      { slug: "bravo", label: "Bravo" }, { slug: "tipo", label: "Tipo" },
      { slug: "500", label: "500" }, { slug: "500x", label: "500X" },
      { slug: "500l", label: "500L" }, { slug: "doblo", label: "Doblò" },
    ],
  },
  {
    slug: "ford", label: "Ford",
    modely: [
      { slug: "fiesta", label: "Fiesta" }, { slug: "focus", label: "Focus" },
      { slug: "mondeo", label: "Mondeo" }, { slug: "kuga", label: "Kuga" },
      { slug: "puma", label: "Puma" }, { slug: "edge", label: "Edge" },
      { slug: "galaxy", label: "Galaxy" }, { slug: "s-max", label: "S-Max" },
      { slug: "ranger", label: "Ranger" }, { slug: "mustang", label: "Mustang" },
      { slug: "ecosport", label: "EcoSport" },
    ],
  },
  {
    slug: "honda", label: "Honda",
    modely: [
      { slug: "jazz", label: "Jazz" }, { slug: "civic", label: "Civic" },
      { slug: "accord", label: "Accord" }, { slug: "cr-v", label: "CR-V" },
      { slug: "hr-v", label: "HR-V" }, { slug: "fr-v", label: "FR-V" },
    ],
  },
  {
    slug: "hyundai", label: "Hyundai",
    modely: [
      { slug: "i10", label: "i10" }, { slug: "i20", label: "i20" },
      { slug: "i30", label: "i30" }, { slug: "i40", label: "i40" },
      { slug: "ix20", label: "ix20" }, { slug: "ix35", label: "ix35" },
      { slug: "tucson", label: "Tucson" }, { slug: "kona", label: "Kona" },
      { slug: "santa-fe", label: "Santa Fe" }, { slug: "ioniq", label: "Ioniq" },
    ],
  },
  {
    slug: "kia", label: "Kia",
    modely: [
      { slug: "picanto", label: "Picanto" }, { slug: "rio", label: "Rio" },
      { slug: "ceed", label: "Ceed" }, { slug: "sportage", label: "Sportage" },
      { slug: "sorento", label: "Sorento" }, { slug: "soul", label: "Soul" },
      { slug: "niro", label: "Niro" }, { slug: "stinger", label: "Stinger" },
      { slug: "optima", label: "Optima" },
    ],
  },
  {
    slug: "mazda", label: "Mazda",
    modely: [
      { slug: "mazda2", label: "Mazda2" }, { slug: "mazda3", label: "Mazda3" },
      { slug: "mazda6", label: "Mazda6" }, { slug: "cx-3", label: "CX-3" },
      { slug: "cx-5", label: "CX-5" }, { slug: "cx-30", label: "CX-30" },
      { slug: "mx-5", label: "MX-5" },
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
    ],
  },
  {
    slug: "mini", label: "MINI",
    modely: [
      { slug: "mini", label: "Mini Hatch" }, { slug: "countryman", label: "Countryman" },
      { slug: "clubman", label: "Clubman" }, { slug: "cabrio", label: "Cabrio" },
    ],
  },
  {
    slug: "mitsubishi", label: "Mitsubishi",
    modely: [
      { slug: "lancer", label: "Lancer" }, { slug: "outlander", label: "Outlander" },
      { slug: "asx", label: "ASX" }, { slug: "pajero", label: "Pajero" },
      { slug: "eclipse-cross", label: "Eclipse Cross" },
    ],
  },
  {
    slug: "nissan", label: "Nissan",
    modely: [
      { slug: "micra", label: "Micra" }, { slug: "juke", label: "Juke" },
      { slug: "qashqai", label: "Qashqai" }, { slug: "x-trail", label: "X-Trail" },
      { slug: "leaf", label: "Leaf" }, { slug: "navara", label: "Navara" },
    ],
  },
  {
    slug: "opel", label: "Opel",
    modely: [
      { slug: "corsa", label: "Corsa" }, { slug: "astra", label: "Astra" },
      { slug: "vectra", label: "Vectra" }, { slug: "insignia", label: "Insignia" },
      { slug: "zafira", label: "Zafira" }, { slug: "mokka", label: "Mokka" },
      { slug: "crossland", label: "Crossland" }, { slug: "grandland", label: "Grandland" },
      { slug: "meriva", label: "Meriva" }, { slug: "antara", label: "Antara" },
    ],
  },
  {
    slug: "peugeot", label: "Peugeot",
    modely: [
      { slug: "206", label: "206" }, { slug: "207", label: "207" },
      { slug: "208", label: "208" }, { slug: "307", label: "307" },
      { slug: "308", label: "308" }, { slug: "407", label: "407" },
      { slug: "508", label: "508" }, { slug: "2008", label: "2008" },
      { slug: "3008", label: "3008" }, { slug: "5008", label: "5008" },
    ],
  },
  {
    slug: "renault", label: "Renault",
    modely: [
      { slug: "clio", label: "Clio" }, { slug: "megane", label: "Mégane" },
      { slug: "laguna", label: "Laguna" }, { slug: "scenic", label: "Scénic" },
      { slug: "captur", label: "Captur" }, { slug: "kadjar", label: "Kadjar" },
      { slug: "koleos", label: "Koleos" }, { slug: "talisman", label: "Talisman" },
      { slug: "arkana", label: "Arkana" }, { slug: "zoe", label: "Zoé" },
    ],
  },
  {
    slug: "seat", label: "SEAT",
    modely: [
      { slug: "ibiza", label: "Ibiza" }, { slug: "leon", label: "Leon" },
      { slug: "toledo", label: "Toledo" }, { slug: "altea", label: "Altea" },
      { slug: "alhambra", label: "Alhambra" }, { slug: "arona", label: "Arona" },
      { slug: "ateca", label: "Ateca" }, { slug: "tarraco", label: "Tarraco" },
    ],
  },
  {
    slug: "skoda", label: "Škoda",
    modely: [
      { slug: "citigo", label: "Citigo" }, { slug: "fabia", label: "Fabia" },
      { slug: "rapid", label: "Rapid" }, { slug: "scala", label: "Scala" },
      { slug: "octavia", label: "Octavia" }, { slug: "superb", label: "Superb" },
      { slug: "kamiq", label: "Kamiq" }, { slug: "karoq", label: "Karoq" },
      { slug: "kodiaq", label: "Kodiaq" }, { slug: "enyaq", label: "Enyaq" },
    ],
  },
  {
    slug: "subaru", label: "Subaru",
    modely: [
      { slug: "impreza", label: "Impreza" }, { slug: "legacy", label: "Legacy" },
      { slug: "outback", label: "Outback" }, { slug: "forester", label: "Forester" },
      { slug: "xv", label: "XV" },
    ],
  },
  {
    slug: "suzuki", label: "Suzuki",
    modely: [
      { slug: "swift", label: "Swift" }, { slug: "baleno", label: "Baleno" },
      { slug: "vitara", label: "Vitara" }, { slug: "grand-vitara", label: "Grand Vitara" },
      { slug: "sx4", label: "SX4" }, { slug: "jimny", label: "Jimny" },
      { slug: "ignis", label: "Ignis" },
    ],
  },
  {
    slug: "toyota", label: "Toyota",
    modely: [
      { slug: "aygo", label: "Aygo" }, { slug: "yaris", label: "Yaris" },
      { slug: "auris", label: "Auris" }, { slug: "corolla", label: "Corolla" },
      { slug: "camry", label: "Camry" }, { slug: "prius", label: "Prius" },
      { slug: "chr", label: "C-HR" }, { slug: "rav4", label: "RAV4" },
      { slug: "hilux", label: "Hilux" }, { slug: "land-cruiser", label: "Land Cruiser" },
    ],
  },
  {
    slug: "volkswagen", label: "Volkswagen",
    modely: [
      { slug: "up", label: "up!" }, { slug: "polo", label: "Polo" },
      { slug: "golf", label: "Golf" }, { slug: "jetta", label: "Jetta" },
      { slug: "passat", label: "Passat" }, { slug: "arteon", label: "Arteon" },
      { slug: "t-cross", label: "T-Cross" }, { slug: "t-roc", label: "T-Roc" },
      { slug: "tiguan", label: "Tiguan" }, { slug: "touareg", label: "Touareg" },
      { slug: "touran", label: "Touran" }, { slug: "sharan", label: "Sharan" },
      { slug: "caddy", label: "Caddy" },
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
    ],
  },
];

export const MODELY_MAP = new Map<string, ZnackaDef>(
  ZNACKY_S_MODELY.map((z) => [z.slug, z])
);

// Slug mapping pro AutoScout24 + Willhaben (kde se liší od canonical/Otomoto).
// Generováno z as24 pole v ModelDef.
export const AS24_MODEL_SLUG = Object.fromEntries(
  ZNACKY_S_MODELY.flatMap((z) =>
    z.modely.filter((m) => m.as24).map((m) => [m.slug, m.as24!])
  )
);
