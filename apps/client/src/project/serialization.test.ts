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
    expect(project.vehiclePresets.every((preset) => preset.chargingEfficiency === 1)).toBe(true);
    // A version 2 document stored no fleet, so reopening one invents no vehicles.
    expect(project.fleetVehicles).toEqual([]);
    // Without a project to check against, stored plans are kept as written.
    expect(scenario).toEqual({
      version: 2,
      vehiclePlans: { "UNIT-01": { transitionYear: 2028, targetPresetId: "electric-van" } },
      assumptions: LEGACY_SCENARIO_ASSUMPTION_DEFAULTS,
    });
  });

  it("drops legacy plans whose vehicle the migrated project no longer has", () => {
    // The blocking case: a version 2 project migrates to an empty fleet, so its
    // version 1 scenarios still name vehicles that no longer exist. Those plan
    // entries are dropped rather than failing the whole load.
    const project = normalizeProjectDocument({ version: 2, vehiclePresets: createMockPresets() });
    const scenario = normalizeScenarioDocument({
      version: 1,
      vehiclePlans: {
        "UNIT-01": { transitionYear: 2028, targetPresetId: "electric-van" },
        "UNIT-02": { transitionYear: 2030, targetPresetId: "electric-box-truck" },
      },
    }, "scenario.document", project);

    expect(scenario.vehiclePlans).toEqual({});
    expect(() => validateScenarioReferences(project, scenario)).not.toThrow();
  });

  it("keeps legacy plans for vehicles the project still has", () => {
    const project = normalizeProjectDocument(sim01Project);
    const scenario = normalizeScenarioDocument({
      version: 1,
      vehiclePlans: {
        "SIM01-VEHICLE": { transitionYear: 2027, targetPresetId: "sim01-electric" },
        "GONE-01": { transitionYear: 2027, targetPresetId: "sim01-electric" },
      },
    }, "scenario.document", project);

    expect(scenario.vehiclePlans).toEqual({ "SIM01-VEHICLE": { transitionYear: 2027, targetPresetId: "sim01-electric" } });
    expect(() => validateScenarioReferences(project, scenario)).not.toThrow();
  });

  it("still rejects a dangling plan in an authoritative version 2 scenario", () => {
    // Pruning is a legacy-migration allowance only. A current document naming a
    // missing vehicle is corruption and must fail loudly.
    const scenario = normalizeScenarioDocument({
      ...sim01Scenario,
      vehiclePlans: { "GONE-01": { transitionYear: 2027, targetPresetId: "sim01-electric" } },
    }, "scenario.document", sim01Project);

    expect(scenario.vehiclePlans).toHaveProperty("GONE-01");
    expect(() => validateScenarioReferences(sim01Project, scenario)).toThrow(/GONE-01.*fleet vehicle/i);
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
