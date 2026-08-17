import { cp, mkdir, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = path.resolve(appRoot, "..");
const sourceData = path.join(repositoryRoot, "data");
const targetData = path.join(appRoot, "assets", "data");

await mkdir(path.join(targetData, "i18n"), { recursive: true });

for (const fileName of ["places.json", "game-rules.json", "promo.json"]) {
  await cp(path.join(sourceData, fileName), path.join(targetData, fileName));
}

for (const fileName of await readdir(path.join(sourceData, "i18n"))) {
  if (fileName.endsWith(".json")) {
    await cp(
      path.join(sourceData, "i18n", fileName),
      path.join(targetData, "i18n", fileName)
    );
  }
}

const places = JSON.parse(
  await readFile(path.join(sourceData, "places.json"), "utf8")
);
const sourceBadges = path.join(repositoryRoot, "assets", "badges", "out");
const targetBadges = path.join(appRoot, "assets", "badges", "out");
await mkdir(targetBadges, { recursive: true });

for (const place of places.filter((item) => item.collectible)) {
  for (const suffix of ["256.png", "locked-256.png"]) {
    const fileName = `${place.id}-${suffix}`;
    await cp(path.join(sourceBadges, fileName), path.join(targetBadges, fileName));
  }
}

console.log(`Synchronized mobile data into ${path.relative(repositoryRoot, targetData)}/`);
