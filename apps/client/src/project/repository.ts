import { normalizeProject, type ProjectDocument } from "../domain/project";
import type { ProjectRecord, ProjectSummary } from "./types";

export class ProjectNotFoundError extends Error {
  constructor(message = "This project no longer exists.") { super(message); }
}
export class ProjectConflictError extends Error {
  constructor(message = "This project was saved elsewhere. Reopen it to see the newer version.") { super(message); }
}
export class DatabaseUnavailableError extends Error {
  constructor(message = "Browser project storage is unavailable.") { super(message); }
}

/** One aggregate crosses this seam; adapters never expose Scenario persistence separately. */
export type ProjectRepository = {
  listProjects: () => Promise<ProjectSummary[]>;
  getProject: (id: string) => Promise<ProjectRecord>;
  createProject: (document: ProjectDocument) => Promise<ProjectRecord>;
  updateProject: (document: ProjectDocument, expectedRevision: number) => Promise<ProjectRecord>;
};

const nowIso = () => new Date().toISOString();

function normalizeMetadata(value: unknown, path: string) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error(`${path} must be an object.`);
  const source = value as Record<string, unknown>;
  if (typeof source.revision !== "number" || !Number.isInteger(source.revision) || source.revision < 1) throw new Error(`${path}.revision must be a positive integer.`);
  for (const field of ["createdAt", "updatedAt"] as const) {
    if (typeof source[field] !== "string" || Number.isNaN(Date.parse(source[field]))) throw new Error(`${path}.${field} must be an ISO timestamp.`);
  }
  return { revision: source.revision, createdAt: source.createdAt as string, updatedAt: source.updatedAt as string };
}

export function normalizeProjectRecord(value: unknown): ProjectRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("project record must be an object.");
  const source = value as Record<string, unknown>;
  return { document: normalizeProject(source.document), ...normalizeMetadata(source, "project record") };
}

function apiError(status: number, body: unknown): Error {
  const message = typeof body === "object" && body !== null && "message" in body && typeof body.message === "string" ? body.message : "The request failed.";
  if (status === 404) return new ProjectNotFoundError(message);
  if (status === 409) return new ProjectConflictError(message);
  if (status === 503) return new DatabaseUnavailableError(message);
  return new Error(message);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { "content-type": "application/json", ...init?.headers } });
  if (response.ok) return response.json() as Promise<T>;
  let body: unknown;
  try { body = await response.json(); } catch { body = undefined; }
  throw apiError(response.status, body);
}

/** Server-backed adapter for the aggregate ProjectRepository contract. */
export function createApiProjectRepository(): ProjectRepository {
  return {
    listProjects: () => request("/api/v1/projects"),
    getProject: async (id) => normalizeProjectRecord(await request(`/api/v1/projects/${encodeURIComponent(id)}`)),
    createProject: async (document) => normalizeProjectRecord(await request("/api/v1/projects", { method: "POST", body: JSON.stringify({ document: normalizeProject(document) }) })),
    updateProject: async (document, expectedRevision) => normalizeProjectRecord(await request(`/api/v1/projects/${encodeURIComponent(document.id)}`, {
      method: "PUT",
      body: JSON.stringify({ document: normalizeProject(document), expectedRevision }),
    })),
  };
}

export function createMemoryProjectRepository(seed: ProjectRecord[] = []): ProjectRepository {
  const projects = new Map<string, ProjectRecord>();
  for (const entry of seed) {
    const record = normalizeProjectRecord(entry);
    if (projects.has(record.document.id)) throw new ProjectConflictError(`Duplicate Project “${record.document.id}”.`);
    projects.set(record.document.id, structuredClone(record));
  }

  return {
    listProjects: async () => [...projects.values()].map(({ document, revision, updatedAt }) => ({
      id: document.id,
      name: document.name,
      revision,
      updatedAt,
      scenarioCount: document.scenarios.length,
    })).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),

    getProject: async (id) => {
      const record = projects.get(id);
      if (!record) throw new ProjectNotFoundError();
      return normalizeProjectRecord(structuredClone(record));
    },

    createProject: async (value) => {
      const document = normalizeProject(value);
      if (projects.has(document.id)) throw new ProjectConflictError("A project with this ID already exists.");
      const timestamp = nowIso();
      const record = { document, revision: 1, createdAt: timestamp, updatedAt: timestamp };
      projects.set(document.id, structuredClone(record));
      return normalizeProjectRecord(structuredClone(record));
    },

    updateProject: async (value, expectedRevision) => {
      const document = normalizeProject(value);
      const current = projects.get(document.id);
      if (!current) throw new ProjectNotFoundError();
      if (current.revision !== expectedRevision) throw new ProjectConflictError();
      const record = { ...current, document, revision: current.revision + 1, updatedAt: nowIso() };
      projects.set(document.id, structuredClone(record));
      return normalizeProjectRecord(structuredClone(record));
    },
  };
}
