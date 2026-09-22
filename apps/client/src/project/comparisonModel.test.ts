import { describe, expect, it } from "vitest";
import { createMockAnalysis, createMockFleet, createMockPresets } from "../domain/mockProject";
import type { ScenarioVehiclePlan } from "../domain/contracts";
import { calculateScenarioComparison, effectivePresetForYear, type ComparisonScenario } from "./comparisonModel";

const scenario = (name: string, vehiclePlans: Record<string, ScenarioVehiclePlan> = {}): ComparisonScenario => ({ id: name, name, vehiclePlans });

const analysis = createMockAnalysis();
const presets = createMockPresets();
const vehicles = createMockFleet();

describe("scenario comparison preview", () => {
  it("keeps a vehicle on its current preset when the scenario plans nothing", () => {
    const vehicle = vehicles[0];
    expect(effectivePresetForYear(scenario("A"), vehicle, presets, 2035)?.id).toBe(vehicle.currentPresetId);
  });

  it("follows the shared transition rule around the transition year", () => {
    const vehicle = vehicles[0];
    const plan = scenario("A", { [vehicle.id]: { transitionYear: 2030, targetPresetId: "electric-van" } });
    expect(effectivePresetForYear(plan, vehicle, presets, 2029)?.id).toBe("diesel-van");
    expect(effectivePresetForYear(plan, vehicle, presets, 2030)?.id).toBe("electric-van");
  });

  it("produces different results when scenario timing differs", () => {
    const gradual = calculateScenarioComparison(scenario("Gradual", {
      "UNIT-01": { transitionYear: 2032, targetPresetId: "electric-van" },
    }), vehicles, presets, analysis, 2028);
    const fast = calculateScenarioComparison(scenario("Fast", {
      "UNIT-01": { transitionYear: 2026, targetPresetId: "electric-van" },
      "UNIT-02": { transitionYear: 2026, targetPresetId: "electric-box-truck" },
      "UNIT-04": { transitionYear: 2026, targetPresetId: "electric-van" },
      "UNIT-05": { transitionYear: 2026, targetPresetId: "electric-van" },
      "UNIT-06": { transitionYear: 2026, targetPresetId: "electric-box-truck" },
    }), vehicles, presets, analysis, 2028);

    expect(fast.electricCount).toBeGreaterThan(gradual.electricCount);
    expect(fast.capex).toBeGreaterThan(gradual.capex);
    expect(fast.emissionsTonnes).toBeLessThan(gradual.emissionsTonnes);
  });

  it("covers the project analysis period and never emits non-finite numbers", () => {
    const result = calculateScenarioComparison(scenario("Empty"), [], presets, analysis, analysis.startYear);
    expect(result.yearly).toHaveLength(analysis.yearCount);
    expect(result.yearly[0].year).toBe(analysis.startYear);
    expect(result.warnings).toContain("No fleet vehicles are available to compare.");
    for (const value of [result.tco, result.capex, result.annualOpex, result.emissionsTonnes, result.peakDemandKw]) {
      expect(Number.isFinite(value)).toBe(true);
    }
  });

  it("ignores a target preset the project no longer has", () => {
    const result = calculateScenarioComparison(scenario("Dangling", {
      "UNIT-01": { transitionYear: 2026, targetPresetId: "deleted-preset" },
    }), vehicles, presets, analysis, 2030);
    expect(result.transitionsByYear[2026]).toBe(0);
    expect(effectivePresetForYear(scenario("Dangling", {
      "UNIT-01": { transitionYear: 2026, targetPresetId: "deleted-preset" },
    }), vehicles[0], presets, 2030)?.id).toBe("diesel-van");
  });
});
