import { describe, expect, it } from "vitest";
import { createDocument } from "../state/sceneStore";
import { loadDefaultPresets } from "../vehicles/defaults";
import { createPortableProject, parsePortableProject, projectFileName } from "./portableProject";

describe("portable project files", () => {
  it("round-trips a valid multi-world project snapshot", () => {
    const file = createPortableProject({
      projectName: "Depot Study",
      projectDocument: { version: 2, vehiclePresets: loadDefaultPresets() },
      worlds: [
        { name: "Main Depot", document: createDocument(), scenarios: [{ name: "Plan A", document: { version: 1 } }] },
        { name: "Second Depot", document: createDocument(), scenarios: [{ name: "Plan B", document: { version: 1 } }] },
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

  it("rejects a scenario whose vehicle plans are malformed", () => {
    const withPlans = (vehiclePlans: unknown) => ({
      format: "fleet-transition-planner-project",
      version: 2,
      exportedAt: new Date().toISOString(),
      project: { name: "Depot Study", document: { version: 2, vehiclePresets: loadDefaultPresets() } },
      worlds: [{ name: "World", document: createDocument(), scenarios: [{ name: "Plan A", document: { version: 1, vehiclePlans } }] }],
      activeWorldIndex: 0,
      activeScenarioIndex: 0,
    });

    expect(() => parsePortableProject(withPlans({ "UNIT-01": { transitionYear: "soon" } }))).toThrow(/scenario/i);
    expect(() => parsePortableProject(withPlans({ "UNIT-01": { transitionYear: 2028.5 } }))).toThrow(/scenario/i);
    expect(() => parsePortableProject(withPlans({ "UNIT-01": { targetPresetId: 7 } }))).toThrow(/scenario/i);
    expect(() => parsePortableProject(withPlans("not a plan map"))).toThrow(/scenario/i);

    // A year of null is a real value: it means the vehicle has no planned transition.
    expect(parsePortableProject(withPlans({ "UNIT-01": { transitionYear: null, targetPresetId: "electric-van" } })).worlds).toHaveLength(1);
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
