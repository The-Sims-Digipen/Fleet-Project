import { describe, expect, it } from "vitest";

import { buildApp } from "./app.js";
import type { Database } from "./db/client.js";
import { projects } from "./db/schema.js";
import {
  PersistenceConflictError,
  PersistenceNotFoundError,
  createPersistenceRepository,
  type ProjectPersistenceRepository,
  type ProjectRecord,
} from "./persistence/repository.js";
import type { ProjectDocument } from "./persistence/schemas.js";

function projectDocument(): ProjectDocument {
  const transform = {
    position: [0, 0, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    scale: [1, 1, 1] as [number, number, number],
  };
  return {
    version: 5,
    id: "project-contract",
    name: "Delivery fleet",
    activeScenarioId: "scenario-a",
    environment: { depot: { id: "default-project-depot", name: "Depot", transform }, vehicles: [] },
    vehiclePresets: [],
    scenarios: [{ id: "scenario-a", name: "Plan A", vehiclePlans: {} }],
    analysis: {
      startYear: 2026,
      yearCount: 10,
      currency: "SGD",
      fuelPricePerLitre: 2.15,
      electricityPricePerKWh: 0.3,
      fuelEmissionsKgCo2ePerLitre: 2.7,
      electricityEmissionsKgCo2ePerKWh: 0.4,
      discountRate: 0.05,
    },
  };
}

function equalityConditions(expression: unknown): Array<{ name: string; value: unknown }> {
  if (typeof expression !== "object" || expression === null || !("queryChunks" in expression)) return [];
  const chunks = (expression as { queryChunks?: unknown }).queryChunks;
  if (!Array.isArray(chunks)) return [];

  const column = chunks.find((chunk): chunk is Record<string, unknown> =>
    typeof chunk === "object" && chunk !== null && "table" in chunk && typeof chunk.name === "string");
  const parameter = chunks.find((chunk): chunk is Record<string, unknown> =>
    typeof chunk === "object" && chunk !== null && "encoder" in chunk && "value" in chunk);
  if (column && parameter) return [{ name: column.name as string, value: parameter.value }];
  return chunks.flatMap(equalityConditions);
}

function createDatabaseDouble() {
  type Row = {
    id: string;
    name: string;
    activeScenarioId: string | null;
    revision: number;
    schemaVersion: number;
    document: ProjectDocument;
    createdAt: Date;
    updatedAt: Date;
  };

  const rows: Row[] = [];
  let transactionCount = 0;
  let lastUpdateConditions: Array<{ name: string; value: unknown }> = [];
  type Method = (...args: unknown[]) => unknown;
  let database: Record<string, Method>;

  const select = (projection?: unknown) => {
    let table: unknown;
    let condition: unknown;
    const query: Record<string, Method> = {};
    query.from = (...args) => { table = args[0]; return query; };
    query.leftJoin = () => query;
    query.where = (...args) => { condition = args[0]; return query; };
    query.groupBy = () => query;
    query.orderBy = () => query;
    query.limit = () => query;
    query.then = (...args) => {
      const selectedRows = table === projects
        ? rows.filter((row) => condition === undefined || equalityConditions(condition).every(({ name, value }) =>
          (row as unknown as Record<string, unknown>)[name] === value))
          .map((row) => projection === undefined ? structuredClone(row) : { ...structuredClone(row), legacyScenarioCount: 0 })
        : [];
      const resolve = args[0] as (value: unknown) => unknown;
      const reject = args[1] as ((error: unknown) => unknown) | undefined;
      return Promise.resolve(selectedRows).then(resolve, reject);
    };
    return query;
  };

  database = {
    select: (...args) => select(args[0]),
    insert: () => ({
      values: (...args: unknown[]) => {
        const value = args[0] as Row;
        return {
          returning: async () => {
            const row = structuredClone(value);
            rows.push(row);
            return [structuredClone(row)];
          },
        };
      },
    }),
    update: () => ({
      set: (...args: unknown[]) => {
        const value = args[0] as Partial<Row>;
        let condition: unknown;
        return {
          where: (...whereArgs: unknown[]) => {
            condition = whereArgs[0];
            lastUpdateConditions = condition === undefined ? [] : equalityConditions(condition);
            return {
              returning: async () => {
                const matchingRows = rows.filter((row) => condition !== undefined && equalityConditions(condition).every(({ name, value: expected }) =>
                  (row as unknown as Record<string, unknown>)[name] === expected));
                if (matchingRows.length === 0) return [];
                const row = matchingRows[0];
                Object.assign(row, value);
                return [structuredClone(row)];
              },
            };
          },
        };
      },
    }),
    transaction: async (...args) => {
      transactionCount += 1;
      const snapshot = structuredClone(rows);
      const operation = args[0] as (tx: unknown) => Promise<unknown>;
      try {
        return await operation(database);
      } catch (error) {
        rows.splice(0, rows.length, ...snapshot);
        throw error;
      }
    },
  };

  return {
    database: database as unknown as Database,
    get transactionCount() { return transactionCount; },
    get lastUpdateConditions() { return lastUpdateConditions; },
  };
}

function memoryProjectRepository(): ProjectPersistenceRepository {
  const records = new Map<string, ProjectRecord>();
  const timestamp = "2026-09-29T00:00:00.000Z";
  return {
    listProjects: async () => [...records.values()].map(({ document, revision, updatedAt }) => ({
      id: document.id,
      name: document.name,
      revision,
      updatedAt,
      scenarioCount: document.scenarios.length,
    })),
    getProject: async (id: string) => {
      const record = records.get(id);
      if (!record) throw new PersistenceNotFoundError();
      return structuredClone(record);
    },
    createProject: async (document) => {
      if (records.has(document.id)) throw new PersistenceConflictError("A project with this ID already exists.");
      const record = { document: structuredClone(document), revision: 1, createdAt: timestamp, updatedAt: timestamp };
      records.set(document.id, record);
      return structuredClone(record);
    },
    updateProject: async (document, expectedRevision) => {
      const current = records.get(document.id);
      if (!current) throw new PersistenceNotFoundError();
      if (current.revision !== expectedRevision) throw new PersistenceConflictError();
      const record = { ...current, document: structuredClone(document), revision: current.revision + 1, updatedAt: timestamp };
      records.set(document.id, record);
      return structuredClone(record);
    },
  };
}

describe("aggregate Project API repository contract", () => {
  it("creates, lists, loads, and revision-checks a complete Project aggregate", async () => {
    const projectRepository = memoryProjectRepository();
    const app = await buildApp({ projectRepository });
    const document = projectDocument();

    try {
      const create = await app.inject({ method: "POST", url: "/api/v1/projects", payload: { document } });
      expect(create.statusCode).toBe(201);
      const created = create.json();
      expect(created.document).toEqual(document);
      expect(created.revision).toBe(1);

      const duplicate = await app.inject({ method: "POST", url: "/api/v1/projects", payload: { document } });
      expect(duplicate.statusCode).toBe(409);

      const list = await app.inject({ method: "GET", url: "/api/v1/projects" });
      expect(list.json()).toEqual([{
        id: document.id,
        name: document.name,
        revision: 1,
        updatedAt: created.updatedAt,
        scenarioCount: 1,
      }]);

      const load = await app.inject({ method: "GET", url: `/api/v1/projects/${document.id}` });
      expect(load.json()).toEqual(created);

      const updatedDocument = { ...document, name: "Updated fleet" };
      const update = await app.inject({
        method: "PUT",
        url: `/api/v1/projects/${document.id}`,
        payload: { document: updatedDocument, expectedRevision: 1 },
      });
      expect(update.statusCode).toBe(200);
      expect(update.json()).toMatchObject({ document: updatedDocument, revision: 2 });

      const stale = await app.inject({
        method: "PUT",
        url: `/api/v1/projects/${document.id}`,
        payload: { document, expectedRevision: 1 },
      });
      expect(stale.statusCode).toBe(409);
      expect((await app.inject({ method: "GET", url: `/api/v1/projects/${document.id}` })).json()).toMatchObject({
        document: updatedDocument,
        revision: 2,
      });
    } finally {
      await app.close();
    }
  });

  it("uses the API error contract for missing Projects, invalid payloads, oversized bodies, and backend failures", async () => {
    const document = projectDocument();
    const projectRepository = memoryProjectRepository();
    const app = await buildApp({ projectRepository });
    const smallBodyApp = await buildApp({ fastify: { bodyLimit: 128 }, projectRepository });
    const failingApp = await buildApp({
      projectRepository: {
        ...memoryProjectRepository(),
        getProject: async () => { throw new Error("database detail"); },
      },
    });
    const unavailableApp = await buildApp({
      projectRepository: {
        ...memoryProjectRepository(),
        listProjects: async () => { throw new Error("DATABASE_UNAVAILABLE"); },
      },
    });

    try {
      const missing = await app.inject({ method: "GET", url: `/api/v1/projects/${document.id}` });
      expect(missing.statusCode).toBe(404);
      expect(missing.json()).toMatchObject({ code: "NOT_FOUND" });

      const invalidDocument = { ...document, activeScenarioId: "missing-scenario" };
      const invalid = await app.inject({ method: "POST", url: "/api/v1/projects", payload: { document: invalidDocument } });
      expect(invalid.statusCode).toBe(400);
      expect(invalid.json()).toMatchObject({ code: "VALIDATION_ERROR" });

      const mismatched = await app.inject({
        method: "PUT",
        url: `/api/v1/projects/${document.id}`,
        payload: { document: { ...document, id: "22222222-2222-4222-8222-222222222222" }, expectedRevision: 1 },
      });
      expect(mismatched.statusCode).toBe(400);
      expect(mismatched.json()).toMatchObject({ code: "VALIDATION_ERROR" });

      const malformed = await app.inject({
        method: "POST",
        url: "/api/v1/projects",
        headers: { "content-type": "application/json" },
        payload: "{",
      });
      expect(malformed.statusCode).toBe(400);
      expect(malformed.json()).toMatchObject({ code: "VALIDATION_ERROR" });

      const oversized = await smallBodyApp.inject({
        method: "POST",
        url: "/api/v1/projects",
        headers: { "content-type": "application/json" },
        payload: JSON.stringify({ document: { ...document, name: "x".repeat(256) } }),
      });
      expect(oversized.statusCode).toBe(413);
      expect(oversized.json()).toMatchObject({ code: "PAYLOAD_TOO_LARGE" });

      const backendFailure = await failingApp.inject({ method: "GET", url: `/api/v1/projects/${document.id}` });
      expect(backendFailure.statusCode).toBe(500);
      expect(backendFailure.json()).toMatchObject({ code: "INTERNAL_ERROR" });
      expect(backendFailure.json().message).not.toContain("database detail");

      const unavailable = await unavailableApp.inject({ method: "GET", url: "/api/v1/projects" });
      expect(unavailable.statusCode).toBe(503);
      expect(unavailable.json()).toMatchObject({ code: "DATABASE_UNAVAILABLE" });
    } finally {
      await app.close();
      await smallBodyApp.close();
      await failingApp.close();
      await unavailableApp.close();
    }
  });
});

describe("Drizzle aggregate Project repository contract", () => {
  it("stores, loads, summarizes, and revision-checks the complete aggregate transactionally", async () => {
    const database = createDatabaseDouble();
    const repository = createPersistenceRepository(database.database);
    const document = projectDocument();

    expect(await repository.listProjects()).toEqual([]);

    const created = await repository.createProject(document);
    expect(created.document).toEqual(document);
    expect(created.revision).toBe(1);
    expect(database.transactionCount).toBe(1);
    expect(await repository.getProject(document.id)).toEqual(created);
    expect(await repository.listProjects()).toEqual([{
      id: document.id,
      name: document.name,
      revision: 1,
      updatedAt: created.updatedAt,
      scenarioCount: document.scenarios.length,
    }]);

    const updatedDocument = { ...document, name: "Updated fleet" };
    const updated = await repository.updateProject(updatedDocument, created.revision);
    expect(updated).toMatchObject({ document: updatedDocument, revision: 2 });
    expect(database.transactionCount).toBe(2);
    expect(database.lastUpdateConditions).toEqual(expect.arrayContaining([
      { name: "id", value: document.id },
      { name: "revision", value: created.revision },
    ]));

    const otherDocument = { ...document, id: "project-contract-other", name: "Other fleet" };
    const other = await repository.createProject(otherDocument);
    expect(await repository.getProject(otherDocument.id)).toEqual(other);
    expect(await repository.listProjects()).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: document.id, scenarioCount: document.scenarios.length }),
      expect.objectContaining({ id: otherDocument.id, scenarioCount: otherDocument.scenarios.length }),
    ]));

    await expect(repository.updateProject(document, created.revision)).rejects.toBeInstanceOf(PersistenceConflictError);
    expect(await repository.getProject(document.id)).toEqual(updated);
    expect(await repository.getProject(otherDocument.id)).toEqual(other);
    expect(database.transactionCount).toBe(4);
  });
});
