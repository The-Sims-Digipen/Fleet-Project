import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const shouldMigrate = Boolean(process.env.DATABASE_URL) &&
  (process.env.VERCEL_ENV === "production" || process.env.RUN_MIGRATIONS === "1");

if (shouldMigrate) {
  console.log("Applying PostgreSQL migrations before the production build...");
  run("pnpm", ["--filter", "@starter/server", "db:migrate"]);
} else if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set; database migrations were skipped.");
} else {
  console.log("Skipping migrations for this non-production deployment. Set RUN_MIGRATIONS=1 to opt in.");
}

run("pnpm", ["build"]);
