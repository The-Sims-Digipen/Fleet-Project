import { and, asc, desc, eq, sql } from "drizzle-orm";

import type { Database } from "../db/client.js";
import { projects, scenarios } from "../db/schema.js";
import { projectDocumentSchema, type CreateWorkspaceInput, type LegacyProjectDocument, type ProjectDocument, type ScenarioDocument, type UpdateWorkspaceInput } from "./schemas.js";

export class PersistenceNotFoundError extends Error {
  constructor(message = "The requested record no longer exists.") { super(message); }
}
export class PersistenceConflictError extends Error {
  constructor(message = "This record was saved elsewhere. Reload it before saving again.") { super(message); }
}
export class PersistenceInvalidRecordError extends Error {
  constructor() { super("The stored Project does not match the aggregate persistence contract."); }
}
export type LegacyScenarioRecord = {
  id: string;
  projectId: string;
  name: string;
  position: number;
  revision: number;
  createdAt: string;
  updatedAt: string;
  document: ScenarioDocument;
};
export type LegacyProjectRecord = {
  id: string;
  name: string;
  activeScenarioId?: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  document: LegacyProjectDocument;
};
export type WorkspaceRecord = { project: LegacyProjectRecord; scenarios: LegacyScenarioRecord[] };
export type ProjectRecord = {
  document: ProjectDocument;
  revision: number;
  createdAt: string;
  updatedAt: string;
};
export type ProjectSummary = {
  id: string;
  name: string;
  revision: number;
  updatedAt: string;
  scenarioCount: number;
};

export type ProjectPersistenceRepository = {
  listProjects(): Promise<ProjectSummary[]>;
  getProject(projectId: string): Promise<ProjectRecord>;
  createProject(document: ProjectDocument): Promise<ProjectRecord>;
  updateProject(document: ProjectDocument, expectedRevision: number): Promise<ProjectRecord>;
};

export type PersistenceRepository = ProjectPersistenceRepository & {
  ready(): Promise<void>;
  getWorkspace(projectId: string): Promise<WorkspaceRecord>;
  createWorkspace(input: CreateWorkspaceInput): Promise<WorkspaceRecord>;
  updateWorkspace(input: UpdateWorkspaceInput): Promise<WorkspaceRecord>;
};

const iso = (value: Date) => value.toISOString();
const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}
type ReadDatabase = Pick<Database, "select">;

const toLegacyProject = (row: typeof projects.$inferSelect): LegacyProjectRecord => ({
  id: row.id,
  name: row.name,
  activeScenarioId: row.activeScenarioId ?? undefined,
  revision: row.revision,
  createdAt: iso(row.createdAt),
  updatedAt: iso(row.updatedAt),
  document: row.document as LegacyProjectDocument,
});
const toLegacyScenario = (row: typeof scenarios.$inferSelect): LegacyScenarioRecord => ({
  id: row.id,
  projectId: row.projectId,
  name: row.name,
  position: row.position,
  revision: row.revision,
  createdAt: iso(row.createdAt),
  updatedAt: iso(row.updatedAt),
  document: row.document as ScenarioDocument,
});

function toProjectRecord(row: typeof projects.$inferSelect): ProjectRecord {
  let document: ProjectDocument;
  try {
    document = projectDocumentSchema.parse(row.document);
  } catch {
    throw new PersistenceInvalidRecordError();
  }
  if (document.id !== row.id || row.schemaVersion !== document.version) throw new PersistenceInvalidRecordError();
  return { document, revision: row.revision, createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt) };
}

async function loadWorkspace(db: ReadDatabase, projectId: string): Promise<WorkspaceRecord> {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) throw new PersistenceNotFoundError("This project no longer exists.");
  const scenarioRows = await db.select().from(scenarios)
    .where(eq(scenarios.projectId, projectId))
    .orderBy(asc(scenarios.position));
  return { project: toLegacyProject(project), scenarios: scenarioRows.map(toLegacyScenario) };
}

