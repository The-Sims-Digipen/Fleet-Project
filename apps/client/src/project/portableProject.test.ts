import { describe, expect, it } from "vitest";
import { sim01Project, sim01Scenario } from "../domain/m1Fixture";
import { createDocument } from "../state/sceneStore";
import { loadDefaultPresets } from "../vehicles/defaults";
import { createPortableProject, parsePortableProject, projectFileName } from "./portableProject";

describe("portable project files", () => {
  it("round-trips a valid multi-world project snapshot", () => {
    const file = createPortableProject({
      projectName: "Depot Study",
      projectDocument: sim01Project,
      worlds: [
        { name: "Main Depot", document: createDocument(), scenarios: [{ name: "Plan A", document: sim01Scenario }] },
        { name: "Second Depot", document: createDocument(), scenarios: [{ name: "Plan B", document: sim01Scenario }] },
      ],
      activeWorldIndex: 1,
      activeScenarioIndex: 0,
    });

    expect(parsePortableProject(JSON.parse(JSON.stringify(file)))).toEqual(file);
    expect(projectFileName("Depot Study / 2026")).toBe("depot-study-2026.fleetproject");
  });

  it("imports the previous single-world portable format", () => {
    const oldFile = {
      format: "fleet-transition-planner-project",
      version: 1,
      exportedAt: new Date().toISOString(),
      project: { name: "Old", document: { version: 2, vehiclePresets: loadDefaultPresets() } },
      world: { name: "World", document: createDocument() },
      scenarios: [{ name: "Plan A", document: { version: 1 } }],
      activeScenarioIndex: 0,
    };
    const parsed = parsePortableProject(oldFile);
    expect(parsed.version).toBe(2);
    expect(parsed.worlds).toHaveLength(1);
  });

  it("rejects unsupported or malformed files", () => {
    expect(() => parsePortableProject({ format: "other", version: 1 })).toThrow(/unsupported/i);
    expect(() => parsePortableProject({
      format: "fleet-transition-planner-project",
      version: 2,
      exportedAt: new Date().toISOString(),
      project: { name: "Bad", document: { version: 2, vehiclePresets: [] } },
      worlds: [],
      activeWorldIndex: 0,
      activeScenarioIndex: 0,
    })).toThrow(/world/i);
  });
});
