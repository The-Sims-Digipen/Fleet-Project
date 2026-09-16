import { describe, expect, it } from "vitest";
import { initialVehicles } from "../state/fleetStore";
import { loadDefaultPresets } from "../vehicles/defaults";
import type { Scenario } from "./types";
import { calculateScenarioComparison, resolveVehiclePlan } from "./comparisonModel";

const scenario = (name: string, vehiclePlans: Scenario["document"]["vehiclePlans"] = {}): Scenario => ({
  id: name,
  worldId: "world",
  name,
  revision: 0,
  worldRevision: 0,
  document: { version: 1, vehiclePlans },
});

describe("scenario comparison preview", () => {
  it("falls back to the existing mock transition schedule and an electric target", () => {
    const presets = loadDefaultPresets();
    const plan = resolveVehiclePlan(scenario("A"), initialVehicles[0], presets);
    expect(plan.transitionYear).toBe(2027);
    expect(plan.targetPresetId).toBe("electric-van");
  });

  it("produces different results when scenario timing differs", () => {
    const presets = loadDefaultPresets();
    const gradual = calculateScenarioComparison(scenario("Gradual"), initialVehicles, presets, 2028);
    const fast = calculateScenarioComparison(scenario("Fast", {
      "UNIT-01": { transitionYear: 2026, targetPresetId: "electric-van" },
      "UNIT-02": { transitionYear: 2026, targetPresetId: "electric-box-truck" },
      "UNIT-04": { transitionYear: 2026, targetPresetId: "electric-van" },
      "UNIT-05": { transitionYear: 2026, targetPresetId: "electric-van" },
      "UNIT-06": { transitionYear: 2026, targetPresetId: "electric-box-truck" },
    }), initialVehicles, presets, 2028);

    expect(fast.electricCount).toBeGreaterThan(gradual.electricCount);
    expect(fast.tco).not.toBe(gradual.tco);
    expect(fast.emissionsTonnes).toBeLessThan(gradual.emissionsTonnes);
  });
});
