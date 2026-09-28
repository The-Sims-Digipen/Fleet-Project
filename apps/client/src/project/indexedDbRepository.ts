import { DatabaseUnavailableError, ProjectConflictError, ProjectNotFoundError, type ProjectRepository } from "./repository";
import type { ProjectRecord, ProjectSummary, Scenario, WorkspaceRecord, WorkspaceSaveInput } from "./types";
import { normalizeWorkspaceRecord, normalizeWorkspaceSaveInput } from "./serialization";

const DATABASE_NAME = "fleet-transition-planner";
const DATABASE_VERSION = 3;
const STORE_PROJECTS = "projects";
const STORE_SCENARIOS = "scenarios";
const INDEX_PROJECT_ID = "projectId";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const nowIso = () => new Date().toISOString();

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new DatabaseUnavailableError());
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new DatabaseUnavailableError());
    transaction.onabort = () => reject(transaction.error ?? new DatabaseUnavailableError());
  });
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new DatabaseUnavailableError());
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      // Pre-release reset: the old multi-World schema is intentionally discarded.
      for (const storeName of Array.from(database.objectStoreNames)) database.deleteObjectStore(storeName);
      database.createObjectStore(STORE_PROJECTS, { keyPath: "id" });
      const scenarios = database.createObjectStore(STORE_SCENARIOS, { keyPath: "id" });
      scenarios.createIndex(INDEX_PROJECT_ID, "projectId", { unique: false });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new DatabaseUnavailableError());
    request.onblocked = () => reject(new DatabaseUnavailableError("Close other tabs using this app, then retry."));
  });
}

async function withDatabase<T>(operation: (database: IDBDatabase) => Promise<T>): Promise<T> {
  let database: IDBDatabase | undefined;
  try {
    database = await openDatabase();
    return await operation(database);
  } catch (error) {
    if (error instanceof ProjectConflictError || error instanceof ProjectNotFoundError || error instanceof DatabaseUnavailableError) throw error;
    throw new DatabaseUnavailableError(error instanceof Error ? error.message : undefined);
  } finally {
    database?.close();
  }
}

async function loadWorkspace(database: IDBDatabase, projectId: string): Promise<WorkspaceRecord> {
  const transaction = database.transaction([STORE_PROJECTS, STORE_SCENARIOS], "readonly");
  const done = transactionDone(transaction);
  const project = await requestResult(transaction.objectStore(STORE_PROJECTS).get(projectId) as IDBRequest<ProjectRecord | undefined>);
  const scenarios = await requestResult(transaction.objectStore(STORE_SCENARIOS).index(INDEX_PROJECT_ID).getAll(IDBKeyRange.only(projectId)) as IDBRequest<Scenario[]>);
  await done;
  if (!project) throw new ProjectNotFoundError();
  return normalizeWorkspaceRecord({ project: clone(project), scenarios: clone(scenarios.sort((a, b) => a.position - b.position)) });
}

async function saveWorkspace(database: IDBDatabase, rawInput: WorkspaceSaveInput, mode: "create" | "update"): Promise<WorkspaceRecord> {
  const input = normalizeWorkspaceSaveInput(rawInput);
  const transaction = database.transaction([STORE_PROJECTS, STORE_SCENARIOS], "readwrite");
  const done = transactionDone(transaction);
  const projectStore = transaction.objectStore(STORE_PROJECTS);
  const scenarioStore = transaction.objectStore(STORE_SCENARIOS);
  const currentProject = await requestResult(projectStore.get(input.project.id) as IDBRequest<ProjectRecord | undefined>);
  const currentScenarios = await requestResult(scenarioStore.index(INDEX_PROJECT_ID).getAll(IDBKeyRange.only(input.project.id)) as IDBRequest<Scenario[]>);

  if (mode === "create" && currentProject) throw new ProjectConflictError("A project with this ID already exists.");
  if (mode === "update" && !currentProject) throw new ProjectNotFoundError();
  if (mode === "update" && currentProject!.revision !== input.project.expectedRevision) throw new ProjectConflictError();

  const timestamp = nowIso();
  const project: ProjectRecord = currentProject ? {
    ...currentProject,
    name: input.project.name,
    revision: currentProject.revision + 1,
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

  const existingById = new Map(currentScenarios.map((scenario) => [scenario.id, scenario]));
  const savedScenarios = input.scenarios.map((draft, position): Scenario => {
    const current = existingById.get(draft.id);
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

  const nextIds = new Set(savedScenarios.map((scenario) => scenario.id));
  const writes: Promise<unknown>[] = [requestResult(projectStore.put(project))];
  for (const scenario of savedScenarios) writes.push(requestResult(scenarioStore.put(scenario)));
  for (const scenario of currentScenarios) if (!nextIds.has(scenario.id)) writes.push(requestResult(scenarioStore.delete(scenario.id)));
  await Promise.all(writes);
  await done;
  return normalizeWorkspaceRecord({ project, scenarios: savedScenarios });
}

export function createIndexedDbProjectRepository(): ProjectRepository {
  return {
    listProjects: () => withDatabase(async (database) => {
      const transaction = database.transaction([STORE_PROJECTS, STORE_SCENARIOS], "readonly");
      const done = transactionDone(transaction);
      const projects = await requestResult(transaction.objectStore(STORE_PROJECTS).getAll() as IDBRequest<ProjectRecord[]>);
      const scenarios = await requestResult(transaction.objectStore(STORE_SCENARIOS).getAll() as IDBRequest<Scenario[]>);
      await done;
      const counts = new Map<string, number>();
      for (const scenario of scenarios) counts.set(scenario.projectId, (counts.get(scenario.projectId) ?? 0) + 1);
      return projects.map<ProjectSummary>((project) => ({
        id: project.id,
        name: project.name,
        revision: project.revision,
        updatedAt: project.updatedAt,
        scenarioCount: counts.get(project.id) ?? 0,
      })).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }),
    getWorkspace: (id) => withDatabase((database) => loadWorkspace(database, id)),
    createWorkspace: (input) => withDatabase((database) => saveWorkspace(database, input, "create")),
    updateWorkspace: (input) => withDatabase((database) => saveWorkspace(database, input, "update")),
  };
}
