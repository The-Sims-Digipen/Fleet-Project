import { describe, expect, it } from "vitest";
import { sim01Project, sim01Scenario } from "../domain/m1Fixture";
import { createPortableProject, parsePortableProject, projectFileName } from "./portableProject";

describe("portable project files", () => {
  it("round-trips one project environment with multiple scenarios", () => {
    const file = createPortableProject({
      projectName: "Depot Study",
      projectDocument: sim01Project,
      scenarios: [
        { name: "Plan A", document: sim01Scenario },
        { name: "Plan B", document: sim01Scenario },
      ],
      activeScenarioIndex: 1,
    });
    expect(parsePortableProject(JSON.parse(JSON.stringify(file)))).toEqual(file);
    expect(file).not.toHaveProperty("worlds");
    expect(projectFileName("Depot Study / 2026")).toBe("depot-study-2026.fleetproject");
  });

  it("rejects legacy multi-world and malformed files instead of migrating them", () => {
    expect(() => parsePortableProject({ format: "fleet-transition-planner-project", version: 2 })).toThrow(/unsupported/i);
    expect(() => parsePortableProject({
      format: "fleet-transition-planner-project",
      version: 3,
      exportedAt: new Date().toISOString(),
      project: { name: "Bad", document: sim01Project },
      scenarios: [],
      activeScenarioIndex: 0,
    })).toThrow(/scenario/i);
  });
});
