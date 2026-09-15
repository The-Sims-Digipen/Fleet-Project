CREATE TABLE IF NOT EXISTS "worlds" (
  "id" uuid PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "revision" integer NOT NULL,
  "schema_version" integer NOT NULL,
  "document" jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "worlds_id_revision_unique" UNIQUE("id", "revision")
);

CREATE TABLE IF NOT EXISTS "projects" (
  "id" uuid PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "world_id" uuid NOT NULL,
  "revision" integer NOT NULL,
  "schema_version" integer NOT NULL,
  "document" jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "projects_id_world_id_unique" UNIQUE("id", "world_id"),
  CONSTRAINT "projects_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "worlds"("id") ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS "scenarios" (
  "id" uuid PRIMARY KEY NOT NULL,
  "world_id" uuid NOT NULL,
  "name" text NOT NULL,
  "revision" integer NOT NULL,
  "world_revision" integer NOT NULL,
  "schema_version" integer NOT NULL,
  "document" jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "scenarios_id_world_id_unique" UNIQUE("id", "world_id"),
  CONSTRAINT "scenarios_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "worlds"("id") ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS "project_scenarios" (
  "project_id" uuid NOT NULL,
  "scenario_id" uuid NOT NULL,
  "world_id" uuid NOT NULL,
  "position" integer NOT NULL,
  CONSTRAINT "project_scenarios_project_id_scenario_id_pk" PRIMARY KEY("project_id", "scenario_id"),
  CONSTRAINT "project_scenarios_project_position_unique" UNIQUE("project_id", "position"),
  CONSTRAINT "project_scenarios_project_world_fk" FOREIGN KEY ("project_id", "world_id") REFERENCES "projects"("id", "world_id") ON DELETE CASCADE,
  CONSTRAINT "project_scenarios_scenario_world_fk" FOREIGN KEY ("scenario_id", "world_id") REFERENCES "scenarios"("id", "world_id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "projects_world_id_idx" ON "projects" ("world_id");
CREATE INDEX IF NOT EXISTS "scenarios_world_id_idx" ON "scenarios" ("world_id");
CREATE INDEX IF NOT EXISTS "project_scenarios_world_id_idx" ON "project_scenarios" ("world_id");