export function createPersistenceRepository(db: Database): PersistenceRepository {
  return {
    ready: async () => { await db.execute(sql`select 1`); },

    listProjects: async () => {
      const rows = await db.select({
        id: projects.id,
        name: projects.name,
        revision: projects.revision,
        updatedAt: projects.updatedAt,
        document: projects.document,
        legacyScenarioCount: sql<number>`count(${scenarios.id})::int`,
      }).from(projects)
        .leftJoin(scenarios, eq(projects.id, scenarios.projectId))
        .groupBy(projects.id)
        .orderBy(desc(projects.updatedAt));
      return rows.map((row) => {
        const document = row.document as { name?: unknown; scenarios?: unknown };
        return {
          id: row.id,
          name: typeof document.name === "string" ? document.name : row.name,
          revision: row.revision,
          updatedAt: iso(row.updatedAt),
          scenarioCount: Array.isArray(document.scenarios) ? document.scenarios.length : row.legacyScenarioCount,
        };
      });
    },

    getProject: async (projectId) => {
      const [row] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
      if (!row) throw new PersistenceNotFoundError("This project no longer exists.");
      return toProjectRecord(row);
    },

    createProject: async (document) => {
      try {
        return await db.transaction(async (tx) => {
          const [existing] = await tx.select({ id: projects.id }).from(projects).where(eq(projects.id, document.id)).limit(1);
          if (existing) throw new PersistenceConflictError("A project with this ID already exists.");
          const now = new Date();
          const [row] = await tx.insert(projects).values({
            id: document.id,
            name: document.name,
            activeScenarioId: null,
            revision: 1,
            schemaVersion: document.version,
            document,
            createdAt: now,
            updatedAt: now,
          }).returning();
          if (!row) throw new PersistenceConflictError("The project could not be created.");
          return toProjectRecord(row);
        });
      } catch (error) {
        if (isUniqueViolation(error)) throw new PersistenceConflictError("A project with this ID already exists.");
        throw error;
      }
    },

    updateProject: async (document, expectedRevision) => db.transaction(async (tx) => {
      const [current] = await tx.select().from(projects).where(eq(projects.id, document.id)).limit(1);
      if (!current) throw new PersistenceNotFoundError("This project no longer exists.");
      if (current.revision !== expectedRevision) throw new PersistenceConflictError("This project was saved elsewhere. Reload it before saving.");
      const [row] = await tx.update(projects).set({
        name: document.name,
        activeScenarioId: null,
        document,
        schemaVersion: document.version,
        revision: current.revision + 1,
        updatedAt: new Date(),
      }).where(and(eq(projects.id, document.id), eq(projects.revision, expectedRevision))).returning();
      if (!row) throw new PersistenceConflictError("This project was saved elsewhere. Reload it before saving.");
      return toProjectRecord(row);
    }),

    getWorkspace: (projectId) => loadWorkspace(db, projectId),

    createWorkspace: async (input) => db.transaction(async (tx) => {
      const now = new Date();
      const [existingProject] = await tx.select({ id: projects.id }).from(projects).where(eq(projects.id, input.project.id)).limit(1);
      if (existingProject) throw new PersistenceConflictError("A project with this ID already exists.");

      for (const draft of input.scenarios) {
        const [existingScenario] = await tx.select({ id: scenarios.id }).from(scenarios).where(eq(scenarios.id, draft.id)).limit(1);
        if (existingScenario) throw new PersistenceConflictError(`A scenario with ID “${draft.id}” already exists.`);
        if (draft.expectedRevision !== 0) throw new PersistenceNotFoundError(`Scenario “${draft.name}” no longer exists.`);
      }

      const [project] = await tx.insert(projects).values({
        id: input.project.id,
        name: input.project.name,
        activeScenarioId: input.project.activeScenarioId ?? null,
        revision: 1,
        schemaVersion: input.project.document.version,
        document: input.project.document,
        createdAt: now,
        updatedAt: now,
      }).returning();
      if (!project) throw new PersistenceConflictError("The project could not be created.");

      await tx.insert(scenarios).values(input.scenarios.map((draft, position) => ({
        id: draft.id,
        projectId: project.id,
        name: draft.name,
        position,
        revision: 1,
        schemaVersion: draft.document.version,
        document: draft.document,
        createdAt: now,
        updatedAt: now,
      })));
      return loadWorkspace(tx, project.id);
    }),

    updateWorkspace: async (input) => db.transaction(async (tx) => {
      const now = new Date();
      const [currentProject] = await tx.select().from(projects).where(eq(projects.id, input.project.id)).limit(1);
      if (!currentProject) throw new PersistenceNotFoundError("This project no longer exists.");
      if (currentProject.revision !== input.project.expectedRevision) throw new PersistenceConflictError("This project was saved elsewhere. Reload it before saving.");

      const currentScenarios = await tx.select().from(scenarios).where(eq(scenarios.projectId, currentProject.id));
      const currentById = new Map(currentScenarios.map((scenario) => [scenario.id, scenario]));
      for (const draft of input.scenarios) {
        const current = currentById.get(draft.id);
        if (current) {
          if (current.revision !== draft.expectedRevision) throw new PersistenceConflictError(`Scenario “${draft.name}” was changed elsewhere.`);
          continue;
        }
        const [foreign] = await tx.select({ projectId: scenarios.projectId }).from(scenarios).where(eq(scenarios.id, draft.id)).limit(1);
        if (foreign) throw new PersistenceConflictError(`Scenario “${draft.name}” belongs to another project.`);
        if (draft.expectedRevision !== 0) throw new PersistenceNotFoundError(`Scenario “${draft.name}” no longer exists.`);
      }

      const [project] = await tx.update(projects).set({
        name: input.project.name,
        activeScenarioId: input.project.activeScenarioId ?? null,
        document: input.project.document,
        schemaVersion: input.project.document.version,
        revision: currentProject.revision + 1,
        updatedAt: now,
      }).where(and(eq(projects.id, input.project.id), eq(projects.revision, input.project.expectedRevision))).returning();
      if (!project) throw new PersistenceConflictError();

      const retained = new Set(input.scenarios.map((scenario) => scenario.id));
      for (const current of currentScenarios) {
        if (!retained.has(current.id)) await tx.delete(scenarios).where(eq(scenarios.id, current.id));
      }

      if (currentScenarios.length) {
        await tx.update(scenarios)
          .set({ position: sql`${scenarios.position} + 1000000` })
          .where(eq(scenarios.projectId, currentProject.id));
      }

      for (const [position, draft] of input.scenarios.entries()) {
        const current = currentById.get(draft.id);
        if (!current) {
          await tx.insert(scenarios).values({
            id: draft.id,
            projectId: project.id,
            name: draft.name,
            position,
            revision: 1,
            schemaVersion: draft.document.version,
            document: draft.document,
            createdAt: now,
            updatedAt: now,
          });
          continue;
        }
        const changed = current.name !== draft.name || current.position !== position || !sameJson(current.document, draft.document);
        await tx.update(scenarios).set({
          name: draft.name,
          position,
          document: draft.document,
          schemaVersion: draft.document.version,
          revision: changed ? current.revision + 1 : current.revision,
          updatedAt: changed ? now : current.updatedAt,
        }).where(and(eq(scenarios.id, current.id), eq(scenarios.revision, draft.expectedRevision)));
      }
      return loadWorkspace(tx, project.id);
    }),
  };
}
