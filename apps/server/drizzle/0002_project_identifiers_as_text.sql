ALTER TABLE "scenarios"
  DROP CONSTRAINT IF EXISTS "scenarios_project_id_projects_id_fk";

ALTER TABLE "projects"
  ALTER COLUMN "id" TYPE text USING "id"::text;

ALTER TABLE "scenarios"
  ALTER COLUMN "project_id" TYPE text USING "project_id"::text;

ALTER TABLE "scenarios"
  ADD CONSTRAINT "scenarios_project_id_projects_id_fk"
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;
