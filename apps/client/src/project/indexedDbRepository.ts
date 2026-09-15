import {
  DatabaseUnavailableError,
  ProjectConflictError,
  ProjectNotFoundError,
  type ProjectRepository,
} from "./repository";
import type {
  ProjectRecord,
  ProjectSummary,
  Scenario,
  WorkspaceRecord,
  WorkspaceSaveInput,
  WorldRecord,
  WorldSummary,
} from "./types";

const DATABASE_NAME = "fleet-transition-planner";
const DATABASE_VERSION = 2;

const STORE_PROJECTS = "projects";
const STORE_WORLDS = "worlds";
const STORE_SCENARIOS = "scenarios";
const STORE_PROJECT_WORLDS = "projectWorlds";
const STORE_LINKS = "projectScenarios";
const INDEX_WORLD_ID = "worldId";
const INDEX_PROJECT_ID = "projectId";

 type ProjectWorldLink = {
  projectId: string;
  worldId: string;
  position: number;
};

type ProjectScenarioLink = {
  projectId: string;
  scenarioId: string;
  worldId: string;
  position: number;
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const nowIso = () => new Date().toISOString();
const sameDocument = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction was aborted."));
  });
}

async function openDatabase(): Promise<IDBDatabase> {
  if (!("indexedDB" in globalThis) || !globalThis.indexedDB) {
    throw new DatabaseUnavailableError("Browser storage is unavailable. Enable site storage or use a supported browser.");
  }

  return new Promise((resolve, reject) => {
    const request = globalThis.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_WORLDS)) database.createObjectStore(STORE_WORLDS, { keyPath: "id" });
      if (!database.objectStoreNames.contains(STORE_PROJECTS)) database.createObjectStore(STORE_PROJECTS, { keyPath: "id" });
      if (!database.objectStoreNames.contains(STORE_SCENARIOS)) {
        const scenarios = database.createObjectStore(STORE_SCENARIOS, { keyPath: "id" });
        scenarios.createIndex(INDEX_WORLD_ID, "worldId", { unique: false });
      }
      if (!database.objectStoreNames.contains(STORE_PROJECT_WORLDS)) {
        const projectWorlds = database.createObjectStore(STORE_PROJECT_WORLDS, { keyPath: ["projectId", "worldId"] });
        projectWorlds.createIndex(INDEX_PROJECT_ID, "projectId", { unique: false });
        projectWorlds.createIndex(INDEX_WORLD_ID, "worldId", { unique: false });
      }
      if (!database.objectStoreNames.contains(STORE_LINKS)) {
        const links = database.createObjectStore(STORE_LINKS, { keyPath: ["projectId", "scenarioId"] });
        links.createIndex(INDEX_PROJECT_ID, "projectId", { unique: false });
        links.createIndex(INDEX_WORLD_ID, "worldId", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new DatabaseUnavailableError(request.error?.message ?? "Browser storage could not be opened."));
    request.onblocked = () => reject(new DatabaseUnavailableError("Browser storage upgrade is blocked by another open tab. Close the other tab and retry."));
  });
}

function asStorageError(error: unknown): Error {
  if (error instanceof ProjectNotFoundError || error instanceof ProjectConflictError || error instanceof DatabaseUnavailableError) return error;
  if (error instanceof DOMException && (error.name === "QuotaExceededError" || error.name === "UnknownError")) {
    return new DatabaseUnavailableError("Browser storage is full or unavailable. Export a backup and free some site storage.");
  }
  return error instanceof Error ? error : new DatabaseUnavailableError();
}

async function withDatabase<T>(work: (database: IDBDatabase) => Promise<T>): Promise<T> {
  const database = await openDatabase();
  try { return await work(database); }
  catch (error) { throw asStorageError(error); }
  finally { database.close(); }
}

function savedWorld(existing: WorldRecord | undefined, input: WorkspaceSaveInput["worlds"][number]): WorldRecord {
  if (existing) {
    if (existing.revision !== input.expectedRevision) throw new ProjectConflictError(`World “${input.name}” changed in another tab.`);
    if (existing.name === input.name && sameDocument(existing.document, input.document)) return clone(existing);
    return { ...existing, name: input.name, revision: existing.revision + 1, updatedAt: nowIso(), document: clone(input.document) };
  }
  if (input.expectedRevision !== 0) throw new ProjectNotFoundError(`World “${input.name}” no longer exists in this browser.`);
  const timestamp = nowIso();
  return { id: input.id, name: input.name, revision: 1, createdAt: timestamp, updatedAt: timestamp, document: clone(input.document) };
}

