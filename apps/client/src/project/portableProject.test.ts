import { describe, expect, it } from "vitest";

import { createProjectFixture } from "../domain/projectFixture";
import { createPortableProject, parsePortableProject, projectFileName } from "./portableProject";

describe("portable aggregate Project files", () => {
  it("round-trips the complete Project document without runtime state", () => {
    const document = createProjectFixture();
    const file = createPortableProject(document);

    expect(parsePortableProject(JSON.parse(JSON.stringify(file)))).toEqual(file);
    expect(file).toMatchObject({ format: "fleet-transition-planner-project", version: 4, document });
    expect(file).not.toHaveProperty("editor");
    expect(file).not.toHaveProperty("history");
    expect(file).not.toHaveProperty("revision");
    expect(projectFileName("Depot Study / 2026")).toBe("depot-study-2026.fleetproject");
  });

  it("rejects earlier pre-release formats and invalid aggregates", () => {
    expect(() => parsePortableProject({ format: "fleet-transition-planner-project", version: 3 })).toThrow(/unsupported/i);
    expect(() => parsePortableProject({
      format: "fleet-transition-planner-project",
      version: 4,
      exportedAt: new Date().toISOString(),
      document: { ...createProjectFixture(), scenarios: [] },
    })).toThrow(/at least one Scenario/i);
  });
});
