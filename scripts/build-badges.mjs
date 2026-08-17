// Turns raw square artwork into transparent circular badge medallions.
//
// Input:  assets/badges/raw/<id>.png   (any background - it gets cropped away)
// Output: assets/badges/out/<id>-<size>.png and a locked 256px variant
// for collectible places.
//
// The circular alpha mask is what creates the transparency, so the source
// artwork does not need a transparent background of its own.
//
// Usage:
//   node scripts/build-badges.mjs
//   node scripts/build-badges.mjs --all
//   node scripts/build-badges.mjs --only vistycio-piliakalnis
//   node scripts/build-badges.mjs --force
import sharp from "sharp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

const OUTPUT_SIZES = [512, 256, 128];
const MASTER_SIZE = 1024;
const RING_WIDTH = 56;
const INK = "#2a2018";
const LOCKED_BRIGHTNESS = 1.25;

const args = process.argv.slice(2);
const onlyId = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
const force = args.includes("--force");
const allPlaces = args.includes("--all");

const places = JSON.parse(await readFile("data/places.json", "utf8"));
const rules = JSON.parse(await readFile("data/game-rules.json", "utf8"));

function rarityOf(place) {
  const topics = place.topics ?? [];
  for (const rarity of ["epic", "rare"]) {
    if (rules.rarity[rarity].topics.some((topic) => topics.includes(topic))) return rarity;
  }
  return "common";
}

function colorOf(place, rarity) {
  if (place.collectible) return rules.rarity[rarity].color;
  return rules.categoryColors?.[place.categories?.[0]] ?? rules.rarity.common.color;
}

const circleMask = (size) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
      `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/>` +
      `</svg>`
  );

/** Carved ring: colour band, dashed notches and dark hand-drawn contours. */
const carvedRing = (size, color) => {
  const center = size / 2;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <circle cx="${center}" cy="${center}" r="${center - RING_WIDTH / 2}"
            fill="none" stroke="${color}" stroke-width="${RING_WIDTH}"/>
    <circle cx="${center}" cy="${center}" r="${center - RING_WIDTH / 2}"
            fill="none" stroke="${INK}" stroke-width="10" stroke-opacity="0.28"
            stroke-dasharray="20 26" stroke-linecap="round"/>
    <circle cx="${center}" cy="${center}" r="${center - 5}"
            fill="none" stroke="${INK}" stroke-width="10"/>
    <circle cx="${center}" cy="${center}" r="${center - RING_WIDTH + 3}"
            fill="none" stroke="${INK}" stroke-width="8"/>
  </svg>`);
};

await mkdir("assets/badges/out", { recursive: true });
await mkdir("assets/badges/raw", { recursive: true });

const manifestPath = "assets/badges/manifest.json";
const manifest = existsSync(manifestPath)
  ? JSON.parse(await readFile(manifestPath, "utf8"))
  : {};

const selected = places
  .filter((place) => allPlaces || place.collectible)
  .filter((place) => (onlyId ? place.id === onlyId : true));

let built = 0;
let skipped = 0;
const missing = [];

for (const place of selected) {
  const sourcePath = `assets/badges/raw/${place.id}.png`;
  if (!existsSync(sourcePath)) {
    missing.push(place.id);
    continue;
  }

  const rarity = rarityOf(place);
  const color = colorOf(place, rarity);
  const largestOutput = `assets/badges/out/${place.id}-${OUTPUT_SIZES[0]}.png`;
  const previous = manifest[place.id];
  if (
    !force &&
    existsSync(largestOutput) &&
    previous?.source === sourcePath &&
    previous?.color === color &&
    previous?.collectible === Boolean(place.collectible) &&
    (!place.collectible ||
      previous?.lockedBrightness === LOCKED_BRIGHTNESS)
  ) {
    skipped += 1;
    continue;
  }

  // Square artwork -> circular alpha mask -> rarity/category ring.
  const master = await sharp(sourcePath)
    .resize(MASTER_SIZE, MASTER_SIZE, { fit: "cover" })
    .ensureAlpha() // required, otherwise the dest-in blend has nothing to write to
    .composite([
      { input: circleMask(MASTER_SIZE), blend: "dest-in" },
      { input: carvedRing(MASTER_SIZE, color), blend: "over" },
    ])
    .png()
    .toBuffer();

  for (const size of OUTPUT_SIZES) {
    await sharp(master)
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(`assets/badges/out/${place.id}-${size}.png`);
  }

  // Locked variants are only meaningful for collectible places.
  if (place.collectible) {
    await sharp(master)
      .grayscale()
      .modulate({ brightness: LOCKED_BRIGHTNESS })
      .resize(256, 256)
      .png({ compressionLevel: 9 })
      .toFile(`assets/badges/out/${place.id}-locked-256.png`);
  }

  manifest[place.id] = {
    collectible: Boolean(place.collectible),
    category: place.categories?.[0] ?? null,
    rarity,
    color,
    source: sourcePath,
    builtAt: new Date().toISOString(),
    sizes: OUTPUT_SIZES,
    locked: place.collectible,
    lockedBrightness: place.collectible ? LOCKED_BRIGHTNESS : null,
  };

  built += 1;
  console.log(`built ${place.id} (${rarity})`);
}

await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

console.log(`\nbuilt: ${built}, skipped: ${skipped}, missing artwork: ${missing.length}`);
if (missing.length > 0) {
  console.log(`missing:\n  ${missing.join("\n  ")}`);
}
