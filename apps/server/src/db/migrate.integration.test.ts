import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

import postgres from "postgres";
import { afterAll, describe, expect, it } from "vitest";

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithPostgres = databaseUrl ? describe : describe.skip;
const migrationUrl = new URL("../../drizzle/0001_project_records.sql", import.meta.url);

describeWithPostgres("aggregate Project migration", () => {
  const sql = postgres(databaseUrl!, { max: 1, prepare: false });
  const schemas: string[] = [];

  afterAll(async () => {
    for (const schema of schemas) await sql.unsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await sql.end();
  });

  async function applyMigration(schema: string): Promise<void> {
    const migration = await readFile(migrationUrl, "utf8");
    await sql.begin(async (transaction) => {
      await transaction.unsafe(`SET LOCAL search_path TO "${schema}"`);
      await transaction.unsafe(migration);
    });
  }

  async function expectAggregateSchema(schema: string): Promise<void> {
    const tables = await sql<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = ${schema}
      ORDER BY table_name
    `;
    expect(tables.map((row) => row.table_name)).toEqual(["projects"]);

    const columns = await sql<{ column_name: string }[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = ${schema} AND table_name = 'projects'
      ORDER BY ordinal_position
    `;
    expect(columns.map((row) => row.column_name)).toEqual([
      "id", "name", "revision", "schema_version", "document", "created_at", "updated_at",
    ]);
  }

  it("initializes the aggregate schema in a fresh database namespace", async () => {
    const schema = `fleet_fresh_${randomUUID().replaceAll("-", "")}`;
    schemas.push(schema);
    await sql.unsafe(`CREATE SCHEMA "${schema}"`);

    await applyMigration(schema);

    await expectAggregateSchema(schema);
  });

  it("destructively replaces the previous prerelease projects and scenarios schema", async () => {
    const schema = `fleet_legacy_${randomUUID().replaceAll("-", "")}`;
    schemas.push(schema);
    await sql.unsafe(`CREATE SCHEMA "${schema}"`);
    await sql.begin(async (transaction) => {
      await transaction.unsafe(`SET LOCAL search_path TO "${schema}"`);
      await transaction.unsafe(`
        CREATE TABLE "projects" (
          "id" uuid PRIMARY KEY,
          "name" text NOT NULL,
          "active_scenario_id" uuid,
          "document" jsonb NOT NULL
        );
        CREATE TABLE "scenarios" (
          "id" uuid PRIMARY KEY,
          "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
          "document" jsonb NOT NULL
        );
      `);
    });

    await applyMigration(schema);

    await expectAggregateSchema(schema);
  });
});
