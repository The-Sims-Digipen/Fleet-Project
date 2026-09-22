import { describe, expect, it } from "vitest";
import { createMockAnalysis, createMockFleet, createMockPresets, defaultAnalysisSettings } from "./mockProject";
import { createProjectDocument, toM1ProjectDocument } from "./projectDocument";
import { createScenarioDocument, defaultScenarioAssumptions, toM1ScenarioDocument } from "./scenario";

const legacyPreset = {
  id: "diesel-van", name: "Diesel Delivery Van", category: "Van", propulsion: "diesel", modelId: "van",
  litresPer100Km: 9.5, kWhPer100Km: 0, batteryCapacityKWh: 0, chargingPowerKW: 0, purchaseCost: 32_000,
};

describe("project document round-trip", () => {
  it("writes version 3 and reads back the same authoritative inputs", () => {
    const document = createProjectDocument(createMockPresets(), createMockFleet(), createMockAnalysis());
    expect(document.version).toBe(3);
    expect(toM1ProjectDocument(JSON.parse(JSON.stringify(document)))).toEqual(document);
  });

  it("copies inputs so later store edits cannot reach a written document", () => {
    const presets = createMockPresets();
    const fleet = createMockFleet();
    const document = createProjectDocument(presets, fleet, createMockAnalysis());
    presets[0].name = "Mutated";
    fleet[0].annualKm = 1;
    expect(document.vehiclePresets[0].name).not.toBe("Mutated");
    expect(document.fleetVehicles[0].annualKm).not.toBe(1);
  });
});

describe("legacy project documents", () => {
  it("reads a version 2 document, filling the fields it predates neutrally", () => {
    const upgraded = toM1ProjectDocument({ version: 2, vehiclePresets: [legacyPreset] });
    expect(upgraded.version).toBe(3);
    expect(upgraded.vehiclePresets[0]).toMatchObject({
      id: "diesel-van",
      purchaseCost: 32_000,
      // Nothing is invented: no running cost, no residual value, no range.
      maintenanceCostPerYear: 0,
      rangeKm: null,
      chargingEfficiency: 1,
      acquisition: { kind: "owned", endResidualValue: 0 },
    });
    // A version 2 project has no fleet, so it reopens empty rather than seeded.
    expect(upgraded.fleetVehicles).toEqual([]);
    expect(upgraded.analysis).toEqual(defaultAnalysisSettings);
  });

  it("keeps real M1 values instead of overwriting them with legacy defaults", () => {
    const document = createProjectDocument(createMockPresets(), [], createMockAnalysis());
    const electric = toM1ProjectDocument(document).vehiclePresets.find((preset) => preset.id === "electric-van")!;
    expect(electric.maintenanceCostPerYear).toBe(900);
    expect(electric.chargingEfficiency).toBe(0.9);
  });

  it("drops unreadable records and duplicates rather than failing the whole reopen", () => {
    const document = toM1ProjectDocument({
      version: 3,
      vehiclePresets: [legacyPreset, legacyPreset, { id: "broken" }],
      fleetVehicles: [{ id: "UNIT-X", currentPresetId: "nonexistent" }],
      analysis: { startYear: "soon" },
    });
    expect(document.vehiclePresets).toHaveLength(1);
    expect(document.fleetVehicles).toEqual([]);
    expect(document.analysis).toEqual(defaultAnalysisSettings);
  });

  it("survives a missing or malformed document without throwing", () => {
    for (const bad of [null, undefined, "project", [], 7]) {
      expect(toM1ProjectDocument(bad)).toMatchObject({ version: 3, vehiclePresets: [], fleetVehicles: [] });
    }
  });
});

describe("legacy scenario documents", () => {
  it("reads a version 1 document, keeping its plans and adding default assumptions", () => {
    const upgraded = toM1ScenarioDocument({ version: 1, vehiclePlans: { "UNIT-01": { transitionYear: 2028, targetPresetId: "electric-van" } } });
    expect(upgraded).toEqual({
      version: 2,
      vehiclePlans: { "UNIT-01": { transitionYear: 2028, targetPresetId: "electric-van" } },
      assumptions: defaultScenarioAssumptions,
    });
  });

  it("drops unusable plan fields but keeps the entries it can read", () => {
    const upgraded = toM1ScenarioDocument({
      version: 1,
      vehiclePlans: {
        "UNIT-01": { transitionYear: 2028.5, targetPresetId: "" },
        "UNIT-02": { transitionYear: null },
        "UNIT-03": "not a plan",
      },
    });
    expect(upgraded.vehiclePlans).toEqual({ "UNIT-01": {}, "UNIT-02": { transitionYear: null } });
  });

  it("deep-copies plans so a created document never shares state with its source", () => {
    const plans = { "UNIT-01": { transitionYear: 2028 } };
    const document = createScenarioDocument(plans);
    plans["UNIT-01"].transitionYear = 2099;
    expect(document.vehiclePlans["UNIT-01"].transitionYear).toBe(2028);
  });
});