function savedScenario(existing: Scenario | undefined, world: WorldRecord, input: WorkspaceSaveInput["scenarios"][number]): Scenario {
  if (existing && existing.worldId !== world.id) throw new ProjectConflictError(`Scenario “${input.name}” belongs to a different world.`);
  if (existing && existing.revision !== input.expectedRevision) throw new ProjectConflictError(`Scenario “${input.name}” changed in another tab.`);
  if (!existing && input.expectedRevision !== 0) throw new ProjectNotFoundError(`Scenario “${input.name}” no longer exists in this browser.`);
  const timestamp = nowIso();
  const changed = !existing || existing.name !== input.name || !sameDocument(existing.document, input.document) || existing.worldRevision !== world.revision;
  return {
    id: input.id,
    worldId: world.id,
    name: input.name,
    revision: existing ? existing.revision + (changed ? 1 : 0) : 1,
    worldRevision: world.revision,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: changed ? timestamp : existing?.updatedAt ?? timestamp,
    document: clone(input.document),
  };
}

async function readWorkspace(database: IDBDatabase, id: string): Promise<WorkspaceRecord> {
  const transaction = database.transaction([STORE_PROJECTS, STORE_WORLDS, STORE_SCENARIOS, STORE_PROJECT_WORLDS, STORE_LINKS], "readonly");
  const project = await requestResult(transaction.objectStore(STORE_PROJECTS).get(id) as IDBRequest<ProjectRecord | undefined>);
  if (!project) {
    transaction.abort();
    throw new ProjectNotFoundError("This project is not saved in this browser.");
  }

  const [worldLinks, scenarioLinks] = await Promise.all([
    requestResult(transaction.objectStore(STORE_PROJECT_WORLDS).index(INDEX_PROJECT_ID).getAll(IDBKeyRange.only(project.id)) as IDBRequest<ProjectWorldLink[]>),
    requestResult(transaction.objectStore(STORE_LINKS).index(INDEX_PROJECT_ID).getAll(IDBKeyRange.only(project.id)) as IDBRequest<ProjectScenarioLink[]>),
  ]);

  // v1 IndexedDB projects had no projectWorlds store entries. Treat their active world as the only project world.
  const orderedWorldIds = worldLinks.length
    ? [...worldLinks].sort((a, b) => a.position - b.position).map((link) => link.worldId)
    : [project.worldId];
  const worldStore = transaction.objectStore(STORE_WORLDS);
  const worlds = await Promise.all(orderedWorldIds.map((worldId) => requestResult(worldStore.get(worldId) as IDBRequest<WorldRecord | undefined>)));
  const orderedScenarioLinks = [...scenarioLinks].sort((a, b) => a.position - b.position);
  const scenarioStore = transaction.objectStore(STORE_SCENARIOS);
  const scenarios = await Promise.all(orderedScenarioLinks.map((link) => requestResult(scenarioStore.get(link.scenarioId) as IDBRequest<Scenario | undefined>)));
  await transactionDone(transaction);

  if (worlds.some((world) => !world)) throw new ProjectNotFoundError("One of this project's 3D worlds no longer exists in browser storage.");
  if (scenarios.some((scenario) => !scenario)) throw new ProjectNotFoundError("A scenario linked to this project no longer exists in browser storage.");
  return { project: clone(project), worlds: clone(worlds as WorldRecord[]), scenarios: clone(scenarios as Scenario[]) };
}

