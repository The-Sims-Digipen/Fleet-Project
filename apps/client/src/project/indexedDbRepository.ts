import { normalizeProject, type ProjectDocument } from "../domain/project";
import {
  DatabaseUnavailableError,
  normalizeProjectRecord,
  ProjectConflictError,
  ProjectNotFoundError,
  type ProjectRepository,
} from "./repository";
import type { ProjectRecord, ProjectSummary } from "./types";

const DATABASE_NAME = "fleet-transition-planner";
const DATABASE_VERSION = 5;
const LAST_LEGACY_DATABASE_VERSION = 4;
const STORE_PROJECTS = "projects";

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

function openDatabase(databaseName: string): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new DatabaseUnavailableError());
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, DATABASE_VERSION);
    request.onupgradeneeded = (event) => {
      const database = request.result;
      if (event.oldVersion > 0 && event.oldVersion <= LAST_LEGACY_DATABASE_VERSION) {
        // Pre-release records used superseded schemas and are intentionally reset.
        for (const storeName of Array.from(database.objectStoreNames)) database.deleteObjectStore(storeName);
      }
      if (!database.objectStoreNames.contains(STORE_PROJECTS)) {
        database.createObjectStore(STORE_PROJECTS, { keyPath: "document.id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new DatabaseUnavailableError());
    request.onblocked = () => reject(new DatabaseUnavailableError("Close other tabs using this app, then retry."));
  });
}

async function withDatabase<T>(databaseName: string, operation: (database: IDBDatabase) => Promise<T>): Promise<T> {
  let database: IDBDatabase | undefined;
  try {
    database = await openDatabase(databaseName);
    return await operation(database);
  } catch (error) {
    if (error instanceof ProjectConflictError || error instanceof ProjectNotFoundError || error instanceof DatabaseUnavailableError) throw error;
    throw new DatabaseUnavailableError(error instanceof Error ? error.message : undefined);
  } finally {
    database?.close();
  }
}

async function readProject(database: IDBDatabase, id: string): Promise<ProjectRecord> {
  const transaction = database.transaction(STORE_PROJECTS, "readonly");
  const done = transactionDone(transaction);
  const record = await requestResult(transaction.objectStore(STORE_PROJECTS).get(id) as IDBRequest<ProjectRecord | undefined>);
  await done;
  if (!record) throw new ProjectNotFoundError();
  return normalizeProjectRecord(structuredClone(record));
}

async function writeProject(
  database: IDBDatabase,
  value: ProjectDocument,
  mode: "create" | "update",
  expectedRevision?: number,
): Promise<ProjectRecord> {
  const document = normalizeProject(value);
  const transaction = database.transaction(STORE_PROJECTS, "readwrite");
  const done = transactionDone(transaction);
  const store = transaction.objectStore(STORE_PROJECTS);
  const current = await requestResult(store.get(document.id) as IDBRequest<ProjectRecord | undefined>);
  if (mode === "create" && current) {
    throw new ProjectConflictError("A project with this ID already exists.");
  }
  if (mode === "update" && !current) {
    throw new ProjectNotFoundError();
  }
  if (mode === "update" && current?.revision !== expectedRevision) {
    throw new ProjectConflictError();
  }
  const timestamp = nowIso();
  const record: ProjectRecord = current
    ? { document, revision: current.revision + 1, createdAt: current.createdAt, updatedAt: timestamp }
    : { document, revision: 1, createdAt: timestamp, updatedAt: timestamp };
  await requestResult(store.put(structuredClone(record)));
  await done;
  return normalizeProjectRecord(record);
}

export function createIndexedDbProjectRepository(databaseName = DATABASE_NAME): ProjectRepository {
  return {
    listProjects: () => withDatabase(databaseName, async (database) => {
      const transaction = database.transaction(STORE_PROJECTS, "readonly");
      const done = transactionDone(transaction);
      const records = await requestResult(transaction.objectStore(STORE_PROJECTS).getAll() as IDBRequest<ProjectRecord[]>);
      await done;
      return records.map<ProjectSummary>((record) => {
        const normalized = normalizeProjectRecord(record);
        return {
          id: normalized.document.id,
          name: normalized.document.name,
          revision: normalized.revision,
          updatedAt: normalized.updatedAt,
          scenarioCount: normalized.document.scenarios.length,
        };
      }).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    }),
    getProject: (id) => withDatabase(databaseName, (database) => readProject(database, id)),
    createProject: (document) => withDatabase(databaseName, (database) => writeProject(database, document, "create")),
    updateProject: (document, expectedRevision) => withDatabase(databaseName, (database) => writeProject(database, document, "update", expectedRevision)),
  };
}
