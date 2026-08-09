// Merges translations into data/places.json under an `i18n` key.
//
// The `text` field comes from scripts/translations/<lang>.json.
// The `description` field is formulaic ("<kind>. <Location>: <city> · <municipality>.")
// and is therefore generated instead of translated by hand.
//
// Safe to run repeatedly. Usage: node scripts/add-i18n.mjs
import { readFile, writeFile } from "node:fs/promises";

const LANGUAGES = ["en", "pl", "de"];

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
};

function buildDescription(place, language) {
  const parts = DESCRIPTION_PARTS[language];
  const kind = (place.categories ?? [])
    .map((category) => KIND_BY_CATEGORY[category])
    .find(Boolean);

  const municipality = place.municipality
    ? parts.municipality[place.municipality] ?? place.municipality
    : null;

  const location = [place.city, municipality].filter(Boolean).join(" · ");

  return `${parts.kinds[kind] ?? parts.kinds.fallback}. ${parts.locationLabel}: ${location}.`;
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

const missing = [];

const updated = places.map((place) => {
  const i18n = { ...(place.i18n ?? {}) };

  for (const language of LANGUAGES) {
    const text = translations[language][place.id];
    if (!text) missing.push(`${language}: ${place.id}`);

    i18n[language] = {
      description: buildDescription(place, language),
      text: text ?? place.text,
    };
  }

  return { ...place, i18n };
});

await writeFile("data/places.json", JSON.stringify(updated, null, 2) + "\n", "utf8");

console.log(`Merged translations for ${updated.length} places (${LANGUAGES.join(", ")})`);
if (missing.length > 0) {
  console.warn(`Missing translations, fell back to Lithuanian:\n  ${missing.join("\n  ")}`);
}
