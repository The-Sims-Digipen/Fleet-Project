import { describe, expect, it } from "vitest";
import { sim01Project, sim01Scenario } from "../domain/m1Fixture";
import { createMockPresets } from "../domain/mockProject";
import { createDocument } from "../state/sceneStore";
import {
  LEGACY_ANALYSIS_DEFAULTS,
  LEGACY_SCENARIO_ASSUMPTION_DEFAULTS,
  normalizeProjectDocument,
  normalizeScenarioDocument,
  normalizeWorkspaceSaveInput,
  ProjectValidationError,
  validateScenarioReferences,
} from "./serialization";

describe("project document serialization", () => {
  it("canonicalizes M1 documents and excludes derived output", () => {
    const project = normalizeProjectDocument({ ...sim01Project, simulationResult: { savings: 123 } });
    const scenario = normalizeScenarioDocument({ ...sim01Scenario, analytics: { payback: 2027 } });

    expect(project).toEqual(sim01Project);
    expect(scenario).toEqual(sim01Scenario);
    expect(project).not.toHaveProperty("simulationResult");
    expect(scenario).not.toHaveProperty("analytics");
  });

  it("migrates supported legacy project and scenario documents", () => {
    const project = normalizeProjectDocument({ version: 2, vehiclePresets: createMockPresets() });
    const scenario = normalizeScenarioDocument({
      version: 1,
      vehiclePlans: { "UNIT-01": { transitionYear: 2028, targetPresetId: "electric-van" } },
    });

    expect(project).toMatchObject({ version: 3, analysis: LEGACY_ANALYSIS_DEFAULTS });
    expect(project.fleetVehicles.map((vehicle) => vehicle.id)).toEqual([
      "UNIT-01", "UNIT-02", "UNIT-03", "UNIT-04", "UNIT-05", "UNIT-06",
    ]);
    expect(project.vehiclePresets.every((preset) => preset.chargingEfficiency === 1)).toBe(true);
    expect(scenario).toEqual({
      version: 2,
      vehiclePlans: { "UNIT-01": { transitionYear: 2028, targetPresetId: "electric-van" } },
      assumptions: LEGACY_SCENARIO_ASSUMPTION_DEFAULTS,
    });
  });

  it("rejects unsupported versions, non-finite values, and broken references with a path", () => {
    expect(() => normalizeProjectDocument({ version: 99 })).toThrow(/project\.document\.version.*unsupported/i);
    expect(() => normalizeProjectDocument({
      ...sim01Project,
      analysis: { ...sim01Project.analysis, fuelPricePerLitre: Number.NaN },
    })).toThrow(/fuelPricePerLitre.*finite/i);

    const brokenScenario = normalizeScenarioDocument({
      ...sim01Scenario,
      vehiclePlans: { missing: { transitionYear: 2026, targetPresetId: "sim01-electric" } },
    });
    expect(() => validateScenarioReferences(sim01Project, brokenScenario)).toThrow(/missing.*fleet vehicle/i);
  });

  it("validates complete current workspace relationships before persistence", () => {
    expect(() => normalizeWorkspaceSaveInput({
      project: { id: "project", name: "Study", activeWorldId: "world", document: sim01Project },
      worlds: [{ id: "world", name: "Depot", expectedRevision: 0, document: createDocument() }],
      scenarios: [{
        id: "scenario",
        worldId: "world",
        name: "Plan",
        expectedRevision: 0,
        document: { ...sim01Scenario, vehiclePlans: { missing: { transitionYear: 2026, targetPresetId: "sim01-electric" } } },
      }],
    })).toThrow(ProjectValidationError);
  });
});
