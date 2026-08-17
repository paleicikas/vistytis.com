// Merges translations into data/places.json under an `i18n` key.
//
// The `text` field comes from scripts/translations/<lang>.json.
// The `description` field is formulaic ("<kind>. <Location>: <city> · <municipality>.")
// and is therefore generated instead of translated by hand.
// Place names come from scripts/place-name-translations.json.
//
// Safe to run repeatedly. Usage: node scripts/add-i18n.mjs
import { readFile, writeFile } from "node:fs/promises";

const LANGUAGES = ["en", "pl", "de", "lv", "et", "fr", "uk"];

// First matching category decides the wording of the description.
const KIND_BY_CATEGORY = {
  "Gamta": "nature",
  "Kultūros paveldas": "heritage",
  "Apžvalgos vietos": "viewpoint",
  "Takai": "trail",
  "Poilsis ir nakvynė": "stay",
  "Lankytojų paslaugos": "services",
};

const DESCRIPTION_PARTS = {
  en: {
    locationLabel: "Location",
    municipality: { "Vilkaviškio r.": "Vilkaviškis district" },
    kinds: {
      nature: "Nature site",
      heritage: "Cultural heritage site",
      viewpoint: "Viewpoint",
      trail: "Educational trail",
      stay: "Place to stay and rest",
      services: "Visitor service",
      fallback: "Place of interest",
    },
  },
  pl: {
    locationLabel: "Miejscowość",
    municipality: { "Vilkaviškio r.": "rejon wyłkowyski" },
    kinds: {
      nature: "Obiekt przyrodniczy",
      heritage: "Obiekt dziedzictwa kulturowego",
      viewpoint: "Punkt widokowy",
      trail: "Ścieżka dydaktyczna",
      stay: "Miejsce noclegu i wypoczynku",
      services: "Obsługa turystów",
      fallback: "Miejsce warte uwagi",
    },
  },
  de: {
    locationLabel: "Ort",
    municipality: { "Vilkaviškio r.": "Rajon Vilkaviškis" },
    kinds: {
      nature: "Naturort",
      heritage: "Kulturerbe-Objekt",
      viewpoint: "Aussichtspunkt",
      trail: "Lehrpfad",
      stay: "Ort zum Übernachten und Erholen",
      services: "Besucherservice",
      fallback: "Sehenswerter Ort",
    },
  },
  lv: {
    locationLabel: "Atrašanās vieta",
    municipality: { "Vilkaviškio r.": "Vilkaviškis rajons" },
    kinds: {
      nature: "Dabas objekts",
      heritage: "Kultūras mantojuma objekts",
      viewpoint: "Skatu vieta",
      trail: "Izziņas taka",
      stay: "Naktsmītnes un atpūtas vieta",
      services: "Apmeklētāju pakalpojumi",
      fallback: "Apskates vērts objekts",
    },
  },
  et: {
    locationLabel: "Asukoht",
    municipality: { "Vilkaviškio r.": "Vilkaviškise rajoon" },
    kinds: {
      nature: "Loodusobjekt",
      heritage: "Kultuuripärandi objekt",
      viewpoint: "Vaatekoht",
      trail: "Õpperada",
      stay: "Ööbimis- ja puhkekoht",
      services: "Külastajateenus",
      fallback: "Vaatamisväärsus",
    },
  },
  fr: {
    locationLabel: "Localité",
    // French typography keeps a space in front of a colon.
    labelSeparator: " : ",
    municipality: { "Vilkaviškio r.": "district de Vilkaviškis" },
    kinds: {
      nature: "Site naturel",
      heritage: "Site du patrimoine culturel",
      viewpoint: "Point de vue",
      trail: "Sentier didactique",
      stay: "Lieu d’hébergement et de détente",
      services: "Service aux visiteurs",
      fallback: "Lieu d’intérêt",
    },
  },
  uk: {
    locationLabel: "Місцевість",
    municipality: { "Vilkaviškio r.": "Вілкавішкіський р-н" },
    // Ukrainian is the only language written in another script, so place names
    // are transliterated instead of being kept in their Lithuanian spelling.
    city: {
      "Čižiškiai": "Чижішкяй",
      "Čižiškai": "Чижішкай",
      "Dabravolė": "Дабраволе",
      "Liubiškiai": "Любішкяй",
      "Nebūtkiemis": "Небуткеміс",
      "Pakalniai": "Пакальняй",
      "Pavarteliai": "Павартеляй",
      "Pavištytis": "Павіштітіс",
      "Šakiai": "Шакяй",
      "Šilelio miškas": "Шилеліський ліс",
      "Vištytis": "Віштітіс",
      "Vištyčio Laukas I": "Віштічо Лаукас I",
      "Vištyčio Laukas II": "Віштічо Лаукас II",
      "Žirgėnai": "Жиргенай",
    },
    kinds: {
      nature: "Природний об’єкт",
      heritage: "Об’єкт культурної спадщини",
      viewpoint: "Оглядове місце",
      trail: "Пізнавальна стежка",
      stay: "Місце нічлігу та відпочинку",
      services: "Послуги для відвідувачів",
      fallback: "Місце, варте уваги",
    },
  },
};

