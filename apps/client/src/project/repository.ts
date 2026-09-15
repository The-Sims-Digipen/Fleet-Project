import type { ProjectSummary, Scenario, WorkspaceRecord, WorkspaceSaveInput, WorldRecord, WorldSummary } from "./types";

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

/** Test/local substitute with the same separate-world semantics as the API. */
export function createMemoryProjectRepository(seed: WorkspaceRecord[] = []): ProjectRepository {
  const workspaces = new Map(seed.map((workspace) => [workspace.project.id, clone(workspace)]));
  const worlds = new Map<string, WorldRecord>();
  const scenarios = new Map<string, Scenario>();
  for (const workspace of seed) {
    worlds.set(workspace.world.id, clone(workspace.world));
    for (const scenario of workspace.scenarios) scenarios.set(scenario.id, clone(scenario));
  }

  const workspaceFor = (id: string) => {
    const workspace = workspaces.get(id);
    if (!workspace) throw new ProjectNotFoundError();
    const world = worlds.get(workspace.project.worldId);
    if (!world) throw new ProjectNotFoundError("The project's world no longer exists.");
    return { project: clone(workspace.project), world: clone(world), scenarios: workspace.scenarios.map((item) => clone(scenarios.get(item.id) ?? item)) };
  };

  const saveScenarios = (world: WorldRecord, drafts: WorkspaceSaveInput["scenarios"]): Scenario[] => drafts.map((draft) => {
    const existing = scenarios.get(draft.id);
    if (existing && existing.worldId !== world.id) throw new ProjectConflictError("The scenario belongs to a different world.");
    if (existing && existing.revision !== draft.expectedRevision) throw new ProjectConflictError(`Scenario “${draft.name}” was changed elsewhere.`);
    if (!existing && draft.expectedRevision !== 0) throw new ProjectNotFoundError(`Scenario “${draft.name}” no longer exists.`);
    const timestamp = nowIso();
    const changed = !existing || existing.name !== draft.name || JSON.stringify(existing.document) !== JSON.stringify(draft.document);
    const scenario: Scenario = {
      id: draft.id, worldId: world.id, name: draft.name,
      revision: existing ? existing.revision + (changed ? 1 : 0) : 1,
      worldRevision: world.revision,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: changed ? timestamp : existing?.updatedAt ?? timestamp,
      document: clone(draft.document),
    };
    scenarios.set(scenario.id, clone(scenario));
    return scenario;
  });

  return {
    listProjects: async () => [...workspaces.values()].map((workspace) => ({
      id: workspace.project.id, worldId: workspace.project.worldId, name: workspace.project.name,
      revision: workspace.project.revision, updatedAt: workspace.project.updatedAt, scenarioCount: workspace.scenarios.length,
    })).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    getWorkspace: async (id) => workspaceFor(id),
    createWorkspace: async (input) => {
      if (workspaces.has(input.project.id)) throw new ProjectConflictError("A project with this ID already exists.");
      let world = worlds.get(input.world.id);
      if (world) {
        if (world.revision !== input.world.expectedRevision) throw new ProjectConflictError("The world was changed elsewhere.");
        const changed = world.name !== input.world.name || JSON.stringify(world.document) !== JSON.stringify(input.world.document);
        if (changed) {
          world = {
            ...world,
            name: input.world.name,
            document: clone(input.world.document),
            revision: world.revision + 1,
            updatedAt: nowIso(),
          };
          worlds.set(world.id, clone(world));
        }
      } else {
        if (input.world.expectedRevision !== 0) throw new ProjectNotFoundError("The selected world no longer exists.");
        const timestamp = nowIso();
        world = { id: input.world.id, name: input.world.name, revision: 1, createdAt: timestamp, updatedAt: timestamp, document: clone(input.world.document) };
        worlds.set(world.id, clone(world));
      }
      const timestamp = nowIso();
      const project = { id: input.project.id, worldId: world.id, name: input.project.name, revision: 1, createdAt: timestamp, updatedAt: timestamp, document: clone(input.project.document) };
      const saved = saveScenarios(world, input.scenarios);
      workspaces.set(project.id, { project: clone(project), world: clone(world), scenarios: clone(saved) });
      return workspaceFor(project.id);
    },
    updateWorkspace: async (input) => {
      const current = workspaces.get(input.project.id);
      if (!current) throw new ProjectNotFoundError();
      if (current.project.revision !== input.project.expectedRevision) throw new ProjectConflictError();
      const world = worlds.get(current.project.worldId);
      if (!world) throw new ProjectNotFoundError("The project's world no longer exists.");
      if (world.id !== input.world.id || world.revision !== input.world.expectedRevision) throw new ProjectConflictError("The world was changed elsewhere.");
      if (world.name !== input.world.name || JSON.stringify(world.document) !== JSON.stringify(input.world.document)) {
        world.name = input.world.name;
        world.document = clone(input.world.document);
        world.revision += 1;
        world.updatedAt = nowIso();
        worlds.set(world.id, clone(world));
      }
      const project = { ...current.project, name: input.project.name, revision: current.project.revision + 1, updatedAt: nowIso(), document: clone(input.project.document) };
      const saved = saveScenarios(world, input.scenarios);
      workspaces.set(project.id, { project: clone(project), world: clone(world), scenarios: clone(saved) });
      return workspaceFor(project.id);
    },
    listWorlds: async () => [...worlds.values()].map(({ id, name, revision, updatedAt }) => ({ id, name, revision, updatedAt })).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    getWorld: async (id) => {
      const world = worlds.get(id);
      if (!world) throw new ProjectNotFoundError("This world no longer exists.");
      return clone(world);
    },
    listScenarios: async (worldId) => [...scenarios.values()].filter((scenario) => scenario.worldId === worldId).map(clone),
  };
}