async function persistWorkspace(
  transaction: IDBTransaction,
  input: WorkspaceSaveInput,
  currentProject?: ProjectRecord,
): Promise<{ project: ProjectRecord; worlds: WorldRecord[]; scenarios: Scenario[] }> {
  const projects = transaction.objectStore(STORE_PROJECTS);
  const worldStore = transaction.objectStore(STORE_WORLDS);
  const scenarioStore = transaction.objectStore(STORE_SCENARIOS);
  const projectWorlds = transaction.objectStore(STORE_PROJECT_WORLDS);
  const links = transaction.objectStore(STORE_LINKS);

  if (!input.worlds.length) throw new ProjectConflictError("A project needs at least one world.");
  if (!input.worlds.some((world) => world.id === input.project.activeWorldId)) throw new ProjectConflictError("The active world is not part of this project.");
  const worldIds = new Set(input.worlds.map((world) => world.id));
  if (input.scenarios.some((scenario) => !worldIds.has(scenario.worldId))) throw new ProjectConflictError("A scenario references a world outside this project.");

  const [existingWorlds, existingScenarios, oldWorldLinks, oldScenarioLinks] = await Promise.all([
    Promise.all(input.worlds.map((world) => requestResult(worldStore.get(world.id) as IDBRequest<WorldRecord | undefined>))),
    Promise.all(input.scenarios.map((scenario) => requestResult(scenarioStore.get(scenario.id) as IDBRequest<Scenario | undefined>))),
    currentProject ? requestResult(projectWorlds.index(INDEX_PROJECT_ID).getAll(IDBKeyRange.only(input.project.id)) as IDBRequest<ProjectWorldLink[]>) : Promise.resolve([]),
    currentProject ? requestResult(links.index(INDEX_PROJECT_ID).getAll(IDBKeyRange.only(input.project.id)) as IDBRequest<ProjectScenarioLink[]>) : Promise.resolve([]),
  ]);

  const savedWorlds = input.worlds.map((world, index) => savedWorld(existingWorlds[index], world));
  const savedWorldById = new Map(savedWorlds.map((world) => [world.id, world]));
  const savedScenarios = input.scenarios.map((scenario, index) => savedScenario(existingScenarios[index], savedWorldById.get(scenario.worldId)!, scenario));
  const timestamp = nowIso();
  const project: ProjectRecord = currentProject ? {
    ...currentProject,
    worldId: input.project.activeWorldId,
    name: input.project.name,
    revision: currentProject.revision + 1,
    updatedAt: timestamp,
    document: clone(input.project.document),
  } : {
    id: input.project.id,
    worldId: input.project.activeWorldId,
    name: input.project.name,
    revision: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    document: clone(input.project.document),
  };

  await Promise.all([
    requestResult(projects.put(project)),
    ...savedWorlds.map((world) => requestResult(worldStore.put(world))),
    ...savedScenarios.map((scenario) => requestResult(scenarioStore.put(scenario))),
    ...oldWorldLinks.map((link) => requestResult(projectWorlds.delete([link.projectId, link.worldId]))),
    ...oldScenarioLinks.map((link) => requestResult(links.delete([link.projectId, link.scenarioId]))),
  ]);
  await Promise.all([
    ...savedWorlds.map((world, position) => requestResult(projectWorlds.put({ projectId: project.id, worldId: world.id, position } satisfies ProjectWorldLink))),
    ...savedScenarios.map((scenario, position) => requestResult(links.put({ projectId: project.id, scenarioId: scenario.id, worldId: scenario.worldId, position } satisfies ProjectScenarioLink))),
  ]);

  // A removed scenario disappears from this project immediately. Delete the backing record only when no other project links it.
  const nextScenarioIds = new Set(savedScenarios.map((scenario) => scenario.id));
  const removedScenarioIds = oldScenarioLinks.map((link) => link.scenarioId).filter((id) => !nextScenarioIds.has(id));
  if (removedScenarioIds.length) {
    const allLinks = await requestResult(links.getAll() as IDBRequest<ProjectScenarioLink[]>);
    await Promise.all(removedScenarioIds.filter((scenarioId) => !allLinks.some((link) => link.scenarioId === scenarioId)).map((scenarioId) => requestResult(scenarioStore.delete(scenarioId))));
  }

  return { project, worlds: savedWorlds, scenarios: savedScenarios };
}

