import type { ProjectDocument, ProjectRecord, ProjectSummary } from "./types";

export class ProjectNotFoundError extends Error {
  constructor() { super("This project no longer exists."); }
}

export class ProjectConflictError extends Error {
  constructor() { super("This project was saved elsewhere. Reopen it to see the newer version."); }
}

/** Storage boundary for projects. The in-memory version is replaced by the API client in F09. */
export type ProjectRepository = {
  list: () => Promise<ProjectSummary[]>;
  get: (id: string) => Promise<ProjectRecord>;
  create: (name: string, document: ProjectDocument) => Promise<ProjectRecord>;
  update: (id: string, expectedRevision: number, name: string, document: ProjectDocument) => Promise<ProjectRecord>;
};

// Records cross the boundary as copies, matching JSON sent to and from a server.
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export function createMemoryProjectRepository(seed: ProjectRecord[] = [], now = () => new Date()): ProjectRepository {
  const records = new Map(seed.map((record) => [record.id, clone(record)]));
  const find = (id: string) => {
    const record = records.get(id);
    if (!record) throw new ProjectNotFoundError();
    return record;
  };

  return {
    list: async () => [...records.values()]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(({ id, name, revision, updatedAt, document }) => ({ id, name, revision, updatedAt, scenarioCount: document.scenarios.length })),
    get: async (id) => clone(find(id)),
    create: async (name, document) => {
      const timestamp = now().toISOString();
      const record: ProjectRecord = { id: crypto.randomUUID(), name, revision: 1, createdAt: timestamp, updatedAt: timestamp, document: clone(document) };
      records.set(record.id, record);
      return clone(record);
    },
    update: async (id, expectedRevision, name, document) => {
      const current = find(id);
      if (current.revision !== expectedRevision) throw new ProjectConflictError();
      const record: ProjectRecord = { ...current, name, revision: current.revision + 1, updatedAt: now().toISOString(), document: clone(document) };
      records.set(id, record);
      return clone(record);
    },
  };
}
