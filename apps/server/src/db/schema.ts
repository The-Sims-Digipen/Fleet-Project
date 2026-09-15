import { foreignKey, integer, jsonb, pgTable, primaryKey, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

export const worlds = pgTable("worlds", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  revision: integer("revision").notNull(),
  schemaVersion: integer("schema_version").notNull(),
  document: jsonb("document").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (table) => [
  unique("worlds_id_revision_unique").on(table.id, table.revision),
]);

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  worldId: uuid("world_id").notNull().references(() => worlds.id, { onDelete: "restrict" }),
  revision: integer("revision").notNull(),
  schemaVersion: integer("schema_version").notNull(),
  document: jsonb("document").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (table) => [
  unique("projects_id_world_id_unique").on(table.id, table.worldId),
]);

export const scenarios = pgTable("scenarios", {
  id: uuid("id").primaryKey(),
  worldId: uuid("world_id").notNull().references(() => worlds.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  revision: integer("revision").notNull(),
  worldRevision: integer("world_revision").notNull(),
  schemaVersion: integer("schema_version").notNull(),
  document: jsonb("document").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (table) => [
  unique("scenarios_id_world_id_unique").on(table.id, table.worldId),
]);

export const projectScenarios = pgTable("project_scenarios", {
  projectId: uuid("project_id").notNull(),
  scenarioId: uuid("scenario_id").notNull(),
  worldId: uuid("world_id").notNull(),
  position: integer("position").notNull(),
}, (table) => [
  primaryKey({ columns: [table.projectId, table.scenarioId] }),
  unique("project_scenarios_project_position_unique").on(table.projectId, table.position),
  foreignKey({
    name: "project_scenarios_project_world_fk",
    columns: [table.projectId, table.worldId],
    foreignColumns: [projects.id, projects.worldId],
  }).onDelete("cascade"),
  foreignKey({
    name: "project_scenarios_scenario_world_fk",
    columns: [table.scenarioId, table.worldId],
    foreignColumns: [scenarios.id, scenarios.worldId],
  }).onDelete("restrict"),
]);
