// Prints ready-made image prompts, one per place by default for collectible
// places, or for every place with --all.
// The generated artwork is saved to assets/badges/raw/<id>.png and then
// turned into medallions by scripts/build-badges.mjs.
//
// Usage:
//   node scripts/badge-prompts.mjs            all collectible places
//   node scripts/badge-prompts.mjs --all      all places, including services
//   node scripts/badge-prompts.mjs --missing  only places without artwork
//   node scripts/badge-prompts.mjs --only <id>
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const args = process.argv.slice(2);
const onlyId = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
const missingOnly = args.includes("--missing");
const allPlaces = args.includes("--all");

const style = await readFile("scripts/badge-style.txt", "utf8");
const places = JSON.parse(await readFile("data/places.json", "utf8"));

const selected = places
  .filter((place) => allPlaces || place.collectible)
  .filter((place) => (onlyId ? place.id === onlyId : true))
  .filter((place) => (missingOnly ? !existsSync(`assets/badges/raw/${place.id}.png`) : true));

for (const place of selected) {
  const motif = place.topics?.[0] ?? place.categories?.[0] ?? "landmark";
  console.log(`--- ${place.id} ---`);
  console.log(
    `${style.trim()}\n\nSubject: ${place.name} (${motif}), Vistytis Regional Park, Lithuania.`
  );
  console.log("");
}

console.log(`# ${selected.length} prompt(s)`);
