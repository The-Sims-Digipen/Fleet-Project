-- Pre-v5 workspace documents and their separate Scenario records are unsupported.
-- Keep only complete aggregate Projects before removing the compatibility schema.
DELETE FROM "projects"
WHERE "schema_version" <> 5 OR "document" ->> 'version' <> '5';

DROP TABLE "scenarios";

ALTER TABLE "projects"
  DROP COLUMN "active_scenario_id";
