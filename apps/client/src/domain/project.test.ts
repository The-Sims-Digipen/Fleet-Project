import { describe, expect, it } from "vitest";

import { createMockPresets } from "./mockProject";
import {
  addVehicleTransition,
  createProject,
  DEFAULT_DEPOT,
  effectivePresetIdFor,
  normalizeProject,
  removeVehicleTransition,
  replaceVehicleTransitions,
  updateVehicleTransition,
  type ProjectVehicle,
} from "./project";

const vehicle = (id: string, baselinePresetId: string | null): ProjectVehicle => ({
  id,
  name: id,
  baselinePresetId,
  transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  annualKm: 10_000,
  typicalDailyKm: 50,
  operatingDays: 200,
  utilisation: 0.8,
  routePattern: "predictable",
  returnsToDepot: true,
  depotDwellHours: 12,
  externalChargingAccess: false,
  replacementYear: null,
  currentHolding: { kind: "owned", currentValue: 10_000, endResidualValue: 2_000 },
});

describe("Project document", () => {
  it("creates and validates one complete aggregate", () => {
    const presets = createMockPresets();
    const document = createProject({
      id: "project-1",
      name: "Depot transition",
      depot: DEFAULT_DEPOT,
      vehicles: [vehicle("vehicle-1", presets[0].id)],
      vehiclePresets: presets,
      scenarios: [{ id: "scenario-1", name: "Plan A", vehiclePlans: {} }],
      activeScenarioId: "scenario-1",
    });

    expect(document).toMatchObject({
      version: 5,
      id: "project-1",
      name: "Depot transition",
      activeScenarioId: "scenario-1",
      environment: { depot: { id: "default-project-depot" }, vehicles: [{ id: "vehicle-1", baselinePresetId: presets[0].id }] },
      scenarios: [{ id: "scenario-1", name: "Plan A" }],
    });
    expect(normalizeProject(JSON.parse(JSON.stringify(document)))).toEqual(document);
  });

  it("adds transitions in ascending order even outside the analysis period", () => {
    const presets = createMockPresets();
    const document = createProject({
      id: "project-1",
      name: "Depot transition",
      vehicles: [vehicle("vehicle-1", presets[0].id)],
      vehiclePresets: presets,
      scenarios: [{ id: "scenario-1", name: "Plan A", vehiclePlans: {} }],
      activeScenarioId: "scenario-1",
    });

    const reference = { scenarioId: "scenario-1", vehicleId: "vehicle-1" };
    const later = addVehicleTransition(document, reference, { year: 2040, targetPresetId: presets[1].id });
    const earlier = addVehicleTransition(later, reference, { year: 2027, targetPresetId: presets[2].id });

    expect(earlier.scenarios[0].vehiclePlans["vehicle-1"].transitions).toEqual([
      { year: 2027, targetPresetId: presets[2].id },
      { year: 2040, targetPresetId: presets[1].id },
    ]);
    expect(document.scenarios[0].vehiclePlans).toEqual({});
  });

  it("resolves null baselines and every transition at or before the selected year", () => {
    const presets = createMockPresets();
    const base = createProject({
      id: "project-1",
      name: "Depot transition",
      vehicles: [vehicle("vehicle-1", null)],
      vehiclePresets: presets,
      scenarios: [{ id: "scenario-1", name: "Plan A", vehiclePlans: {} }],
      activeScenarioId: "scenario-1",
    });
    const reference = { scenarioId: "scenario-1", vehicleId: "vehicle-1" };
    const first = addVehicleTransition(base, reference, { year: 2028, targetPresetId: presets[0].id });
    const second = addVehicleTransition(first, reference, { year: 2032, targetPresetId: presets[1].id });

    expect(effectivePresetIdFor(second, "scenario-1", "vehicle-1", 2027)).toBeNull();
    expect(effectivePresetIdFor(second, "scenario-1", "vehicle-1", 2028)).toBe(presets[0].id);
    expect(effectivePresetIdFor(second, "scenario-1", "vehicle-1", 2030)).toBe(presets[0].id);
    expect(effectivePresetIdFor(second, "scenario-1", "vehicle-1", 2032)).toBe(presets[1].id);
    expect(effectivePresetIdFor(second, "scenario-1", "vehicle-1", 2040)).toBe(presets[1].id);
  });

  it("updates, removes, and replaces transition timelines without allowing duplicate years", () => {
    const presets = createMockPresets();
    const base = createProject({
      id: "project-1",
      name: "Depot transition",
      vehicles: [vehicle("vehicle-1", presets[0].id)],
      vehiclePresets: presets,
      scenarios: [{ id: "scenario-1", name: "Plan A", vehiclePlans: {} }],
      activeScenarioId: "scenario-1",
    });
    const reference = { scenarioId: "scenario-1", vehicleId: "vehicle-1" };
    const first = addVehicleTransition(base, reference, { year: 2030, targetPresetId: presets[1].id });
    const second = addVehicleTransition(first, reference, { year: 2035, targetPresetId: presets[2].id });

    expect(() => addVehicleTransition(second, reference, { year: 2035, targetPresetId: presets[3].id })).toThrow(/already has a transition/i);
    const updated = updateVehicleTransition(second, reference, 2035, { year: 2028, targetPresetId: presets[3].id });
    expect(updated.scenarios[0].vehiclePlans["vehicle-1"].transitions.map((entry) => entry.year)).toEqual([2028, 2030]);
    const removed = removeVehicleTransition(updated, reference, 2030);
    expect(removed.scenarios[0].vehiclePlans["vehicle-1"].transitions).toEqual([{ year: 2028, targetPresetId: presets[3].id }]);
    const replaced = replaceVehicleTransitions(removed, reference, []);
    expect(replaced.scenarios[0].vehiclePlans).toEqual({});
  });

  it("rejects invalid identities and references throughout the aggregate", () => {
    const presets = createMockPresets();
    const valid = createProject({
      id: "project-1",
      name: "Depot transition",
      vehicles: [vehicle("vehicle-1", presets[0].id)],
      vehiclePresets: presets,
      scenarios: [{ id: "scenario-1", name: "Plan A", vehiclePlans: {} }],
      activeScenarioId: "scenario-1",
    });

    expect(() => normalizeProject({ ...valid, activeScenarioId: "missing" })).toThrow(/activeScenarioId.*resolve/i);
    expect(() => normalizeProject({ ...valid, scenarios: [] })).toThrow(/at least one Scenario/i);
    expect(() => normalizeProject({ ...valid, environment: { ...valid.environment, vehicles: [...valid.environment.vehicles, valid.environment.vehicles[0]] } })).toThrow(/duplicate identifiers/i);
    expect(() => normalizeProject({ ...valid, vehiclePresets: [...valid.vehiclePresets, valid.vehiclePresets[0]] })).toThrow(/duplicate identifiers/i);
    expect(addVehicleTransition(valid, { scenarioId: "scenario-1", vehicleId: "vehicle-1" }, { year: 2040, targetPresetId: presets[1].id })
      .scenarios[0].vehiclePlans["vehicle-1"].transitions).toEqual([{ year: 2040, targetPresetId: presets[1].id }]);
    expect(() => normalizeProject({
      ...valid,
      scenarios: [{ ...valid.scenarios[0], vehiclePlans: { missing: { transitions: [] } } }],
    })).toThrow(/does not resolve to a Project Vehicle/i);
    expect(() => normalizeProject({
      ...valid,
      scenarios: [{ ...valid.scenarios[0], vehiclePlans: { "vehicle-1": { transitions: [{ year: 2030, targetPresetId: "missing" }] } } }],
    })).toThrow(/does not resolve to Preset/i);
  });

  it("rejects a fleet larger than the available spawn configuration", () => {
    const presets = createMockPresets();
    const template = vehicle("vehicle-template", presets[0].id);

    expect(() => createProject({
      id: "project-1",
      name: "Fleet capacity",
      vehicles: Array.from({ length: 11 }, (_, index) => ({ ...template, id: `vehicle-${index}` })),
      vehiclePresets: presets,
      scenarios: [{ id: "scenario-1", name: "Plan A", vehiclePlans: {} }],
      activeScenarioId: "scenario-1",
    })).toThrow(/fleet.*capacity/i);
  });
});
