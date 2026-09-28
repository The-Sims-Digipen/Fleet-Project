import { describe, expect, it } from "vitest";
import { createDefaultProjectScene } from "../scene/defaultProjectScene";
import { createMockAnalysis, createMockFleet, createMockPresets } from "./mockProject";
import { createProjectDocument, toM1ProjectDocument } from "./projectDocument";
import { createScenarioDocument, defaultScenarioAssumptions, toM1ScenarioDocument } from "./scenario";

describe("project document round-trip", () => {
  it("writes version 4 with the Project-owned environment and reads it back", () => {
    const document = createProjectDocument(createMockPresets(), createMockFleet(), createMockAnalysis(), createDefaultProjectScene());
    expect(document.version).toBe(4);
    expect(document.scene.objects[0].id).toBe("default-project-depot");
    expect(toM1ProjectDocument(JSON.parse(JSON.stringify(document)))).toEqual(document);
  });

  it("copies inputs so later store edits cannot reach a written document", () => {
    const presets = createMockPresets();
    const fleet = createMockFleet();
    const scene = createDefaultProjectScene();
    const document = createProjectDocument(presets, fleet, createMockAnalysis(), scene);
    presets[0].name = "Mutated";
    fleet[0].annualKm = 1;
    scene.light = 1;
    expect(document.vehiclePresets[0].name).not.toBe("Mutated");
    expect(document.fleetVehicles[0].annualKm).not.toBe(1);
    expect(document.scene.light).not.toBe(1);
  });

  it("rejects legacy project documents rather than migrating old World data", () => {
    expect(() => toM1ProjectDocument({ version: 3 })).toThrow(/unsupported/i);
    expect(() => toM1ProjectDocument(null)).toThrow(/invalid/i);
  });
});

describe("scenario documents", () => {
  it("still normalizes the supported scenario payload independently of the Project scene", () => {
    const upgraded = toM1ScenarioDocument({ version: 1, vehiclePlans: { "UNIT-01": { transitionYear: 2028, targetPresetId: "electric-van" } } });
    expect(upgraded).toEqual({
      version: 2,
      vehiclePlans: { "UNIT-01": { transitionYear: 2028, targetPresetId: "electric-van" } },
      assumptions: defaultScenarioAssumptions,
    });
  });

  it("deep-copies plans so a created document never shares state with its source", () => {
    const plans = { "UNIT-01": { transitionYear: 2028 } };
    const document = createScenarioDocument(plans);
    plans["UNIT-01"].transitionYear = 2099;
    expect(document.vehiclePlans["UNIT-01"].transitionYear).toBe(2028);
  });
});
