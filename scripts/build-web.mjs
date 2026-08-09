import { cp, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const appDir = join(rootDir, "app");
const distDir = join(appDir, "dist");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function runNpm(args) {
  const result = spawnSync(npmCommand, args, {
    cwd: appDir,
    env: process.env,
    shell: process.platform === "win32",
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("Syncing shared data...");
runNpm(["run", "sync-data"]);

console.log("Exporting Expo web app...");
runNpm(["exec", "--", "expo", "export", "--platform", "web"]);

const cnamePath = join(rootDir, "CNAME");
try {
  await stat(cnamePath);
  await cp(cnamePath, join(distDir, "CNAME"));
} catch (error) {
  if (error.code !== "ENOENT") {
    throw error;
  }
}

await cp(join(distDir, "index.html"), join(distDir, "404.html"));

console.log(`Web app is ready in ${distDir}`);
