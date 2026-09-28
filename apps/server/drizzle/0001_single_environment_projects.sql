DROP TABLE IF EXISTS "project_scenarios" CASCADE;
DROP TABLE IF EXISTS "scenarios" CASCADE;
DROP TABLE IF EXISTS "projects" CASCADE;
DROP TABLE IF EXISTS "worlds" CASCADE;

CREATE TABLE "projects" (
  "id" uuid PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "active_scenario_id" uuid,
  "revision" integer NOT NULL,
  "schema_version" integer NOT NULL,
  "document" jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE "scenarios" (
  "id" uuid PRIMARY KEY NOT NULL,
  "project_id" uuid NOT NULL,
  "name" text NOT NULL,
  "position" integer NOT NULL,
  "revision" integer NOT NULL,
  "schema_version" integer NOT NULL,
  "document" jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "scenarios_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
  CONSTRAINT "scenarios_project_position_unique" UNIQUE("project_id", "position")
);

CREATE INDEX "scenarios_project_id_idx" ON "scenarios" ("project_id");
