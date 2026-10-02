import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const { packageManager } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const [major, minor] = process.versions.node.split(".").map(Number);

if (major < 22 || (major === 22 && minor < 13)) {
  console.error(`Node.js ${process.versions.node} is unsupported. Install Node.js 24 LTS (minimum 22.13.0).`);
  process.exit(1);
}

for (const [message, args] of [
  ["Installing dependencies...", ["install", "--frozen-lockfile"]],
  ["Building the workspace...", ["build"]],
  ["Starting the built app at http://localhost:5173 (API: http://localhost:3001). Press Ctrl+C to stop.", ["start"]],
]) {
  console.log(`\n${message}`);
  const result = spawnSync("npm", ["exec", "--yes", `--package=${packageManager}`, "--", "pnpm", ...args], {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    console.error(`Could not run npm: ${result.error.message}. Install Node.js with npm and try again.`);
  }
  if (result.error || result.status !== 0) {
    process.exit(result.status ?? (result.signal === "SIGINT" ? 130 : 1));
  }
}
