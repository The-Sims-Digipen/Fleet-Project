import { and, asc, desc, eq, sql } from "drizzle-orm";

import type { Database } from "../db/client.js";
import { projectScenarios, projects, scenarios, worlds } from "../db/schema.js";
import type { CreateWorkspaceInput, ProjectDocument, ScenarioDocument, UpdateWorkspaceInput, WorldDocument } from "./schemas.js";

export class PersistenceNotFoundError extends Error {
  constructor(message = "The requested record no longer exists.") { super(message); }
}
export class PersistenceConflictError extends Error {
  constructor(message = "This record was saved elsewhere. Reload it before saving again.") { super(message); }
}
export class WorldCompatibilityError extends Error {
  constructor() { super("The scenario belongs to a different world and cannot be attached to this project."); }
}

export type WorldRecord = {
  id: string;
  name: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  document: WorldDocument;
};
export type ScenarioRecord = {
  id: string;
  worldId: string;
  name: string;
  revision: number;
  worldRevision: number;
  createdAt: string;
  updatedAt: string;
  document: ScenarioDocument;
};
export type ProjectRecord = {
  id: string;
  worldId: string;
  name: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  document: ProjectDocument;
};
export type WorkspaceRecord = { project: ProjectRecord; world: WorldRecord; scenarios: ScenarioRecord[] };
export type ProjectSummary = Pick<ProjectRecord, "id" | "worldId" | "name" | "revision" | "updatedAt"> & { scenarioCount: number };
export type WorldSummary = Pick<WorldRecord, "id" | "name" | "revision" | "updatedAt">;

export type PersistenceRepository = {
  ready(): Promise<void>;
  listProjects(): Promise<ProjectSummary[]>;
  getWorkspace(projectId: string): Promise<WorkspaceRecord>;
  createWorkspace(input: CreateWorkspaceInput): Promise<WorkspaceRecord>;
  updateWorkspace(input: UpdateWorkspaceInput): Promise<WorkspaceRecord>;
  listWorlds(): Promise<WorldSummary[]>;
  getWorld(worldId: string): Promise<WorldRecord>;
  listScenariosByWorld(worldId: string): Promise<ScenarioRecord[]>;
};

const iso = (value: Date) => value.toISOString();
const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
type ReadDatabase = Pick<Database, "select">;

const toWorld = (row: typeof worlds.$inferSelect): WorldRecord => ({
  id: row.id, name: row.name, revision: row.revision, createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt), document: row.document as WorldDocument,
});
const toProject = (row: typeof projects.$inferSelect): ProjectRecord => ({
  id: row.id, worldId: row.worldId, name: row.name, revision: row.revision, createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt), document: row.document as ProjectDocument,
});
const toScenario = (row: typeof scenarios.$inferSelect): ScenarioRecord => ({
  id: row.id, worldId: row.worldId, name: row.name, revision: row.revision, worldRevision: row.worldRevision,
  createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt), document: row.document as ScenarioDocument,
});

async function loadWorkspace(db: ReadDatabase, projectId: string): Promise<WorkspaceRecord> {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) throw new PersistenceNotFoundError("This project no longer exists.");
  const [world] = await db.select().from(worlds).where(eq(worlds.id, project.worldId)).limit(1);
  if (!world) throw new PersistenceNotFoundError("The project's world no longer exists.");
  const scenarioRows = await db.select({ scenario: scenarios })
    .from(projectScenarios)
    .innerJoin(scenarios, eq(projectScenarios.scenarioId, scenarios.id))
    .where(eq(projectScenarios.projectId, projectId))
    .orderBy(asc(projectScenarios.position));
  return { project: toProject(project), world: toWorld(world), scenarios: scenarioRows.map((row) => toScenario(row.scenario)) };
}

