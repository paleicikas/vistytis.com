import { cp, mkdir, readdir } from "node:fs/promises";
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

console.log(`Synchronized mobile data into ${path.relative(repositoryRoot, targetData)}/`);
