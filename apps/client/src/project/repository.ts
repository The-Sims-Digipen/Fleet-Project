import type { ProjectRecord, ProjectSummary, Scenario, WorkspaceRecord, WorkspaceSaveInput, WorldRecord, WorldSummary } from "./types";

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
  listWorlds: () => Promise<WorldSummary[]>;
  getWorld: (id: string) => Promise<WorldRecord>;
  listScenarios: (worldId: string) => Promise<Scenario[]>;
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
    getWorkspace: (id) => request(`/api/v1/projects/${encodeURIComponent(id)}/workspace`),
    createWorkspace: (input) => request("/api/v1/workspaces", { method: "POST", body: JSON.stringify(input) }),
    updateWorkspace: (input) => request(`/api/v1/projects/${encodeURIComponent(input.project.id)}/workspace`, { method: "PUT", body: JSON.stringify(input) }),
    listWorlds: () => request("/api/v1/worlds"),
    getWorld: (id) => request(`/api/v1/worlds/${encodeURIComponent(id)}`),
    listScenarios: (worldId) => request(`/api/v1/worlds/${encodeURIComponent(worldId)}/scenarios`),
  };
}

type MemoryProject = { project: ProjectRecord; worldIds: string[]; scenarioIds: string[] };

/** Test/local substitute with the same multi-world workspace semantics as IndexedDB. */
export function createMemoryProjectRepository(seed: WorkspaceRecord[] = []): ProjectRepository {
  const projects = new Map<string, MemoryProject>();
  const worlds = new Map<string, WorldRecord>();
  const scenarios = new Map<string, Scenario>();

  for (const workspace of seed) {
    for (const world of workspace.worlds) worlds.set(world.id, clone(world));
    for (const scenario of workspace.scenarios) scenarios.set(scenario.id, clone(scenario));
    projects.set(workspace.project.id, {
      project: clone(workspace.project),
      worldIds: workspace.worlds.map((world) => world.id),
      scenarioIds: workspace.scenarios.map((scenario) => scenario.id),
    });
  }

  const workspaceFor = (id: string): WorkspaceRecord => {
    const saved = projects.get(id);
    if (!saved) throw new ProjectNotFoundError();
    const projectWorlds = saved.worldIds.map((worldId) => worlds.get(worldId)).filter((world): world is WorldRecord => Boolean(world));
    if (!projectWorlds.length) throw new ProjectNotFoundError("This project's worlds no longer exist.");
    const projectScenarios = saved.scenarioIds.map((scenarioId) => scenarios.get(scenarioId)).filter((scenario): scenario is Scenario => Boolean(scenario));
    return { project: clone(saved.project), worlds: clone(projectWorlds), scenarios: clone(projectScenarios) };
  };

  const saveWorld = (draft: WorkspaceSaveInput["worlds"][number]): WorldRecord => {
    const existing = worlds.get(draft.id);
    if (existing) {
      if (existing.revision !== draft.expectedRevision) throw new ProjectConflictError(`World “${draft.name}” changed elsewhere.`);
      const changed = existing.name !== draft.name || JSON.stringify(existing.document) !== JSON.stringify(draft.document);
      if (!changed) return clone(existing);
      const next = { ...existing, name: draft.name, document: clone(draft.document), revision: existing.revision + 1, updatedAt: nowIso() };
      worlds.set(next.id, clone(next));
      return next;
    }
    if (draft.expectedRevision !== 0) throw new ProjectNotFoundError(`World “${draft.name}” no longer exists.`);
    const timestamp = nowIso();
    const next: WorldRecord = { id: draft.id, name: draft.name, revision: 1, createdAt: timestamp, updatedAt: timestamp, document: clone(draft.document) };
    worlds.set(next.id, clone(next));
    return next;
  };

  const saveScenario = (draft: WorkspaceSaveInput["scenarios"][number], savedWorlds: Map<string, WorldRecord>): Scenario => {
    const world = savedWorlds.get(draft.worldId);
    if (!world) throw new ProjectConflictError(`Scenario “${draft.name}” references a world outside this project.`);
    const existing = scenarios.get(draft.id);
    if (existing && existing.worldId !== draft.worldId) throw new ProjectConflictError(`Scenario “${draft.name}” belongs to a different world.`);
    if (existing && existing.revision !== draft.expectedRevision) throw new ProjectConflictError(`Scenario “${draft.name}” changed elsewhere.`);
    if (!existing && draft.expectedRevision !== 0) throw new ProjectNotFoundError(`Scenario “${draft.name}” no longer exists.`);
    const timestamp = nowIso();
    const changed = !existing || existing.name !== draft.name || JSON.stringify(existing.document) !== JSON.stringify(draft.document) || existing.worldRevision !== world.revision;
    const next: Scenario = {
      id: draft.id,
      worldId: draft.worldId,
      name: draft.name,
      revision: existing ? existing.revision + (changed ? 1 : 0) : 1,
      worldRevision: world.revision,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: changed ? timestamp : existing?.updatedAt ?? timestamp,
      document: clone(draft.document),
    };
    scenarios.set(next.id, clone(next));
    return next;
  };

  const save = (input: WorkspaceSaveInput, existingProject?: MemoryProject): WorkspaceRecord => {
    const savedWorldList = input.worlds.map(saveWorld);
    const savedWorlds = new Map(savedWorldList.map((world) => [world.id, world]));
    if (!savedWorlds.has(input.project.activeWorldId)) throw new ProjectConflictError("The active world is not part of this project.");
    const savedScenarios = input.scenarios.map((scenario) => saveScenario(scenario, savedWorlds));
    const timestamp = nowIso();
    const activeScenarioId = savedScenarios.some((scenario) => scenario.id === input.project.activeScenarioId) ? input.project.activeScenarioId : undefined;
    const project: ProjectRecord = existingProject ? {
      ...existingProject.project,
      worldId: input.project.activeWorldId,
      activeScenarioId,
      name: input.project.name,
      revision: existingProject.project.revision + 1,
      updatedAt: timestamp,
      document: clone(input.project.document),
    } : {
      id: input.project.id,
      worldId: input.project.activeWorldId,
      activeScenarioId,
      name: input.project.name,
      revision: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      document: clone(input.project.document),
    };

    const oldScenarioIds = new Set(existingProject?.scenarioIds ?? []);
    const nextScenarioIds = new Set(savedScenarios.map((scenario) => scenario.id));
    for (const removedId of oldScenarioIds) {
      if (nextScenarioIds.has(removedId)) continue;
      const usedElsewhere = [...projects.values()].some((entry) => entry.project.id !== project.id && entry.scenarioIds.includes(removedId));
      if (!usedElsewhere) scenarios.delete(removedId);
    }

    const oldWorldIds = new Set(existingProject?.worldIds ?? []);
    const nextWorldIds = new Set(savedWorldList.map((world) => world.id));
    for (const removedId of oldWorldIds) {
      if (nextWorldIds.has(removedId)) continue;
      const usedElsewhere = [...projects.values()].some((entry) => entry.project.id !== project.id && entry.worldIds.includes(removedId));
      if (!usedElsewhere) worlds.delete(removedId);
    }

    projects.set(project.id, {
      project: clone(project),
      worldIds: savedWorldList.map((world) => world.id),
      scenarioIds: savedScenarios.map((scenario) => scenario.id),
    });
    return workspaceFor(project.id);
  };

  return {
    listProjects: async () => [...projects.values()].map((entry) => ({
      id: entry.project.id,
      worldId: entry.project.worldId,
      name: entry.project.name,
      revision: entry.project.revision,
      updatedAt: entry.project.updatedAt,
      scenarioCount: entry.scenarioIds.length,
      worldCount: entry.worldIds.length,
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
    listWorlds: async () => [...worlds.values()].map(({ id, name, revision, updatedAt }) => ({ id, name, revision, updatedAt })).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    getWorld: async (id) => {
      const world = worlds.get(id);
      if (!world) throw new ProjectNotFoundError("This world is not saved.");
      return clone(world);
    },
    listScenarios: async (worldId) => [...scenarios.values()].filter((scenario) => scenario.worldId === worldId).map(clone),
  };
}
