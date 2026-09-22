import { describe, expect, it } from "vitest";
import { normalizeProjectDocument, normalizeScenarioDocument } from "../project/serialization";
import { createMockAnalysis, createMockFleet, createMockPresets } from "./mockProject";
import { createProjectDocument } from "./projectDocument";
import { createScenarioDocument, defaultScenarioAssumptions } from "./scenario";

/**
 * T03 writes project documents; `project/serialization.ts` reads them. These
 * tests cover the writer and the seam between the two, so a change on either
 * side that makes written documents unreadable fails here.
 */

describe("project document writer", () => {
  it("writes version 3 with the project-owned inputs", () => {
    const presets = createMockPresets();
    const fleet = createMockFleet();
    const analysis = createMockAnalysis();
    const document = createProjectDocument(presets, fleet, analysis);

    expect(document.version).toBe(3);
    expect(document.vehiclePresets).toHaveLength(presets.length);
    expect(document.fleetVehicles).toHaveLength(fleet.length);
    expect(document.analysis).toEqual(analysis);
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

  it("writes an empty fleet without inventing vehicles", () => {
    const document = createProjectDocument(createMockPresets(), [], createMockAnalysis());
    expect(document.fleetVehicles).toEqual([]);
    expect(normalizeProjectDocument(document).fleetVehicles).toEqual([]);
  });
});

describe("writer and reader agree", () => {
  it("round-trips a written document through the serializer unchanged", () => {
    const document = createProjectDocument(createMockPresets(), createMockFleet(), createMockAnalysis());
    const stored = JSON.parse(JSON.stringify(document));
    expect(normalizeProjectDocument(stored)).toEqual(document);
  });

  it("round-trips a created scenario document unchanged", () => {
    const document = createScenarioDocument({ "UNIT-01": { transitionYear: 2029, targetPresetId: "electric-van" } });
    const stored = JSON.parse(JSON.stringify(document));
    expect(normalizeScenarioDocument(stored)).toEqual(document);
    expect(document.assumptions).toEqual(defaultScenarioAssumptions);
  });
});

describe("scenario constructors", () => {
  it("deep-copies plans so a created document never shares state with its source", () => {
    const plans = { "UNIT-01": { transitionYear: 2028 } };
    const document = createScenarioDocument(plans);
    plans["UNIT-01"].transitionYear = 2099;
    expect(document.vehiclePlans["UNIT-01"].transitionYear).toBe(2028);
  });
});
