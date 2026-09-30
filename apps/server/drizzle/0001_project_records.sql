-- Pre-release reset: the previous normalized projects/scenarios schema is not
-- data-compatible with the aggregate Project record. Remove it deliberately.
DROP TABLE IF EXISTS "scenarios";
DROP TABLE IF EXISTS "projects";

CREATE TABLE "projects" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "revision" integer NOT NULL,
  "schema_version" integer NOT NULL,
  "document" jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
