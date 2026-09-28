import type { ProjectRecord, ProjectSummary, Scenario, WorkspaceRecord, WorkspaceSaveInput } from "./types";
import { normalizeWorkspaceRecord, normalizeWorkspaceSaveInput } from "./serialization";

export class ProjectNotFoundError extends Error {
  constructor(message = "This project no longer exists.") { super(message); }
}
export class ProjectConflictError extends Error {
  constructor(message = "This project was saved elsewhere. Reopen it to see the newer version.") { super(message); }
}
export class DatabaseUnavailableError extends Error {
  constructor(message = "Browser project storage is unavailable.") { super(message); }
}

export type ProjectRepository = {
  listProjects: () => Promise<ProjectSummary[]>;
  getWorkspace: (id: string) => Promise<WorkspaceRecord>;
  createWorkspace: (input: WorkspaceSaveInput) => Promise<WorkspaceRecord>;
  updateWorkspace: (input: WorkspaceSaveInput & { project: WorkspaceSaveInput["project"] & { expectedRevision: number } }) => Promise<WorkspaceRecord>;
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const nowIso = () => new Date().toISOString();

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

/** Future cloud adapter. The browser prototype uses IndexedDB instead. */
export function createApiProjectRepository(): ProjectRepository {
  return {
    listProjects: () => request("/api/v1/projects"),
    getWorkspace: async (id) => normalizeWorkspaceRecord(await request(`/api/v1/projects/${encodeURIComponent(id)}/workspace`)),
    createWorkspace: async (input) => normalizeWorkspaceRecord(await request("/api/v1/workspaces", { method: "POST", body: JSON.stringify(normalizeWorkspaceSaveInput(input)) })),
    updateWorkspace: async (input) => normalizeWorkspaceRecord(await request(`/api/v1/projects/${encodeURIComponent(input.project.id)}/workspace`, { method: "PUT", body: JSON.stringify(normalizeWorkspaceSaveInput(input)) })),
  };
}

type MemoryProject = { project: ProjectRecord; scenarioIds: string[] };

/** In-memory adapter with the same atomic Project/Scenario semantics as IndexedDB. */
export function createMemoryProjectRepository(seed: WorkspaceRecord[] = []): ProjectRepository {
  const projects = new Map<string, MemoryProject>();
  const scenarios = new Map<string, Scenario>();

  for (const workspace of seed) {
    const normalized = normalizeWorkspaceRecord(workspace);
    for (const scenario of normalized.scenarios) scenarios.set(scenario.id, clone(scenario));
    projects.set(normalized.project.id, { project: clone(normalized.project), scenarioIds: normalized.scenarios.map((scenario) => scenario.id) });
  }

  const workspaceFor = (id: string): WorkspaceRecord => {
    const saved = projects.get(id);
    if (!saved) throw new ProjectNotFoundError();
    const projectScenarios = saved.scenarioIds.map((scenarioId) => scenarios.get(scenarioId)).filter((scenario): scenario is Scenario => Boolean(scenario));
    if (!projectScenarios.length) throw new ProjectNotFoundError("This project's scenarios no longer exist.");
    return normalizeWorkspaceRecord({ project: clone(saved.project), scenarios: clone(projectScenarios) });
  };

  const save = (rawInput: WorkspaceSaveInput, existing?: MemoryProject): WorkspaceRecord => {
    const input = normalizeWorkspaceSaveInput(rawInput);
    const timestamp = nowIso();
    const project: ProjectRecord = existing ? {
      ...existing.project,
      name: input.project.name,
      revision: existing.project.revision + 1,
      updatedAt: timestamp,
      document: clone(input.project.document),
    } : {
      id: input.project.id,
      name: input.project.name,
      revision: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      document: clone(input.project.document),
    };

    const savedScenarios = input.scenarios.map((draft, position): Scenario => {
      const current = scenarios.get(draft.id);
      if (current && current.projectId !== project.id) throw new ProjectConflictError(`Scenario “${draft.name}” belongs to another project.`);
      if (current && current.revision !== draft.expectedRevision) throw new ProjectConflictError(`Scenario “${draft.name}” changed elsewhere.`);
      if (!current && draft.expectedRevision !== 0) throw new ProjectNotFoundError(`Scenario “${draft.name}” no longer exists.`);
      const changed = !current || current.name !== draft.name || current.position !== position || JSON.stringify(current.document) !== JSON.stringify(draft.document);
      return {
        id: draft.id,
        projectId: project.id,
        name: draft.name,
        position,
        revision: current ? current.revision + (changed ? 1 : 0) : 1,
        createdAt: current?.createdAt ?? timestamp,
        updatedAt: changed ? timestamp : current?.updatedAt ?? timestamp,
        document: clone(draft.document),
      };
    });

    const removed = new Set(existing?.scenarioIds ?? []);
    for (const scenario of savedScenarios) removed.delete(scenario.id);
    for (const scenarioId of removed) scenarios.delete(scenarioId);
    for (const scenario of savedScenarios) scenarios.set(scenario.id, clone(scenario));
    projects.set(project.id, { project: clone(project), scenarioIds: savedScenarios.map((scenario) => scenario.id) });
    return workspaceFor(project.id);
  };

  return {
    listProjects: async () => [...projects.values()].map(({ project, scenarioIds }) => ({
      id: project.id,
      name: project.name,
      revision: project.revision,
      updatedAt: project.updatedAt,
      scenarioCount: scenarioIds.length,
    })).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    getWorkspace: async (id) => workspaceFor(id),
    createWorkspace: async (input) => {
      if (projects.has(input.project.id)) throw new ProjectConflictError("A project with this ID already exists.");
      return save(input);
    },
    updateWorkspace: async (input) => {
      const current = projects.get(input.project.id);
      if (!current) throw new ProjectNotFoundError();
      if (current.project.revision !== input.project.expectedRevision) throw new ProjectConflictError();
      return save(input, current);
    },
  };
}
