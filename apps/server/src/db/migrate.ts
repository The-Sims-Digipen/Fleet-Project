import "dotenv/config";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required for migrations");

const directory = fileURLToPath(new URL("../../drizzle/", import.meta.url));
const files = (await readdir(directory)).filter((name) => /^\d+.*\.sql$/.test(name)).sort();
const sql = postgres(databaseUrl, { max: 1, prepare: false });

try {
  await sql.begin(async (transaction) => {
    // Serialize deployment migrations. This matters when two Vercel production
    // builds start at nearly the same time against the same Neon database.
    await transaction`SELECT pg_advisory_xact_lock(748613201)`;

    await transaction.unsafe(`
      CREATE TABLE IF NOT EXISTS "_fleet_migrations" (
        "name" text PRIMARY KEY NOT NULL,
        "applied_at" timestamptz DEFAULT now() NOT NULL
      )
    `);

    for (const name of files) {
      const [existing] = await transaction<{ name: string }[]>`SELECT "name" FROM "_fleet_migrations" WHERE "name" = ${name}`;
      if (existing) continue;

      const migration = await readFile(new URL(`../../drizzle/${name}`, import.meta.url), "utf8");
      await transaction.unsafe(migration);
      await transaction`INSERT INTO "_fleet_migrations" ("name") VALUES (${name})`;
      console.log(`Applied migration ${name}`);
    }
  });
} finally {
  await sql.end();
}
