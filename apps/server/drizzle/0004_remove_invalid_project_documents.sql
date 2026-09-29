-- Remove malformed or unsupported Project rows that may have survived the v5 contraction.
DELETE FROM "projects"
WHERE "schema_version" IS DISTINCT FROM 5
   OR "document" ->> 'version' IS DISTINCT FROM '5';
