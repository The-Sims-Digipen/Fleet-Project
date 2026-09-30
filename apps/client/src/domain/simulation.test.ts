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
  it.each([
    { transitionYear: 2027, scenarioTco: 4_000, disposalCredits: 4_000 },
    { transitionYear: 2028, scenarioTco: 7_000, disposalCredits: 10_000 },
  ])("preserves SIM02 replacement/disposal accounting for a transition in $transitionYear", ({ transitionYear, scenarioTco, disposalCredits }) => {
    const document = workedTransitionProject();
    const vehicle = document.environment.vehicles[0];
    document.analysis.yearCount = 3;
    document.environment.vehicles[0] = {
      ...vehicle,
      annualKm: 0,
      replacementYear: 2027,
      currentHolding: { kind: "owned", currentValue: 6_000, endResidualValue: 0 },
    };
    document.vehiclePresets = document.vehiclePresets.map((preset) => ({
      ...preset,
      maintenanceCostPerYear: 0,
      ...(preset.id === "diesel-van" ? { purchaseCost: 9_000, acquisition: { kind: "owned" as const, endResidualValue: 3_000 } } : {}),
      ...(preset.id === "electric-van" ? { purchaseCost: 12_000, acquisition: { kind: "owned" as const, endResidualValue: 4_000 } } : {}),
    }));
    document.scenarios[0].vehiclePlans[vehicle.id].transitions = [{ year: transitionYear, targetPresetId: "electric-van" }];

    const simulation = simulateProject(normalizeProject(document));
    const scenario = simulation.scenarios["plan-a"];

    expect(simulation.baseline.totals.tco).toBe(2_000);
    expect(scenario.totals.tco).toBe(scenarioTco);
    expect(scenario.totals.disposalCredits).toBe(disposalCredits);
    expect(scenario.totals.terminalCredit).toBe(4_000);
    expect(scenario.totals.replacementCapex).toBe(transitionYear === 2027 ? 0 : 9_000);
  });

  it("preserves SIM01 lasting cash payback independently of terminal residual credits", () => {
    const document = workedTransitionProject();
    document.vehiclePresets = document.vehiclePresets.map((preset) => preset.id === "electric-van"
      ? { ...preset, purchaseCost: 6_000 }
      : preset);

    const simulation = simulateProject(normalizeProject(document));
    const scenario = simulation.scenarios["plan-a"];

    expect(scenario.annual.map((row, index) => simulation.baseline.annual[index].cumulativeCashCost - row.cumulativeCashCost))
      .toEqual([-4_200, -2_400, -600, 1_200]);
    expect(scenario.totals.tco).toBe(6_800);
    expect(scenario.totals.savings).toBe(3_200);
    expect(scenario.paybackYear).toBe(2029);
    expect(scenario.paybackStatus).toBe("reached");
  });

  it("preserves SIM05 lease payments and one outgoing exit fee without purchase or residual credits", () => {
    const document = workedTransitionProject();
    document.analysis.yearCount = 2;
    document.environment.vehicles[0] = {
      ...document.environment.vehicles[0],
      annualKm: 0,
      currentHolding: { kind: "leased", annualPayment: 1_000, exitFee: 100 },
    };
    document.vehiclePresets = document.vehiclePresets.map((preset) => ({
      ...preset,
      maintenanceCostPerYear: 0,
      ...(preset.id === "electric-van" ? { acquisition: { kind: "leased" as const, annualPayment: 800, exitFee: 250 } } : {}),
    }));

    const simulation = simulateProject(normalizeProject(document));
    const scenario = simulation.scenarios["plan-a"];

    expect(simulation.baseline.totals.tco).toBe(2_000);
    expect(scenario.annual.map((row) => row.netCashCost)).toEqual([900, 800]);
    expect(scenario.totals.tco).toBe(1_700);
    expect(scenario.totals.vehicleAcquisitionCapex).toBe(0);
    expect(scenario.totals.terminalCredit).toBe(0);
  });

  it("returns finite empty-fleet results with unavailable ratios", () => {
    const document = workedTransitionProject();
    document.environment.vehicles = [];
    document.scenarios[0].vehiclePlans = {};
    const simulation = simulateProject(normalizeProject(document));

    for (const series of [simulation.baseline, ...Object.values(simulation.scenarios)]) {
      expect(series.totals.tco).toBe(0);
      expect(series.totals.costPerKm).toBeNull();
      expect(series.totals.costPerVehicle).toBeNull();
      expect(series.annual).toHaveLength(4);
      for (const row of series.annual) expect(Object.values(row).every(Number.isFinite)).toBe(true);
    }
    expect(simulation.scenarios["plan-a"].totals.emissionsReductionPercentage).toBeNull();
  });

  it("is deterministic and leaves the authoritative Project unchanged", () => {
    const document = workedTransitionProject();
    const before = structuredClone(document);
    const first = simulateProject(document);

    expect(simulateProject(document)).toEqual(first);
    expect(document).toEqual(before);
  });

  it("derives worked annual energy, cost, emissions, and payback from Project inputs", () => {
    const simulation = simulateProject(workedTransitionProject());
    const scenario = simulation.scenarios["plan-a"];

    expect(simulation.baseline.totals.tco).toBe(10_000);
    expect(scenario.annual.map(({ netCashCost }) => netCashCost)).toEqual([12_700, 700, 700, 700]);
    expect(scenario.annual.map(({ emissionsKgCo2e }) => emissionsKgCo2e)).toEqual([1_000, 1_000, 1_000, 1_000]);
    expect(scenario.totals.tco).toBe(12_800);
    expect(scenario.totals.savings).toBe(-2_800);
    expect(scenario.totals.costDifference).toBe(2_800);
    expect(scenario.totals.costPerKm).toBe(0.32);
    expect(scenario.totals.costPerVehicle).toBe(12_800);
    expect(scenario.totals.fuelDisplacedLitres).toBe(4_000);
    expect(scenario.totals.emissionsReductionKgCo2e).toBe(4_000);
    expect(scenario.totals.emissionsReductionPercentage).toBe(50);
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
    expect(scenario.totals.emissionsReductionKgCo2e).toBe(-2_000);
    expect(scenario.totals.emissionsReductionPercentage).toBeNull();
  });

  it("starts from the holding of the last transition before the analysis window", () => {
    const document = workedTransitionProject();
    const vehicle = document.environment.vehicles[0];
    const electric = document.vehiclePresets.find((preset) => preset.id === "electric-van")!;
    const hybrid = document.vehiclePresets.find((preset) => preset.id === "hybrid-van")!;
    document.analysis.startYear = 2028;
    document.analysis.yearCount = 2;
    document.environment.vehicles[0] = {
      ...vehicle,
      replacementYear: 2029,
      currentHolding: { kind: "leased", annualPayment: 1_000, exitFee: 50 },
    };
    document.vehiclePresets = document.vehiclePresets.map((preset) => preset.id === electric.id
      ? { ...preset, acquisition: { kind: "leased" as const, annualPayment: 400, exitFee: 250 } }
      : preset);
    document.scenarios[0].vehiclePlans[vehicle.id].transitions = [
      { year: 2026, targetPresetId: electric.id },
      { year: 2029, targetPresetId: hybrid.id },
    ];

    const scenario = simulateProject(normalizeProject(document)).scenarios["plan-a"];

    expect(scenario.annual.map(({ leasePayments }) => leasePayments)).toEqual([400, 0]);
    expect(scenario.annual.map(({ leaseExitFees }) => leaseExitFees)).toEqual([0, 250]);
    expect(scenario.annual.map(({ transitionCount }) => transitionCount)).toEqual([0, 1]);
    expect(scenario.annual[1].replacementCapex).toBe(0);
  });

  it("uses the actual pre-window acquisition year when valuing a later disposal", () => {
    const document = workedTransitionProject();
    const vehicle = document.environment.vehicles[0];
    const electric = document.vehiclePresets.find((preset) => preset.id === "electric-van")!;
    const hybrid = document.vehiclePresets.find((preset) => preset.id === "hybrid-van")!;
    document.analysis.startYear = 2028;
    document.analysis.yearCount = 3;
    document.vehiclePresets = document.vehiclePresets.map((preset) => preset.id === electric.id
      ? { ...preset, purchaseCost: 12_000, acquisition: { kind: "owned" as const, endResidualValue: 2_000 } }
      : preset);
    document.scenarios[0].vehiclePlans[vehicle.id].transitions = [
      { year: 2026, targetPresetId: electric.id },
      { year: 2029, targetPresetId: hybrid.id },
    ];

    const scenario = simulateProject(normalizeProject(document)).scenarios["plan-a"];

    expect(scenario.annual[1].disposalCredits).toBe(6_000);
    expect(scenario.annual[1].transitionCount).toBe(1);
  });

  it("starts from a baseline replacement acquired before the analysis window", () => {
    const document = workedTransitionProject();
    const vehicle = document.environment.vehicles[0];
    document.analysis.startYear = 2028;
    document.analysis.yearCount = 3;
    document.environment.vehicles[0] = {
      ...vehicle,
      replacementYear: 2026,
      currentHolding: { kind: "owned", currentValue: 6_000, endResidualValue: 0 },
    };
    document.scenarios[0].vehiclePlans[vehicle.id].transitions = [
      { year: 2029, targetPresetId: "electric-van" },
    ];

    const simulation = simulateProject(normalizeProject(document));
    const scenario = simulation.scenarios["plan-a"];

    expect(simulation.baseline.totals.terminalCredit).toBe(6_000);
    expect(simulation.baseline.totals.vehicleAcquisitionCapex).toBe(0);
    expect(scenario.annual[1].disposalCredits).toBe(16_400);
  });

  it("does not label payback as initial parity when a lease exit fee creates an upfront premium", () => {
    const document = workedTransitionProject();
    const vehicle = document.environment.vehicles[0];
    const electric = document.vehiclePresets.find((preset) => preset.id === "electric-van")!;
    document.environment.vehicles[0] = {
      ...vehicle,
      currentHolding: { kind: "leased", annualPayment: 1_000, exitFee: 200 },
    };
    document.vehiclePresets = document.vehiclePresets.map((preset) => preset.id === electric.id
      ? { ...preset, acquisition: { kind: "leased" as const, annualPayment: 0, exitFee: 200 } }
      : preset);

    const simulation = simulateProject(normalizeProject(document));
    const scenario = simulation.scenarios["plan-a"];

    expect(scenario.annual[0].leaseExitFees).toBe(200);
    expect(scenario.annual.every((year, index) => year.cumulativeCashCost <= simulation.baseline.annual[index].cumulativeCashCost)).toBe(true);
    expect(scenario.paybackStatus).toBe("reached");
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
