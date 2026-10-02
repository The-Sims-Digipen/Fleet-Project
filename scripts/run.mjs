import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { delimiter, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectDir = fileURLToPath(new URL("../", import.meta.url));
process.chdir(projectDir);
const { packageManager } = JSON.parse(readFileSync("package.json", "utf8"));
if (!/^pnpm@\d+\.\d+\.\d+$/.test(packageManager)) {
  throw new Error("package.json must pin an exact pnpm version.");
}
const pnpmVersion = packageManager.slice("pnpm@".length);
const toolsDir = join(projectDir, ".tools");
const pnpmDir = join(toolsDir, `pnpm-${pnpmVersion}`);
const pnpmCli = join(pnpmDir, "node_modules/pnpm/bin/pnpm.cjs");
const pnpmManifest = join(pnpmDir, "node_modules/pnpm/package.json");
const nodeDir = dirname(process.execPath);
const npmCli = process.platform === "win32"
  ? join(nodeDir, "node_modules/npm/bin/npm-cli.js")
  : join(nodeDir, "../lib/node_modules/npm/bin/npm-cli.js");

// npm's Windows shim has an unquoted SET that breaks project paths containing &.
// A quoted relative wrapper also keeps the portable toolchain movable.
const pnpmBinDir = process.platform === "win32" ? join(toolsDir, "bin") : join(pnpmDir, "node_modules/.bin");
if (process.platform === "win32") {
  mkdirSync(pnpmBinDir, { recursive: true });
  writeFileSync(join(pnpmBinDir, "pnpm.cmd"),
    `@echo off\r\nnode "%~dp0..\\pnpm-${pnpmVersion}\\node_modules\\pnpm\\bin\\pnpm.cjs" %*\r\n`);
}
// Make recursive workspace commands use the same portable Node and pinned pnpm.
process.env.PATH = [nodeDir, pnpmBinDir, process.env.PATH].join(delimiter);
process.env.npm_config_cache = join(toolsDir, "npm-cache");

function run(label, cli, args) {
  console.log(`\n${label}`);
  const result = spawnSync(process.execPath, [cli, ...args], { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.signal) process.exit(result.signal === "SIGINT" ? 130 : 1);
  if (result.status !== 0) {
    console.error(`Fleet Project: ${label} failed (exit ${result.status}).`);
    process.exit(result.status ?? 1);
  }
}

if (!existsSync(pnpmCli) || !existsSync(pnpmManifest)
  || JSON.parse(readFileSync(pnpmManifest, "utf8")).version !== pnpmVersion) {
  run(`Installing ${packageManager} inside .tools...`, npmCli, [
    "install", "--prefix", pnpmDir, "--no-save", "--package-lock=false",
    "--ignore-scripts", "--no-audit", "--no-fund", packageManager,
  ]);
}

run("Installing project dependencies...", pnpmCli, [
  "install", "--frozen-lockfile", "--prod=false", "--store-dir", join(toolsDir, "pnpm-store"),
]);
run("Building the project...", pnpmCli, ["run", "build"]);
run("Starting the built app at http://localhost:5173 (Ctrl+C to stop)...", pnpmCli, ["run", "start"]);
