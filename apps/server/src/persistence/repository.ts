import { and, desc, eq, sql } from "drizzle-orm";

import type { Database } from "../db/client.js";
import { projects } from "../db/schema.js";
import { projectDocumentSchema, type ProjectDocument } from "./schemas.js";

export class PersistenceNotFoundError extends Error {
  constructor(message = "The requested record no longer exists.") { super(message); }
}
export class PersistenceConflictError extends Error {
  constructor(message = "This record was saved elsewhere. Reload it before saving again.") { super(message); }
}
export class PersistenceInvalidRecordError extends Error {
  constructor() { super("The stored Project does not match the aggregate persistence contract."); }
}

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

export type PersistenceRepository = ProjectPersistenceRepository & { ready(): Promise<void> };

const iso = (value: Date) => value.toISOString();
function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

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

export function createPersistenceRepository(db: Database): PersistenceRepository {
  return {
    ready: async () => { await db.execute(sql`select 1`); },

    listProjects: async () => {
      const rows = await db.select().from(projects).orderBy(desc(projects.updatedAt));
      return rows.map((row) => {
        const record = toProjectRecord(row);
        return {
          id: record.document.id,
          name: record.document.name,
          revision: record.revision,
          updatedAt: record.updatedAt,
          scenarioCount: record.document.scenarios.length,
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
        document,
        schemaVersion: document.version,
        revision: current.revision + 1,
        updatedAt: new Date(),
      }).where(and(eq(projects.id, document.id), eq(projects.revision, expectedRevision))).returning();
      if (!row) throw new PersistenceConflictError("This project was saved elsewhere. Reload it before saving.");
      return toProjectRecord(row);
    }),
  };
}
