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
const DATABASE_VERSION = 1;

const STORE_PROJECTS = "projects";
const STORE_WORLDS = "worlds";
const STORE_SCENARIOS = "scenarios";
const STORE_LINKS = "projectScenarios";
const INDEX_WORLD_ID = "worldId";
const INDEX_PROJECT_ID = "projectId";

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
      if (!database.objectStoreNames.contains(STORE_WORLDS)) {
        database.createObjectStore(STORE_WORLDS, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(STORE_PROJECTS)) {
        database.createObjectStore(STORE_PROJECTS, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(STORE_SCENARIOS)) {
        const scenarios = database.createObjectStore(STORE_SCENARIOS, { keyPath: "id" });
        scenarios.createIndex(INDEX_WORLD_ID, "worldId", { unique: false });
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
  try {
    return await work(database);
  } catch (error) {
    throw asStorageError(error);
  } finally {
    database.close();
  }
}

function savedWorld(existing: WorldRecord | undefined, input: WorkspaceSaveInput["world"]): WorldRecord {
  if (existing) {
    if (existing.revision !== input.expectedRevision) throw new ProjectConflictError("This world changed in another tab. Reopen the project before saving again.");
    if (existing.name === input.name && sameDocument(existing.document, input.document)) return clone(existing);
    return { ...existing, name: input.name, revision: existing.revision + 1, updatedAt: nowIso(), document: clone(input.document) };
  }
  if (input.expectedRevision !== 0) throw new ProjectNotFoundError("The selected world no longer exists in this browser.");
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
  const transaction = database.transaction([STORE_PROJECTS, STORE_WORLDS, STORE_SCENARIOS, STORE_LINKS], "readonly");
  const project = await requestResult(transaction.objectStore(STORE_PROJECTS).get(id) as IDBRequest<ProjectRecord | undefined>);
  if (!project) {
    transaction.abort();
    throw new ProjectNotFoundError("This project is not saved in this browser.");
  }

  const [world, links] = await Promise.all([
    requestResult(transaction.objectStore(STORE_WORLDS).get(project.worldId) as IDBRequest<WorldRecord | undefined>),
    requestResult(transaction.objectStore(STORE_LINKS).index(INDEX_PROJECT_ID).getAll(IDBKeyRange.only(project.id)) as IDBRequest<ProjectScenarioLink[]>),
  ]);
  if (!world) {
    transaction.abort();
    throw new ProjectNotFoundError("The project's 3D world no longer exists in browser storage.");
  }

  const orderedLinks = [...links].sort((a, b) => a.position - b.position);
  const scenarioStore = transaction.objectStore(STORE_SCENARIOS);
  const scenarios = await Promise.all(orderedLinks.map((link) => requestResult(scenarioStore.get(link.scenarioId) as IDBRequest<Scenario | undefined>)));
  await transactionDone(transaction);

  const missing = scenarios.findIndex((scenario) => !scenario);
  if (missing >= 0) throw new ProjectNotFoundError("A scenario linked to this project no longer exists in browser storage.");
  return { project: clone(project), world: clone(world), scenarios: clone(scenarios as Scenario[]) };
}

/** Browser-local persistence. No server, account or database setup is required. */
export function createIndexedDbProjectRepository(): ProjectRepository {
  return {
    listProjects: () => withDatabase(async (database) => {
      const transaction = database.transaction([STORE_PROJECTS, STORE_LINKS], "readonly");
      const [projects, links] = await Promise.all([
        requestResult(transaction.objectStore(STORE_PROJECTS).getAll() as IDBRequest<ProjectRecord[]>),
        requestResult(transaction.objectStore(STORE_LINKS).getAll() as IDBRequest<ProjectScenarioLink[]>),
      ]);
      await transactionDone(transaction);
      const counts = new Map<string, number>();
      for (const link of links) counts.set(link.projectId, (counts.get(link.projectId) ?? 0) + 1);
      return projects.map<ProjectSummary>((project) => ({
        id: project.id,
        worldId: project.worldId,
        name: project.name,
        revision: project.revision,
        updatedAt: project.updatedAt,
        scenarioCount: counts.get(project.id) ?? 0,
      })).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }),

    getWorkspace: (id) => withDatabase((database) => readWorkspace(database, id)),

    createWorkspace: (input) => withDatabase(async (database) => {
      const transaction = database.transaction([STORE_PROJECTS, STORE_WORLDS, STORE_SCENARIOS, STORE_LINKS], "readwrite");
      const projects = transaction.objectStore(STORE_PROJECTS);
      const worlds = transaction.objectStore(STORE_WORLDS);
      const scenarios = transaction.objectStore(STORE_SCENARIOS);
      const links = transaction.objectStore(STORE_LINKS);

      const [existingProject, existingWorld, ...existingScenarios] = await Promise.all([
        requestResult(projects.get(input.project.id) as IDBRequest<ProjectRecord | undefined>),
        requestResult(worlds.get(input.world.id) as IDBRequest<WorldRecord | undefined>),
        ...input.scenarios.map((scenario) => requestResult(scenarios.get(scenario.id) as IDBRequest<Scenario | undefined>)),
      ]);
      if (existingProject) throw new ProjectConflictError("A project with this ID is already saved in this browser.");

      const world = savedWorld(existingWorld as WorldRecord | undefined, input.world);
      const savedScenarios = input.scenarios.map((scenario, index) => savedScenario(existingScenarios[index] as Scenario | undefined, world, scenario));
      const timestamp = nowIso();
      const project: ProjectRecord = {
        id: input.project.id,
        worldId: world.id,
        name: input.project.name,
        revision: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
        document: clone(input.project.document),
      };

      await Promise.all([
        requestResult(worlds.put(world)),
        requestResult(projects.add(project)),
        ...savedScenarios.map((scenario) => requestResult(scenarios.put(scenario))),
        ...savedScenarios.map((scenario, position) => requestResult(links.put({ projectId: project.id, scenarioId: scenario.id, worldId: world.id, position } satisfies ProjectScenarioLink))),
      ]);
      await transactionDone(transaction);
      return { project: clone(project), world: clone(world), scenarios: clone(savedScenarios) };
    }),

    updateWorkspace: (input) => withDatabase(async (database) => {
      const transaction = database.transaction([STORE_PROJECTS, STORE_WORLDS, STORE_SCENARIOS, STORE_LINKS], "readwrite");
      const projects = transaction.objectStore(STORE_PROJECTS);
      const worlds = transaction.objectStore(STORE_WORLDS);
      const scenarios = transaction.objectStore(STORE_SCENARIOS);
      const links = transaction.objectStore(STORE_LINKS);

      const [currentProject, existingWorld, oldLinks, ...existingScenarios] = await Promise.all([
        requestResult(projects.get(input.project.id) as IDBRequest<ProjectRecord | undefined>),
        requestResult(worlds.get(input.world.id) as IDBRequest<WorldRecord | undefined>),
        requestResult(links.index(INDEX_PROJECT_ID).getAll(IDBKeyRange.only(input.project.id)) as IDBRequest<ProjectScenarioLink[]>),
        ...input.scenarios.map((scenario) => requestResult(scenarios.get(scenario.id) as IDBRequest<Scenario | undefined>)),
      ]);
      if (!currentProject) throw new ProjectNotFoundError("This project is no longer saved in this browser.");
      if (currentProject.revision !== input.project.expectedRevision) throw new ProjectConflictError("This project changed in another tab. Reopen it before saving again.");
      if (currentProject.worldId !== input.world.id) throw new ProjectConflictError("A saved project's world cannot be replaced during Save Project.");

      const world = savedWorld(existingWorld as WorldRecord | undefined, input.world);
      const savedScenarios = input.scenarios.map((scenario, index) => savedScenario(existingScenarios[index] as Scenario | undefined, world, scenario));
      const project: ProjectRecord = {
        ...currentProject,
        name: input.project.name,
        revision: currentProject.revision + 1,
        updatedAt: nowIso(),
        document: clone(input.project.document),
      };

      await Promise.all([
        requestResult(worlds.put(world)),
        requestResult(projects.put(project)),
        ...savedScenarios.map((scenario) => requestResult(scenarios.put(scenario))),
        ...oldLinks.map((link) => requestResult(links.delete([link.projectId, link.scenarioId]))),
      ]);
      await Promise.all(savedScenarios.map((scenario, position) => requestResult(links.put({ projectId: project.id, scenarioId: scenario.id, worldId: world.id, position } satisfies ProjectScenarioLink))));
      await transactionDone(transaction);
      return { project: clone(project), world: clone(world), scenarios: clone(savedScenarios) };
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
