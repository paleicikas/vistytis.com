import { spawn, spawnSync } from "node:child_process";
import path from "node:path";

const nativeAccessFlag = "--enable-native-access=ALL-UNNAMED";
const javaExecutable = process.env.JAVA_HOME
  ? path.join(
      process.env.JAVA_HOME,
      "bin",
      process.platform === "win32" ? "java.exe" : "java"
    )
  : "java";
const javaVersion = spawnSync(javaExecutable, ["-version"], {
  encoding: "utf8",
});
const javaOutput = `${javaVersion.stdout ?? ""}\n${javaVersion.stderr ?? ""}`;
const javaMajor = Number(javaOutput.match(/version "(\d+)/)?.[1] ?? 0);
const environment = { ...process.env };

if (
  javaMajor >= 24 &&
  !environment.JAVA_TOOL_OPTIONS?.includes(nativeAccessFlag)
) {
  environment.JAVA_TOOL_OPTIONS = [
    environment.JAVA_TOOL_OPTIONS,
    nativeAccessFlag,
  ]
    .filter(Boolean)
    .join(" ");
}

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(command, ["expo", "run:android", ...process.argv.slice(2)], {
  cwd: process.cwd(),
  env: environment,
  shell: process.platform === "win32",
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

child.on("close", (code) => {
  process.exit(code ?? 1);
});
