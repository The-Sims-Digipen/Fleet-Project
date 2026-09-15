import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

export function createDatabase(databaseUrl: string) {
  // Neon supplies a pooled DATABASE_URL. Keep each serverless instance's pool
  // deliberately small so scale-out does not create excessive DB connections.
  const client = postgres(databaseUrl, {
    max: 3,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
  return { client, db: drizzle(client) };
}

export type Database = ReturnType<typeof createDatabase>["db"];
