import cors from "@fastify/cors";
import Fastify, { type FastifyInstance, type FastifyServerOptions } from "fastify";
import { ZodError, type ZodType } from "zod";

import { createDatabase } from "./db/client.js";
import {
  createPersistenceRepository,
  PersistenceConflictError,
  PersistenceNotFoundError,
  type ProjectPersistenceRepository,
  type PersistenceRepository,
} from "./persistence/repository.js";
import {
  createProjectSchema,
  projectIdParamsSchema,
  updateProjectSchema,
} from "./persistence/schemas.js";

type BuildAppOptions = {
  fastify?: FastifyServerOptions;
  repository?: PersistenceRepository;
  projectRepository?: ProjectPersistenceRepository;
};

type ApiError = { code: string; message: string; fields?: unknown };

function validationError(error: ZodError): ApiError {
  return { code: "VALIDATION_ERROR", message: "The request contains invalid data.", fields: error.flatten() };
}

function sendError(reply: { code(statusCode: number): { send(payload: ApiError): unknown } }, error: unknown) {
  if (error instanceof PersistenceNotFoundError) return reply.code(404).send({ code: "NOT_FOUND", message: error.message });
  if (error instanceof PersistenceConflictError) return reply.code(409).send({ code: "REVISION_CONFLICT", message: error.message });
  if (error instanceof ZodError) return reply.code(400).send(validationError(error));
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = error.code;
    const statusCode = "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : undefined;
    if (code === "FST_ERR_CTP_BODY_TOO_LARGE") {
      return reply.code(413).send({ code: "PAYLOAD_TOO_LARGE", message: "The request body exceeds the supported size." });
    }
    if (statusCode === 400 && typeof code === "string" && code.startsWith("FST_ERR_CTP_")) {
      return reply.code(400).send({ code: "VALIDATION_ERROR", message: "The request body is not valid JSON." });
    }
    if (statusCode === 415) {
      return reply.code(415).send({ code: "UNSUPPORTED_MEDIA_TYPE", message: "The request must use application/json." });
    }
  }
  throw error;
}

function parse<T>(schema: ZodType<T>, value: unknown): T { return schema.parse(value); }

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ bodyLimit: 10 * 1024 * 1024, ...options.fastify });

  await app.register(cors, { origin: true });

  let repository = options.repository;
  let projectRepository = options.projectRepository ?? repository;
  if ((!repository || !projectRepository) && process.env.DATABASE_URL) {
    const { db } = createDatabase(process.env.DATABASE_URL);
    const databaseRepository = createPersistenceRepository(db);
    repository ??= databaseRepository;
    projectRepository ??= databaseRepository;
  }

  const requireRepository = () => {
    if (!repository) throw new Error("DATABASE_UNAVAILABLE");
    return repository;
  };
  const requireProjectRepository = () => {
    if (!projectRepository) throw new Error("DATABASE_UNAVAILABLE");
    return projectRepository;
  };

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof Error && error.message === "DATABASE_UNAVAILABLE") {
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

  app.get("/api/v1/projects", async () => requireProjectRepository().listProjects());

  app.get<{ Params: { id: string } }>("/api/v1/projects/:id", async (request) => {
    const { id } = parse(projectIdParamsSchema, request.params);
    return requireProjectRepository().getProject(id);
  });

  app.post("/api/v1/projects", async (request, reply) => {
    const { document } = parse(createProjectSchema, request.body);
    return reply.code(201).send(await requireProjectRepository().createProject(document));
  });

  app.put<{ Params: { id: string } }>("/api/v1/projects/:id", async (request, reply) => {
    const { id } = parse(projectIdParamsSchema, request.params);
    const input = parse(updateProjectSchema, request.body);
    if (input.document.id !== id) {
      return reply.code(400).send({ code: "VALIDATION_ERROR", message: "Project ID does not match the URL." });
    }
    return requireProjectRepository().updateProject(input.document, input.expectedRevision);
  });

  return app;
}
