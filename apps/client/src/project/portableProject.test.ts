import { describe, expect, it } from "vitest";
import { createDocument } from "../state/sceneStore";
import { loadDefaultPresets } from "../vehicles/defaults";
import { createPortableProject, parsePortableProject, projectFileName } from "./portableProject";

describe("portable project files", () => {
  it("round-trips a valid versioned project snapshot", () => {
    const file = createPortableProject({
      projectName: "Depot Study",
      projectDocument: { version: 2, vehiclePresets: loadDefaultPresets() },
      worldName: "Main Depot",
      worldDocument: createDocument(),
      scenarios: [{ name: "Plan A", document: { version: 1 } }],
      activeScenarioIndex: 0,
    });

    expect(parsePortableProject(JSON.parse(JSON.stringify(file)))).toEqual(file);
    expect(projectFileName("Depot Study / 2026")).toBe("depot-study-2026.fleetproject");
  });

  it("rejects unsupported or malformed files", () => {
    expect(() => parsePortableProject({ format: "other", version: 1 })).toThrow(/unsupported/i);
    expect(() => parsePortableProject({
      format: "fleet-transition-planner-project",
      version: 1,
      exportedAt: new Date().toISOString(),
      project: { name: "Bad", document: { version: 2, vehiclePresets: [] } },
      world: { name: "World", document: { version: 3, objects: [], light: 1 } },
      scenarios: [],
      activeScenarioIndex: 0,
    })).toThrow(/scenario/i);
  });
});