export function createPersistenceRepository(db: Database): PersistenceRepository {
  return {
    ready: async () => { await db.execute(sql`select 1`); },

    listProjects: async () => {
      const rows = await db.select({
        id: projects.id,
        worldId: projects.worldId,
        name: projects.name,
        revision: projects.revision,
        updatedAt: projects.updatedAt,
        scenarioCount: sql<number>`count(${projectScenarios.scenarioId})::int`,
      }).from(projects)
        .leftJoin(projectScenarios, eq(projects.id, projectScenarios.projectId))
        .groupBy(projects.id)
        .orderBy(desc(projects.updatedAt));
      return rows.map((row) => ({ ...row, updatedAt: iso(row.updatedAt) }));
    },

    getWorkspace: (projectId) => loadWorkspace(db, projectId),

    createWorkspace: async (input) => db.transaction(async (tx) => {
      const now = new Date();
      const [existingProject] = await tx.select({ id: projects.id }).from(projects).where(eq(projects.id, input.project.id)).limit(1);
      if (existingProject) throw new PersistenceConflictError("A project with this ID already exists.");

      let [world] = await tx.select().from(worlds).where(eq(worlds.id, input.world.id)).limit(1);
      if (!world) {
        if (input.world.expectedRevision !== 0) throw new PersistenceNotFoundError("The selected world no longer exists.");
        [world] = await tx.insert(worlds).values({
          id: input.world.id, name: input.world.name, revision: 1, schemaVersion: input.world.document.version,
          document: input.world.document, createdAt: now, updatedAt: now,
        }).returning();
      } else {
        if (input.world.expectedRevision !== world.revision) throw new PersistenceConflictError("The world was changed elsewhere. Reload it before saving.");
        if (world.name !== input.world.name || !sameJson(world.document, input.world.document)) {
          [world] = await tx.update(worlds).set({ name: input.world.name, document: input.world.document, revision: world.revision + 1, updatedAt: now })
            .where(and(eq(worlds.id, world.id), eq(worlds.revision, input.world.expectedRevision))).returning();
        }
      }
      if (!world) throw new PersistenceConflictError("The world could not be saved.");

      const [project] = await tx.insert(projects).values({
        id: input.project.id, name: input.project.name, worldId: world.id, revision: 1,
        schemaVersion: input.project.document.version, document: input.project.document, createdAt: now, updatedAt: now,
      }).returning();
      if (!project) throw new PersistenceConflictError("The project could not be created.");

      for (const [position, draft] of input.scenarios.entries()) {
        let [scenario] = await tx.select().from(scenarios).where(eq(scenarios.id, draft.id)).limit(1);
        if (!scenario) {
          if (draft.expectedRevision !== 0) throw new PersistenceNotFoundError(`Scenario “${draft.name}” no longer exists.`);
          [scenario] = await tx.insert(scenarios).values({
            id: draft.id, worldId: world.id, name: draft.name, revision: 1, worldRevision: world.revision,
            schemaVersion: draft.document.version, document: draft.document, createdAt: now, updatedAt: now,
          }).returning();
        } else {
          if (scenario.worldId !== world.id) throw new WorldCompatibilityError();
          if (scenario.revision !== draft.expectedRevision) throw new PersistenceConflictError(`Scenario “${draft.name}” was changed elsewhere.`);
          if (scenario.name !== draft.name || !sameJson(scenario.document, draft.document)) {
            [scenario] = await tx.update(scenarios).set({
              name: draft.name, document: draft.document, revision: scenario.revision + 1, worldRevision: world.revision, updatedAt: now,
            }).where(and(eq(scenarios.id, scenario.id), eq(scenarios.revision, draft.expectedRevision))).returning();
          }
        }
        if (!scenario) throw new PersistenceConflictError(`Scenario “${draft.name}” could not be saved.`);
        await tx.insert(projectScenarios).values({ projectId: project.id, scenarioId: scenario.id, worldId: world.id, position });
      }

      return loadWorkspace(tx, project.id);
    }),

    updateWorkspace: async (input) => db.transaction(async (tx) => {
      const now = new Date();
      const [currentProject] = await tx.select().from(projects).where(eq(projects.id, input.project.id)).limit(1);
      if (!currentProject) throw new PersistenceNotFoundError("This project no longer exists.");
      if (currentProject.revision !== input.project.expectedRevision) throw new PersistenceConflictError("This project was saved elsewhere. Reload it before saving.");
      if (currentProject.worldId !== input.world.id) throw new WorldCompatibilityError();

      let [world] = await tx.select().from(worlds).where(eq(worlds.id, input.world.id)).limit(1);
      if (!world) throw new PersistenceNotFoundError("The project's world no longer exists.");
      if (world.revision !== input.world.expectedRevision) throw new PersistenceConflictError("The world was changed elsewhere. Reload it before saving.");
      if (world.name !== input.world.name || !sameJson(world.document, input.world.document)) {
        [world] = await tx.update(worlds).set({ name: input.world.name, document: input.world.document, revision: world.revision + 1, updatedAt: now })
          .where(and(eq(worlds.id, world.id), eq(worlds.revision, input.world.expectedRevision))).returning();
      }
      if (!world) throw new PersistenceConflictError("The world could not be saved.");

      const [project] = await tx.update(projects).set({
        name: input.project.name,
        document: input.project.document,
        schemaVersion: input.project.document.version,
        revision: currentProject.revision + 1,
        updatedAt: now,
      }).where(and(eq(projects.id, input.project.id), eq(projects.revision, input.project.expectedRevision))).returning();
      if (!project) throw new PersistenceConflictError();

      const savedScenarios: typeof scenarios.$inferSelect[] = [];
      for (const draft of input.scenarios) {
        let [scenario] = await tx.select().from(scenarios).where(eq(scenarios.id, draft.id)).limit(1);
        if (!scenario) {
          if (draft.expectedRevision !== 0) throw new PersistenceNotFoundError(`Scenario “${draft.name}” no longer exists.`);
          [scenario] = await tx.insert(scenarios).values({
            id: draft.id, worldId: world.id, name: draft.name, revision: 1, worldRevision: world.revision,
            schemaVersion: draft.document.version, document: draft.document, createdAt: now, updatedAt: now,
          }).returning();
        } else {
          if (scenario.worldId !== world.id) throw new WorldCompatibilityError();
          if (scenario.revision !== draft.expectedRevision) throw new PersistenceConflictError(`Scenario “${draft.name}” was changed elsewhere.`);
          if (scenario.name !== draft.name || !sameJson(scenario.document, draft.document)) {
            [scenario] = await tx.update(scenarios).set({
              name: draft.name, document: draft.document, schemaVersion: draft.document.version,
              revision: scenario.revision + 1, worldRevision: world.revision, updatedAt: now,
            }).where(and(eq(scenarios.id, scenario.id), eq(scenarios.revision, draft.expectedRevision))).returning();
          }
        }
        if (!scenario) throw new PersistenceConflictError(`Scenario “${draft.name}” could not be saved.`);
        savedScenarios.push(scenario);
      }

      await tx.delete(projectScenarios).where(eq(projectScenarios.projectId, project.id));
      if (savedScenarios.length) {
        await tx.insert(projectScenarios).values(savedScenarios.map((scenario, position) => ({
          projectId: project.id, scenarioId: scenario.id, worldId: world.id, position,
        })));
      }
      return loadWorkspace(tx, project.id);
    }),

    listWorlds: async () => (await db.select({ id: worlds.id, name: worlds.name, revision: worlds.revision, updatedAt: worlds.updatedAt })
      .from(worlds).orderBy(desc(worlds.updatedAt))).map((row) => ({ ...row, updatedAt: iso(row.updatedAt) })),

    getWorld: async (worldId) => {
      const [world] = await db.select().from(worlds).where(eq(worlds.id, worldId)).limit(1);
      if (!world) throw new PersistenceNotFoundError("This world no longer exists.");
      return toWorld(world);
    },

    listScenariosByWorld: async (worldId) => (await db.select().from(scenarios).where(eq(scenarios.worldId, worldId)).orderBy(desc(scenarios.updatedAt))).map(toScenario),
  };
}