// Every place with a `notice` shares the same border zone warning.
const NOTICES = {
  en: "This place sits next to the state border with the Kaliningrad region. Follow the border zone rules and note that your phone may switch to roaming.",
  pl: "Obiekt znajduje się przy granicy państwowej z obwodem kaliningradzkim. Przestrzegaj zasad strefy przygranicznej i pamiętaj, że telefon może przełączyć się na roaming.",
  de: "Dieser Ort liegt unmittelbar an der Staatsgrenze zum Gebiet Kaliningrad. Beachte die Regeln der Grenzzone; das Mobiltelefon kann ins Roaming wechseln.",
  lv: "Objekts atrodas pie valsts robežas ar Kaļiņingradas apgabalu. Ievēro pierobežas joslas noteikumus un ņem vērā, ka telefons var pārslēgties uz viesabonēšanu.",
  et: "Objekt asub riigipiiri ääres Kaliningradi oblastiga. Järgi piiritsooni reegleid ja arvesta, et telefon võib lülituda rändlusele.",
  fr: "Ce lieu se trouve juste à la frontière de la région de Kaliningrad. Respecte les règles de la zone frontalière et note que ton téléphone peut passer en itinérance.",
  uk: "Об’єкт розташований біля державного кордону з Калінінградською областю. Дотримуйся правил прикордонної смуги та зваж на те, що телефон може перейти в роумінг.",
};

function buildDescription(place, language) {
  const parts = DESCRIPTION_PARTS[language];
  const kind = (place.categories ?? [])
    .map((category) => KIND_BY_CATEGORY[category])
    .find(Boolean);

  const municipality = place.municipality
    ? parts.municipality[place.municipality] ?? place.municipality
    : null;

  const city = place.city
    ? parts.city?.[place.city] ?? place.city
    : null;

  const location = [city, municipality].filter(Boolean).join(" · ");

  const separator = parts.labelSeparator ?? ": ";

  return `${parts.kinds[kind] ?? parts.kinds.fallback}. ${parts.locationLabel}${separator}${location}.`;
}

const places = JSON.parse(await readFile("data/places.json", "utf8"));

const translations = Object.fromEntries(
  await Promise.all(
    LANGUAGES.map(async (language) => [
      language,
      JSON.parse(await readFile(`scripts/translations/${language}.json`, "utf8")),
    ])
  )
);
const placeNameTranslations = JSON.parse(
  await readFile("scripts/place-name-translations.json", "utf8")
);

const missing = [];

const updated = places.map((place) => {
  const i18n = { ...(place.i18n ?? {}) };

  for (const language of LANGUAGES) {
    const name = placeNameTranslations[language]?.[place.id];
    const text = translations[language][place.id];
    if (!name) missing.push(`${language} name: ${place.id}`);
    if (!text) missing.push(`${language}: ${place.id}`);

    i18n[language] = {
      name: name ?? place.name,
      description: buildDescription(place, language),
      text: text ?? place.text,
      ...(place.notice ? { notice: NOTICES[language] } : {}),
    };
  }

  return { ...place, i18n };
});

await writeFile("data/places.json", JSON.stringify(updated, null, 2) + "\n", "utf8");

console.log(`Merged translations for ${updated.length} places (${LANGUAGES.join(", ")})`);
if (missing.length > 0) {
  console.warn(`Missing translations, fell back to Lithuanian:\n  ${missing.join("\n  ")}`);
}
