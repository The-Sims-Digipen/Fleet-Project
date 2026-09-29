import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";

describe("server", () => {
  it("reports a healthy API without opening a network port", async () => {
    const app = await buildApp();

    try {
      const response = await app.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ ok: true });
    } finally {
      await app.close();
    }
  });

  it("does not expose the retired separate-workspace persistence routes", async () => {
    const app = await buildApp();

    try {
      const responses = await Promise.all([
        app.inject({ method: "GET", url: "/api/v1/projects/project-a/workspace" }),
        app.inject({ method: "POST", url: "/api/v1/workspaces", payload: {} }),
        app.inject({ method: "PUT", url: "/api/v1/projects/project-a/workspace", payload: {} }),
      ]);

      expect(responses.map((response) => response.statusCode)).toEqual([404, 404, 404]);
    } finally {
      await app.close();
    }
  });
});
