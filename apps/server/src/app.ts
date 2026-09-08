import cors from "@fastify/cors";
import Fastify, { type FastifyServerOptions } from "fastify";

export async function buildApp(options: FastifyServerOptions = {}) {
  const app = Fastify(options);

  await app.register(cors, {
    origin: true,
  });

  app.get("/health", async () => ({
    ok: true,
  }));

  app.get("/api", async () => ({
    message: "API ready",
  }));

  return app;
}