/** Browser-local persistence. All project worlds/scenarios are committed only when Save Project is used. */
export function createIndexedDbProjectRepository(): ProjectRepository {
  return {
    listProjects: () => withDatabase(async (database) => {
      const transaction = database.transaction([STORE_PROJECTS, STORE_PROJECT_WORLDS, STORE_LINKS], "readonly");
      const [projects, worldLinks, scenarioLinks] = await Promise.all([
        requestResult(transaction.objectStore(STORE_PROJECTS).getAll() as IDBRequest<ProjectRecord[]>),
        requestResult(transaction.objectStore(STORE_PROJECT_WORLDS).getAll() as IDBRequest<ProjectWorldLink[]>),
        requestResult(transaction.objectStore(STORE_LINKS).getAll() as IDBRequest<ProjectScenarioLink[]>),
      ]);
      await transactionDone(transaction);
      const worldCounts = new Map<string, number>();
      const scenarioCounts = new Map<string, number>();
      for (const link of worldLinks) worldCounts.set(link.projectId, (worldCounts.get(link.projectId) ?? 0) + 1);
      for (const link of scenarioLinks) scenarioCounts.set(link.projectId, (scenarioCounts.get(link.projectId) ?? 0) + 1);
      return projects.map<ProjectSummary>((project) => ({
        id: project.id,
        worldId: project.worldId,
        name: project.name,
        revision: project.revision,
        updatedAt: project.updatedAt,
        scenarioCount: scenarioCounts.get(project.id) ?? 0,
        worldCount: worldCounts.get(project.id) ?? 1,
      })).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }),

    getWorkspace: (id) => withDatabase((database) => readWorkspace(database, id)),

    createWorkspace: (input) => withDatabase(async (database) => {
      const transaction = database.transaction([STORE_PROJECTS, STORE_WORLDS, STORE_SCENARIOS, STORE_PROJECT_WORLDS, STORE_LINKS], "readwrite");
      const existingProject = await requestResult(transaction.objectStore(STORE_PROJECTS).get(input.project.id) as IDBRequest<ProjectRecord | undefined>);
      if (existingProject) {
        transaction.abort();
        throw new ProjectConflictError("A project with this ID is already saved in this browser.");
      }
      const result = await persistWorkspace(transaction, input);
      await transactionDone(transaction);
      return clone(result);
    }),

    updateWorkspace: (input) => withDatabase(async (database) => {
      const transaction = database.transaction([STORE_PROJECTS, STORE_WORLDS, STORE_SCENARIOS, STORE_PROJECT_WORLDS, STORE_LINKS], "readwrite");
      const currentProject = await requestResult(transaction.objectStore(STORE_PROJECTS).get(input.project.id) as IDBRequest<ProjectRecord | undefined>);
      if (!currentProject) {
        transaction.abort();
        throw new ProjectNotFoundError("This project is no longer saved in this browser.");
      }
      if (currentProject.revision !== input.project.expectedRevision) {
        transaction.abort();
        throw new ProjectConflictError("This project changed in another tab. Reopen it before saving again.");
      }
      const result = await persistWorkspace(transaction, input, currentProject);
      await transactionDone(transaction);
      return clone(result);
    }),

    listWorlds: () => withDatabase(async (database) => {
      const transaction = database.transaction(STORE_WORLDS, "readonly");
      const worlds = await requestResult(transaction.objectStore(STORE_WORLDS).getAll() as IDBRequest<WorldRecord[]>);
      await transactionDone(transaction);
      return worlds.map<WorldSummary>(({ id, name, revision, updatedAt }) => ({ id, name, revision, updatedAt })).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }),

    getWorld: (id) => withDatabase(async (database) => {
      const transaction = database.transaction(STORE_WORLDS, "readonly");
      const world = await requestResult(transaction.objectStore(STORE_WORLDS).get(id) as IDBRequest<WorldRecord | undefined>);
      await transactionDone(transaction);
      if (!world) throw new ProjectNotFoundError("This world is not saved in this browser.");
      return clone(world);
    }),

    listScenarios: (worldId) => withDatabase(async (database) => {
      const transaction = database.transaction(STORE_SCENARIOS, "readonly");
      const scenarios = await requestResult(transaction.objectStore(STORE_SCENARIOS).index(INDEX_WORLD_ID).getAll(IDBKeyRange.only(worldId)) as IDBRequest<Scenario[]>);
      await transactionDone(transaction);
      return clone(scenarios).sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
    }),
  };
}
