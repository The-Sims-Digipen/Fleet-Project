import "fake-indexeddb/auto";
import { afterEach, describe, expect, it, vi } from "vitest";

import { addVehicleTransition } from "../domain/project";
import { createProjectFixture } from "../domain/projectFixture";
import { createIndexedDbProjectRepository } from "./indexedDbRepository";
import {
  createApiProjectRepository,
  createMemoryProjectRepository,
  ProjectConflictError,
  ProjectNotFoundError,
} from "./repository";
import type { ProjectRepository } from "./repository";

const PROJECT_ID = "project-contract";

function seedLegacyDatabase(databaseName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 4);
    request.onupgradeneeded = () => {
      const database = request.result;
      database.createObjectStore("projects", { keyPath: "document.id" }).add({
        document: { id: "legacy-project" },
        revision: 1,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      });
      database.createObjectStore("scenarios", { keyPath: "id" }).add({ id: "legacy-scenario" });
    };
    request.onsuccess = () => {
      request.result.close();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

function openExistingDatabase(databaseName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function createFetchBackedProjectRepository(): ProjectRepository {
  const persistence = createMemoryProjectRepository();
  const response = (status: number, body: unknown) => new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = new URL(String(input), "http://localhost").pathname;
    const method = init?.method ?? "GET";
    try {
      if (path === "/api/v1/projects" && method === "GET") return response(200, await persistence.listProjects());
      if (path === "/api/v1/projects" && method === "POST") {
        const { document } = JSON.parse(String(init?.body)) as { document: Parameters<ProjectRepository["createProject"]>[0] };
        return response(201, await persistence.createProject(document));
      }
      const match = /^\/api\/v1\/projects\/([^/]+)$/.exec(path);
      if (match) {
        const id = decodeURIComponent(match[1]);
        if (method === "GET") return response(200, await persistence.getProject(id));
        if (method === "PUT") {
          const { document, expectedRevision } = JSON.parse(String(init?.body)) as {
            document: Parameters<ProjectRepository["updateProject"]>[0];
            expectedRevision: number;
          };
          return response(200, await persistence.updateProject(document, expectedRevision));
        }
      }
      return response(404, { message: "Route not found." });
    } catch (error) {
      if (error instanceof ProjectNotFoundError) return response(404, { message: error.message });
      if (error instanceof ProjectConflictError) return response(409, { message: error.message });
      return response(500, { message: "The request failed." });
    }
  });
  return createApiProjectRepository();
}

const adapters: Array<{ name: string; createRepository: () => ProjectRepository }> = [
  { name: "memory", createRepository: () => createMemoryProjectRepository() },
  { name: "IndexedDB", createRepository: () => createIndexedDbProjectRepository(`fleet-project-test-${crypto.randomUUID()}`) },
  { name: "API", createRepository: createFetchBackedProjectRepository },
];
afterEach(() => vi.unstubAllGlobals());

describe.each(adapters)("aggregate Project repository contract: $name", ({ createRepository }) => {
  it("creates, lists, loads, and updates one complete Project record", async () => {
    const repository = createRepository();
    const document = addVehicleTransition(
      createProjectFixture(PROJECT_ID),
      { scenarioId: "plan-a", vehicleId: "UNIT-01" },
      { year: 2030, targetPresetId: "electric-van" },
    );

    const created = await repository.createProject(document);
    expect(created.revision).toBe(1);
    expect(created.document).toEqual(document);
    expect(await repository.listProjects()).toEqual([
      expect.objectContaining({ id: PROJECT_ID, name: document.name, revision: 1, scenarioCount: 2 }),
    ]);
    expect(await repository.getProject(PROJECT_ID)).toEqual(created);

    const updatedDocument = {
      ...document,
      name: "Updated study",
      scenarios: [...document.scenarios, { id: "plan-c", name: "Plan C", vehiclePlans: {} }],
      activeScenarioId: "plan-c",
    };
    const updated = await repository.updateProject(updatedDocument, created.revision);
    expect(updated.revision).toBe(2);
    expect(updated.document).toEqual(updatedDocument);
    expect(updated.document.scenarios[0].vehiclePlans["UNIT-01"].transitions).toEqual([
      { year: 2030, targetPresetId: "electric-van" },
    ]);
    expect(await repository.listProjects()).toEqual([
      expect.objectContaining({ id: PROJECT_ID, name: "Updated study", revision: 2, scenarioCount: 3 }),
    ]);
  });

  it("leaves the complete stored aggregate unchanged after a stale revision", async () => {
    const repository = createRepository();
    const document = createProjectFixture(PROJECT_ID);
    const created = await repository.createProject(document);

    await expect(repository.updateProject({ ...document, name: "Stale write" }, created.revision - 1)).rejects.toBeInstanceOf(ProjectConflictError);

    expect(await repository.getProject(document.id)).toEqual(created);
  });

  it("rejects unsupported or invalid documents without storing them", async () => {
    const repository = createRepository();
    await expect(repository.createProject({ ...createProjectFixture(), version: 4 } as never)).rejects.toThrow(/unsupported Project document version/i);
    expect(await repository.listProjects()).toEqual([]);
  });
});

describe("IndexedDB aggregate schema upgrade", () => {
  it("clears pre-v5 records and leaves one usable aggregate store", async () => {
    const databaseName = `fleet-project-legacy-test-${crypto.randomUUID()}`;
    await seedLegacyDatabase(databaseName);
    const repository = createIndexedDbProjectRepository(databaseName);

    expect(await repository.listProjects()).toEqual([]);
    const created = await repository.createProject(createProjectFixture("upgraded-project"));
    expect(await repository.getProject(created.document.id)).toEqual(created);

    const database = await openExistingDatabase(databaseName);
    expect(database.version).toBe(5);
    expect(Array.from(database.objectStoreNames)).toEqual(["projects"]);
    database.close();
  });
});
