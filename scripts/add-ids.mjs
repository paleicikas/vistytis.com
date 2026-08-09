// Adds stable `id` and `collectible` fields to data/places.json.
// Safe to run repeatedly: existing ids are preserved.
// Usage: node scripts/add-ids.mjs
import { readFile, writeFile } from "node:fs/promises";

const COLLECTIBLE_CATEGORIES = new Set([
  "Kultūros paveldas",
  "Apžvalgos vietos",
  "Gamta",
  "Takai",
]);

export function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip Lithuanian diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const places = JSON.parse(await readFile("data/places.json", "utf8"));
const usedIds = new Map();

const updated = places.map((place) => {
  let id = place.id ?? slugify(place.name);
  const seen = usedIds.get(id) ?? 0;
  usedIds.set(id, seen + 1);
  if (seen > 0) id = `${id}-${seen + 1}`; // guard against duplicate names

  const collectible = (place.categories ?? []).some((category) =>
    COLLECTIBLE_CATEGORIES.has(category)
  );

  // Put id and collectible first so the file stays readable.
  return { id, collectible, ...place };
});

await writeFile("data/places.json", JSON.stringify(updated, null, 2) + "\n", "utf8");

const collectibleCount = updated.filter((place) => place.collectible).length;
console.log(`Updated ${updated.length} places, collectible: ${collectibleCount}`);
