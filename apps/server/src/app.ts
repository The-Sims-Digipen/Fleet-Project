import cors from "@fastify/cors";
import Fastify, { type FastifyInstance, type FastifyServerOptions } from "fastify";
import { ZodError, type ZodType } from "zod";

import { createDatabase } from "./db/client.js";
import {
  createPersistenceRepository,
  PersistenceConflictError,
  PersistenceNotFoundError,
  type PersistenceRepository,
  WorldCompatibilityError,
} from "./persistence/repository.js";
import { createWorkspaceSchema, updateWorkspaceSchema } from "./persistence/schemas.js";

type BuildAppOptions = {
  fastify?: FastifyServerOptions;
  repository?: PersistenceRepository;
};

type ApiError = { code: string; message: string; fields?: unknown };

function validationError(error: ZodError): ApiError {
  return { code: "VALIDATION_ERROR", message: "The request contains invalid data.", fields: error.flatten() };
}

function sendError(reply: { code(statusCode: number): { send(payload: ApiError): unknown } }, error: unknown) {
  if (error instanceof PersistenceNotFoundError) return reply.code(404).send({ code: "NOT_FOUND", message: error.message });
  if (error instanceof PersistenceConflictError) return reply.code(409).send({ code: "REVISION_CONFLICT", message: error.message });
  if (error instanceof WorldCompatibilityError) return reply.code(409).send({ code: "WORLD_MISMATCH", message: error.message });
  if (error instanceof ZodError) return reply.code(400).send(validationError(error));
  throw error;
}

function parse<T>(schema: ZodType<T>, value: unknown): T { return schema.parse(value); }

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ bodyLimit: 10 * 1024 * 1024, ...options.fastify });

  await app.register(cors, { origin: true });

  let repository = options.repository;
  if (!repository && process.env.DATABASE_URL) {
    const { db } = createDatabase(process.env.DATABASE_URL);
    repository = createPersistenceRepository(db);
  }

  const requireRepository = () => {
    if (!repository) throw new Error("DATABASE_UNAVAILABLE");
    return repository;
  };

  app.setErrorHandler((error, _request, reply) => {
    if (error.message === "DATABASE_UNAVAILABLE") {
      return reply.code(503).send({ code: "DATABASE_UNAVAILABLE", message: "DATABASE_URL is not configured." });
    }
    try {
      return sendError(reply, error);
    } catch {
      app.log.error(error);
      return reply.code(500).send({ code: "INTERNAL_ERROR", message: "The server could not complete the request." });
    }
  });

  app.get("/health", async () => ({ ok: true }));
  app.get("/api/health", async () => ({ ok: true }));
  app.get("/api", async () => ({ message: "API ready" }));

  app.get("/api/v1/ready", async (_request, reply) => {
    try {
      await requireRepository().ready();
      return { ok: true };
    } catch (error) {
      if (error instanceof Error && error.message === "DATABASE_UNAVAILABLE") throw error;
      app.log.error(error);
      return reply.code(503).send({ code: "DATABASE_UNAVAILABLE", message: "The database is not ready." });
    }
  });

  app.get("/api/v1/projects", async () => requireRepository().listProjects());

  app.get<{ Params: { id: string } }>("/api/v1/projects/:id/workspace", async (request) => {
    return requireRepository().getWorkspace(request.params.id);
  });

  app.post("/api/v1/workspaces", async (request, reply) => {
    const input = parse(createWorkspaceSchema, request.body);
    const record = await requireRepository().createWorkspace(input);
    return reply.code(201).send(record);
  });

  app.put<{ Params: { id: string } }>("/api/v1/projects/:id/workspace", async (request, reply) => {
    const input = parse(updateWorkspaceSchema, request.body);
    if (input.project.id !== request.params.id) {
      return reply.code(400).send({ code: "VALIDATION_ERROR", message: "Project ID does not match the URL." });
    }
    return requireRepository().updateWorkspace(input);
  });

  app.get("/api/v1/worlds", async () => requireRepository().listWorlds());
  app.get<{ Params: { id: string } }>("/api/v1/worlds/:id", async (request) => requireRepository().getWorld(request.params.id));
  app.get<{ Params: { id: string } }>("/api/v1/worlds/:id/scenarios", async (request) => requireRepository().listScenariosByWorld(request.params.id));

  return app;
}
