import { describe, expect, it } from "vitest";
import { analysisEndYear, analysisYears, clampAnalysisYear, type SimulationInput } from "./contracts";
import { sim01Expected, sim01Fleet, sim01Project, sim01Scenario } from "./m1Fixture";

describe("M1 integration contracts", () => {
  it("defines one inclusive analysis period for timeline and simulation consumers", () => {
    expect(analysisYears(sim01Project.analysis)).toEqual([2026, 2027, 2028, 2029]);
    expect(analysisEndYear(sim01Project.analysis)).toBe(2029);
    expect(clampAnalysisYear(sim01Project.analysis, 2024)).toBe(2026);
    expect(clampAnalysisYear(sim01Project.analysis, 2035)).toBe(2029);
  });

  it("keeps the shared SIM01 fixture reference-complete", () => {
    const input: SimulationInput = { project: sim01Project, fleetVehicles: sim01Fleet, scenario: sim01Scenario };
    const presetIds = new Set(input.project.vehiclePresets.map((preset) => preset.id));
    const vehicleIds = new Set(input.fleetVehicles.map((vehicle) => vehicle.id));

    for (const vehicle of input.fleetVehicles) expect(presetIds.has(vehicle.currentPresetId)).toBe(true);
    for (const [vehicleId, plan] of Object.entries(input.scenario.vehiclePlans)) {
      expect(vehicleIds.has(vehicleId)).toBe(true);
      expect(plan.targetPresetId && presetIds.has(plan.targetPresetId)).toBe(true);
    }
    expect(Object.values(sim01Expected).every((value) => value === null || Number.isFinite(value))).toBe(true);
  });
});
