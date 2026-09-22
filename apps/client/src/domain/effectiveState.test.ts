import { describe, expect, it } from "vitest";
import { analysisEndYear, type M1ScenarioDocument, type ScenarioVehiclePlan } from "./contracts";
import { effectiveFleetStateFor, effectivePresetFor, effectiveVehicleState, planChangesPreset, resolveVehiclePlan, transitionEventsFor } from "./effectiveState";
import { createScenarioDocument } from "./scenario";
import { sim01Fleet, sim01Project, sim01Scenario } from "./m1Fixture";

const presetIds = new Set(sim01Project.vehiclePresets.map((preset) => preset.id));
const vehicle = sim01Fleet[0];
const scenarioWith = (document: Partial<M1ScenarioDocument>): M1ScenarioDocument => ({ ...sim01Scenario, ...document });

describe("scenario plan resolution", () => {
  it("plans nothing when the scenario says nothing", () => {
    expect(resolveVehiclePlan(undefined, presetIds)).toEqual({ transitionYear: null, targetPresetId: null });
    expect(resolveVehiclePlan({}, presetIds)).toEqual({ transitionYear: null, targetPresetId: null });
  });

  it("drops a target the project no longer has rather than inventing one", () => {
    const plan = resolveVehiclePlan({ transitionYear: 2027, targetPresetId: "deleted-preset" }, presetIds);
    expect(plan).toEqual({ transitionYear: 2027, targetPresetId: null });
    expect(planChangesPreset(vehicle, plan)).toBe(false);
  });

  it("only counts a plan that has both parts and names a different preset", () => {
    expect(planChangesPreset(vehicle, { transitionYear: 2027, targetPresetId: "sim01-electric" })).toBe(true);
    expect(planChangesPreset(vehicle, { transitionYear: null, targetPresetId: "sim01-electric" })).toBe(false);
    expect(planChangesPreset(vehicle, { transitionYear: 2027, targetPresetId: null })).toBe(false);
    // Transitioning to the preset it already runs is not a change.
    expect(planChangesPreset(vehicle, { transitionYear: 2027, targetPresetId: vehicle.currentPresetId })).toBe(false);
  });
});

describe("effective vehicle state", () => {
  const plan = { transitionYear: 2028, targetPresetId: "sim01-electric" };

  it("uses the current preset before the transition year and the target from it onward", () => {
    expect(effectiveVehicleState(vehicle, plan, presetIds, 2027)).toEqual({
      vehicleId: vehicle.id, presetId: "sim01-diesel", transitioned: false, transitionYear: 2028,
    });
    // The transition year itself is already the target preset.
    expect(effectiveVehicleState(vehicle, plan, presetIds, 2028)).toEqual({
      vehicleId: vehicle.id, presetId: "sim01-electric", transitioned: true, transitionYear: 2028,
    });
    expect(effectiveVehicleState(vehicle, plan, presetIds, 2029)).toMatchObject({ presetId: "sim01-electric", transitioned: true });
  });

  it("stays on the current preset for every year when nothing is planned", () => {
    for (const year of [2026, 2030, 2099]) {
      expect(effectiveVehicleState(vehicle, undefined, presetIds, year)).toEqual({
        vehicleId: vehicle.id, presetId: vehicle.currentPresetId, transitioned: false, transitionYear: null,
      });
    }
  });

  it("resolves the whole fleet and the preset record for a requested year", () => {
    expect(effectiveFleetStateFor({ project: sim01Project, fleetVehicles: sim01Fleet, scenario: sim01Scenario }, 2026)).toEqual([
      { vehicleId: "SIM01-VEHICLE", presetId: "sim01-electric", transitioned: true, transitionYear: 2026 },
    ]);
    expect(effectivePresetFor({ project: sim01Project, fleetVehicles: sim01Fleet, scenario: sim01Scenario }, "SIM01-VEHICLE", 2026)?.id).toBe("sim01-electric");
    expect(effectivePresetFor({ project: sim01Project, fleetVehicles: sim01Fleet, scenario: sim01Scenario }, "missing-vehicle", 2026)).toBeUndefined();
  });
});

describe("transition event projection", () => {
  it("projects one event per real change, ordered and with both endpoints", () => {
    expect(transitionEventsFor({ project: sim01Project, fleetVehicles: sim01Fleet, scenario: sim01Scenario })).toEqual([
      { kind: "vehicle-transition", year: 2026, vehicleId: "SIM01-VEHICLE", fromPresetId: "sim01-diesel", toPresetId: "sim01-electric" },
    ]);
  });

  it("emits nothing for plans that change no preset", () => {
    const cases: Record<string, ScenarioVehiclePlan>[] = [
      {},
      { "SIM01-VEHICLE": { transitionYear: 2027 } },
      { "SIM01-VEHICLE": { targetPresetId: "sim01-electric" } },
      { "SIM01-VEHICLE": { transitionYear: 2027, targetPresetId: "sim01-diesel" } },
      { "SIM01-VEHICLE": { transitionYear: 2027, targetPresetId: "deleted-preset" } },
    ];
    for (const plans of cases) {
      expect(transitionEventsFor({ project: sim01Project, fleetVehicles: sim01Fleet, scenario: scenarioWith({ vehiclePlans: plans }) })).toEqual([]);
    }
  });

  it("never advertises a change outside the analysis period", () => {
    const end = analysisEndYear(sim01Project.analysis);
    for (const year of [sim01Project.analysis.startYear - 1, end + 1]) {
      const scenario = scenarioWith({ vehiclePlans: { "SIM01-VEHICLE": { transitionYear: year, targetPresetId: "sim01-electric" } } });
      expect(transitionEventsFor({ project: sim01Project, fleetVehicles: sim01Fleet, scenario })).toEqual([]);
    }
  });
});

describe("scenario isolation", () => {
  it("resolves two scenarios over one fleet without either affecting the other", () => {
    const early = createScenarioDocument({ "SIM01-VEHICLE": { transitionYear: 2026, targetPresetId: "sim01-electric" } });
    const late = createScenarioDocument({ "SIM01-VEHICLE": { transitionYear: 2029, targetPresetId: "sim01-electric" } });

    expect(effectiveFleetStateFor({ project: sim01Project, fleetVehicles: sim01Fleet, scenario: early }, 2027)[0].presetId).toBe("sim01-electric");
    expect(effectiveFleetStateFor({ project: sim01Project, fleetVehicles: sim01Fleet, scenario: late }, 2027)[0].presetId).toBe("sim01-diesel");

    // Editing one plan leaves the other and the shared fleet untouched.
    early.vehiclePlans["SIM01-VEHICLE"].transitionYear = 2028;
    expect(late.vehiclePlans["SIM01-VEHICLE"].transitionYear).toBe(2029);
    expect(sim01Fleet[0].currentPresetId).toBe("sim01-diesel");
  });
});
