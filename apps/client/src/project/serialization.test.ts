import { describe, expect, it } from "vitest";
import { sim01Project, sim01Scenario } from "../domain/m1Fixture";
import { normalizeProjectDocument, normalizeScenarioDocument, normalizeWorkspaceSaveInput, validateScenarioReferences } from "./serialization";

describe("single-environment project serialization", () => {
  it("canonicalizes documents and excludes derived output", () => {
    const project = normalizeProjectDocument({ ...sim01Project, simulationResult: { savings: 123 } });
    const scenario = normalizeScenarioDocument({ ...sim01Scenario, analytics: { payback: 2027 } });
    expect(project).toEqual(sim01Project);
    expect(scenario).toEqual(sim01Scenario);
  });

  it("rejects legacy versions and broken references with a path", () => {
    expect(() => normalizeProjectDocument({ version: 3 })).toThrow(/version.*unsupported/i);
    const broken = normalizeScenarioDocument({
      ...sim01Scenario,
      vehiclePlans: { missing: { transitionYear: 2026, targetPresetId: "sim01-electric" } },
    });
    expect(() => validateScenarioReferences(sim01Project, broken)).toThrow(/missing.*fleet vehicle/i);
  });

  it("validates the complete project and scenario aggregate before persistence", () => {
    expect(() => normalizeWorkspaceSaveInput({
      project: { id: "project", name: "Study", document: sim01Project },
      scenarios: [{
        id: "scenario",
        name: "Plan",
        expectedRevision: 0,
        document: { ...sim01Scenario, vehiclePlans: { missing: { transitionYear: 2026, targetPresetId: "sim01-electric" } } },
      }],
    })).toThrow(/fleet vehicle/i);
  });

  it("rejects projects without the default depot", () => {
    expect(() => normalizeProjectDocument({ ...sim01Project, scene: { ...sim01Project.scene, objects: [] } })).toThrow(/default depot/i);
  });
});
