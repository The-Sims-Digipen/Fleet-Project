import { describe, expect, it } from "vitest";

import { createProjectFixture } from "./projectFixture";
import { effectivePresetIdFor, normalizeProject } from "./project";
import { simulateProject } from "./simulation";

function workedTransitionProject() {
  const project = createProjectFixture();
  const diesel = project.vehiclePresets.find((preset) => preset.id === "diesel-van")!;
  const electric = project.vehiclePresets.find((preset) => preset.id === "electric-van")!;
  const vehicle = project.environment.vehicles[0];

  return normalizeProject({
    ...project,
    analysis: {
      ...project.analysis,
      startYear: 2026,
      yearCount: 4,
      fuelPricePerLitre: 2,
      electricityPricePerKWh: 0.25,
      fuelEmissionsKgCo2ePerLitre: 2,
      electricityEmissionsKgCo2ePerKWh: 0.5,
      discountRate: 0,
    },
    vehiclePresets: [
      { ...diesel, litresPer100Km: 10, kWhPer100Km: 0, maintenanceCostPerYear: 500 },
      { ...electric, litresPer100Km: 0, kWhPer100Km: 20, chargingEfficiency: 1, purchaseCost: 12_000, maintenanceCostPerYear: 200, acquisition: { kind: "owned", endResidualValue: 2_000 } },
      ...project.vehiclePresets.filter((preset) => !["diesel-van", "electric-van"].includes(preset.id)),
    ],
    environment: {
      ...project.environment,
      vehicles: [{ ...vehicle, annualKm: 10_000, baselinePresetId: diesel.id, replacementYear: null, currentHolding: { kind: "owned", currentValue: 0, endResidualValue: 0 } }],
    },
    scenarios: [{
      ...project.scenarios[0],
      vehiclePlans: { [vehicle.id]: { transitions: [{ year: 2026, targetPresetId: electric.id }] } },
    }],
    activeScenarioId: project.scenarios[0].id,
  });
}

describe("Project simulation", () => {
  it("derives worked annual energy, cost, emissions, and payback from Project inputs", () => {
    const simulation = simulateProject(workedTransitionProject());
    const scenario = simulation.scenarios["plan-a"];

    expect(simulation.baseline.totals.tco).toBe(10_000);
    expect(scenario.annual.map(({ netCashCost }) => netCashCost)).toEqual([12_700, 700, 700, 700]);
    expect(scenario.annual.map(({ emissionsKgCo2e }) => emissionsKgCo2e)).toEqual([1_000, 1_000, 1_000, 1_000]);
    expect(scenario.totals.tco).toBe(12_800);
    expect(scenario.totals.savings).toBe(-2_800);
    expect(scenario.totals.totalFuelLitres).toBe(0);
    expect(scenario.totals.totalElectricityKWh).toBe(8_000);
    expect(scenario.paybackYear).toBeNull();
  });

  it("follows multiple canonical transitions through a hybrid state and ignores delayed events", () => {
    const document = workedTransitionProject();
    const vehicleId = document.environment.vehicles[0].id;
    const hybrid = document.vehiclePresets.find((preset) => preset.id === "hybrid-van")!;
    const diesel = document.vehiclePresets.find((preset) => preset.id === "diesel-van")!;
    document.vehiclePresets = document.vehiclePresets.map((preset) => preset.id === hybrid.id
      ? { ...preset, litresPer100Km: 5, kWhPer100Km: 15, chargingEfficiency: 0.75 }
      : preset);
    document.scenarios[0].vehiclePlans[vehicleId].transitions = [
      { year: 2027, targetPresetId: hybrid.id },
      { year: 2028, targetPresetId: "electric-van" },
      { year: 2040, targetPresetId: diesel.id },
    ];

    const simulation = simulateProject(normalizeProject(document));
    const scenario = simulation.scenarios["plan-a"];

    expect(scenario.annual.map(({ fuelLitres }) => fuelLitres)).toEqual([1_000, 500, 0, 0]);
    expect(scenario.annual.map(({ electricityKWh }) => electricityKWh)).toEqual([0, 2_000, 2_000, 2_000]);
    expect(scenario.annual.map(({ fuelCost }) => fuelCost)).toEqual([2_000, 1_000, 0, 0]);
    expect(scenario.annual.map(({ electricityCost }) => electricityCost)).toEqual([0, 500, 500, 500]);
    expect(scenario.annual.map(({ emissionsKgCo2e }) => emissionsKgCo2e)).toEqual([2_000, 2_000, 1_000, 1_000]);
    expect(scenario.annual.map(({ transitionCount }) => transitionCount)).toEqual([0, 1, 1, 0]);
    expect(effectivePresetIdFor(document, "plan-a", vehicleId, 2027)).toBe(hybrid.id);
    expect(effectivePresetIdFor(document, "plan-a", vehicleId, 2039)).toBe("electric-van");
    expect(effectivePresetIdFor(document, "plan-a", vehicleId, 2040)).toBe(diesel.id);
  });

  it("supports a null baseline and applies an in-window transition when it becomes effective", () => {
    const document = workedTransitionProject();
    const vehicle = document.environment.vehicles[0];
    document.environment.vehicles[0] = { ...vehicle, baselinePresetId: null };
    document.scenarios[0].vehiclePlans[vehicle.id].transitions = [
      { year: 2028, targetPresetId: "electric-van" },
    ];

    const scenario = simulateProject(normalizeProject(document)).scenarios["plan-a"];

    expect(scenario.annual.map(({ fuelLitres, electricityKWh }) => [fuelLitres, electricityKWh])).toEqual([
      [0, 0],
      [0, 0],
      [0, 2_000],
      [0, 2_000],
    ]);
    expect(scenario.annual.map(({ transitionCount }) => transitionCount)).toEqual([0, 0, 1, 0]);
  });

  it("applies the shared discount rate to present-value TCO while retaining nominal cash flows", () => {
    const document = workedTransitionProject();
    document.analysis.discountRate = 0.1;
    const scenario = simulateProject(normalizeProject(document)).scenarios["plan-a"];

    expect(scenario.totals.tco).toBeCloseTo(13_074.77, 2);
    expect(scenario.totals.tco).not.toBe(scenario.totals.nominalTco);
    expect(scenario.annual.map(({ netCashCost }) => netCashCost)).toEqual([12_700, 700, 700, 700]);
  });
});
