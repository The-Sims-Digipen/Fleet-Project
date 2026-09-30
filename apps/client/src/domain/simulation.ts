import { effectivePresetIdFor, type ProjectDocument, type ProjectVehicle } from "./project";
import type { VehiclePreset } from "../vehicles/types";

export type AnnualSimulationYear = {
  year: number;
  distanceKm: number;
  fuelLitres: number;
  electricityKWh: number;
  fuelCost: number;
  electricityCost: number;
  maintenanceCost: number;
  leasePayments: number;
  vehicleAcquisitionCapex: number;
  transitionCapex: number;
  replacementCapex: number;
  leaseExitFees: number;
  disposalCredits: number;
  netCashCost: number;
  discountedNetCashCost: number;
  cumulativeCashCost: number;
  cumulativeDiscountedCashCost: number;
  emissionsKgCo2e: number;
  transitionCount: number;
};

export type SimulationTotals = {
  totalDistanceKm: number;
  transitionCount: number;
  totalFuelLitres: number;
  totalElectricityKWh: number;
  fuelCost: number;
  electricityCost: number;
  maintenanceCost: number;
  leasePayments: number;
  operatingCost: number;
  vehicleAcquisitionCapex: number;
  transitionCapex: number;
  replacementCapex: number;
  leaseExitFees: number;
  disposalCredits: number;
  terminalCredit: number;
  nominalTco: number;
  tco: number;
  emissionsKgCo2e: number;
  costPerKm: number | null;
  costPerVehicle: number | null;
  savings: number | null;
  costDifference: number | null;
  fuelDisplacedLitres: number;
  emissionsReductionKgCo2e: number | null;
  emissionsReductionPercentage: number | null;
};

export type SimulationSeries = {
  annual: AnnualSimulationYear[];
  totals: SimulationTotals;
};

export type ScenarioSimulationYear = AnnualSimulationYear & {
  annualCashSavings: number;
  cumulativeCashSavings: number;
};

export type ScenarioSimulation = Omit<SimulationSeries, "annual"> & {
  annual: ScenarioSimulationYear[];
  scenarioId: string;
  scenarioName: string;
  paybackYear: number | null;
  paybackStatus: "initial-parity" | "reached" | "not-reached";
};

export type ProjectSimulation = {
  years: number[];
  baseline: SimulationSeries;
  scenarios: Record<string, ScenarioSimulation>;
};

type Holding =
  | { kind: "owned"; acquiredAtIndex: number; acquisitionValue: number; endResidualValue: number }
  | { kind: "leased"; annualPayment: number; exitFee: number };

type MutableYear = Omit<AnnualSimulationYear, "discountedNetCashCost" | "cumulativeCashCost" | "cumulativeDiscountedCashCost">;

function initialHolding(vehicle: ProjectVehicle): Holding {
  return vehicle.currentHolding.kind === "owned"
    ? {
      kind: "owned",
      acquiredAtIndex: 0,
      acquisitionValue: vehicle.currentHolding.currentValue,
      endResidualValue: vehicle.currentHolding.endResidualValue,
    }
    : { kind: "leased", annualPayment: vehicle.currentHolding.annualPayment, exitFee: vehicle.currentHolding.exitFee };
}

function acquiredHolding(preset: VehiclePreset, acquiredAtIndex: number): Holding {
  return preset.acquisition.kind === "owned"
    ? {
      kind: "owned",
      acquiredAtIndex,
      acquisitionValue: preset.purchaseCost,
      endResidualValue: preset.acquisition.endResidualValue,
    }
    : { kind: "leased", annualPayment: preset.acquisition.annualPayment, exitFee: preset.acquisition.exitFee };
}

function disposalValue(holding: Holding, yearIndex: number, yearCount: number): number {
  if (holding.kind !== "owned") return 0;
  const remainingYears = yearCount - holding.acquiredAtIndex;
  if (remainingYears <= 0) return holding.endResidualValue;
  return holding.acquisitionValue
    + (holding.endResidualValue - holding.acquisitionValue) * (yearIndex - holding.acquiredAtIndex) / remainingYears;
}

function createYear(year: number): MutableYear {
  return {
    year,
    distanceKm: 0,
    fuelLitres: 0,
    electricityKWh: 0,
    fuelCost: 0,
    electricityCost: 0,
    maintenanceCost: 0,
    leasePayments: 0,
    vehicleAcquisitionCapex: 0,
    transitionCapex: 0,
    replacementCapex: 0,
    leaseExitFees: 0,
    disposalCredits: 0,
    netCashCost: 0,
    emissionsKgCo2e: 0,
    transitionCount: 0,
  };
}

function calculateSeries(document: ProjectDocument, scenarioId: string | null, years: readonly number[]): SimulationSeries {
  const { analysis } = document;
  const annual = years.map(createYear);
  const presetById = new Map(document.vehiclePresets.map((preset) => [preset.id, preset]));
  const scenario = scenarioId === null ? undefined : document.scenarios.find((entry) => entry.id === scenarioId);
  let terminalCredit = 0;

  for (const vehicle of document.environment.vehicles) {
    const transitions = scenario?.vehiclePlans[vehicle.id]?.transitions ?? [];
    const firstTransitionYear = transitions[0]?.year;
    const replacementYear = vehicle.replacementYear;
    const replacementIsSuperseded = replacementYear !== null
      && firstTransitionYear !== undefined
      && firstTransitionYear <= replacementYear;
    const transitionBeforeWindow = transitions.filter((transition) => transition.year < analysis.startYear).at(-1);
    const replacementBeforeWindow = replacementYear !== null
      && replacementYear < analysis.startYear
      && !replacementIsSuperseded
      ? replacementYear
      : undefined;
    const preWindowPresetId = transitionBeforeWindow?.targetPresetId
      ?? (replacementBeforeWindow === undefined ? null : vehicle.baselinePresetId);
    const preWindowAcquisitionYear = transitionBeforeWindow?.year ?? replacementBeforeWindow;
    const initialPreset = preWindowPresetId ? presetById.get(preWindowPresetId) : undefined;
    let holding = initialPreset && preWindowAcquisitionYear !== undefined
      ? acquiredHolding(initialPreset, preWindowAcquisitionYear - analysis.startYear)
      : initialHolding(vehicle);

    years.forEach((year, index) => {
      const row = annual[index];
      const transition = transitions.find((entry) => entry.year === year);
      const replacement = !transition
        && !replacementIsSuperseded
        && replacementYear === year
        && vehicle.baselinePresetId !== null;
      if (transition || replacement) {
        if (holding.kind === "owned") row.disposalCredits += disposalValue(holding, index, analysis.yearCount);
        else row.leaseExitFees += holding.exitFee;

        const incomingPresetId = transition?.targetPresetId ?? vehicle.baselinePresetId;
        const incomingPreset = incomingPresetId ? presetById.get(incomingPresetId) : undefined;
        if (incomingPreset) {
          holding = acquiredHolding(incomingPreset, index);
          if (holding.kind === "owned") {
            row.vehicleAcquisitionCapex += incomingPreset.purchaseCost;
            if (transition) row.transitionCapex += incomingPreset.purchaseCost;
            else row.replacementCapex += incomingPreset.purchaseCost;
          }
        }
        if (transition) row.transitionCount += 1;
      }

      const activePresetId = effectivePresetIdFor(document, scenarioId, vehicle.id, year);
      const activePreset = activePresetId ? presetById.get(activePresetId) : undefined;

      row.distanceKm += vehicle.annualKm;
      if (activePreset) {
        const consumesFuel = activePreset.propulsion === "diesel" || activePreset.propulsion === "petrol" || activePreset.propulsion === "hybrid";
        const consumesElectricity = activePreset.propulsion === "electric" || activePreset.propulsion === "hybrid";
        if (consumesFuel) row.fuelLitres += vehicle.annualKm * activePreset.litresPer100Km / 100;
        if (consumesElectricity) row.electricityKWh += vehicle.annualKm * activePreset.kWhPer100Km / 100 / activePreset.chargingEfficiency;
        row.maintenanceCost += activePreset.maintenanceCostPerYear;
      }
      if (holding.kind === "leased") row.leasePayments += holding.annualPayment;
    });

    if (holding.kind === "owned") terminalCredit += holding.endResidualValue;
  }

  let cumulativeCashCost = 0;
  let cumulativeDiscountedCashCost = 0;
  let discountedAnnualTotal = 0;
  const projectedAnnual = annual.map((row, index): AnnualSimulationYear => {
    row.fuelCost = row.fuelLitres * analysis.fuelPricePerLitre;
    row.electricityCost = row.electricityKWh * analysis.electricityPricePerKWh;
    row.emissionsKgCo2e = row.fuelLitres * analysis.fuelEmissionsKgCo2ePerLitre
      + row.electricityKWh * analysis.electricityEmissionsKgCo2ePerKWh;
    row.netCashCost = row.vehicleAcquisitionCapex + row.leaseExitFees + row.fuelCost + row.electricityCost
      + row.maintenanceCost + row.leasePayments - row.disposalCredits;
    const discountFactor = (1 + analysis.discountRate) ** index;
    const discountedNetCashCost = row.netCashCost / discountFactor;
    cumulativeCashCost += row.netCashCost;
    cumulativeDiscountedCashCost += discountedNetCashCost;
    discountedAnnualTotal += discountedNetCashCost;
    return { ...row, discountedNetCashCost, cumulativeCashCost, cumulativeDiscountedCashCost };
  });

  const totalDistanceKm = projectedAnnual.reduce((sum, row) => sum + row.distanceKm, 0);
  const transitionCount = projectedAnnual.reduce((sum, row) => sum + row.transitionCount, 0);
  const totalFuelLitres = projectedAnnual.reduce((sum, row) => sum + row.fuelLitres, 0);
  const totalElectricityKWh = projectedAnnual.reduce((sum, row) => sum + row.electricityKWh, 0);
  const fuelCost = projectedAnnual.reduce((sum, row) => sum + row.fuelCost, 0);
  const electricityCost = projectedAnnual.reduce((sum, row) => sum + row.electricityCost, 0);
  const maintenanceCost = projectedAnnual.reduce((sum, row) => sum + row.maintenanceCost, 0);
  const leasePayments = projectedAnnual.reduce((sum, row) => sum + row.leasePayments, 0);
  const vehicleAcquisitionCapex = projectedAnnual.reduce((sum, row) => sum + row.vehicleAcquisitionCapex, 0);
  const transitionCapex = projectedAnnual.reduce((sum, row) => sum + row.transitionCapex, 0);
  const replacementCapex = projectedAnnual.reduce((sum, row) => sum + row.replacementCapex, 0);
  const leaseExitFees = projectedAnnual.reduce((sum, row) => sum + row.leaseExitFees, 0);
  const disposalCredits = projectedAnnual.reduce((sum, row) => sum + row.disposalCredits, 0);
  const emissionsKgCo2e = projectedAnnual.reduce((sum, row) => sum + row.emissionsKgCo2e, 0);
  const nominalTco = cumulativeCashCost - terminalCredit;
  const discountedTerminalCredit = terminalCredit / (1 + analysis.discountRate) ** analysis.yearCount;
  const tco = discountedAnnualTotal - discountedTerminalCredit;

  return {
    annual: projectedAnnual,
    totals: {
      totalDistanceKm,
      transitionCount,
      totalFuelLitres,
      totalElectricityKWh,
      fuelCost,
      electricityCost,
      maintenanceCost,
      leasePayments,
      operatingCost: fuelCost + electricityCost + maintenanceCost + leasePayments,
      vehicleAcquisitionCapex,
      transitionCapex,
      replacementCapex,
      leaseExitFees,
      disposalCredits,
      terminalCredit,
      nominalTco,
      tco,
      emissionsKgCo2e,
      costPerKm: totalDistanceKm === 0 ? null : tco / totalDistanceKm,
      costPerVehicle: document.environment.vehicles.length === 0 ? null : tco / document.environment.vehicles.length,
      savings: null,
      costDifference: null,
      fuelDisplacedLitres: 0,
      emissionsReductionKgCo2e: null,
      emissionsReductionPercentage: null,
    },
  };
}

function payback(
  baseline: SimulationSeries,
  scenario: SimulationSeries,
): { year: number | null; status: ScenarioSimulation["paybackStatus"] } {
  if (!baseline.annual.length || !scenario.annual.length) return { year: null, status: "not-reached" };
  const savings = baseline.annual.map((row, index) => row.cumulativeCashCost - scenario.annual[index].cumulativeCashCost);
  const startYear = baseline.annual[0].year;
  const baselineUpfrontCost = baseline.annual[0].vehicleAcquisitionCapex + baseline.annual[0].leaseExitFees - baseline.annual[0].disposalCredits;
  const scenarioUpfrontCost = scenario.annual[0].vehicleAcquisitionCapex + scenario.annual[0].leaseExitFees - scenario.annual[0].disposalCredits;
  const upfrontPremium = scenarioUpfrontCost - baselineUpfrontCost;
  if (upfrontPremium <= 0 && savings.every((value) => value >= 0)) return { year: startYear, status: "initial-parity" };
  const index = savings.findIndex((value, current) => value >= 0 && savings.slice(current).every((later) => later >= 0));
  return index < 0 ? { year: null, status: "not-reached" } : { year: baseline.annual[index].year, status: "reached" };
}

/** Derive baseline and every Scenario from the same validated Project assumptions. */
export function simulateProject(document: ProjectDocument): ProjectSimulation {
  const years = Array.from({ length: document.analysis.yearCount }, (_, index) => document.analysis.startYear + index);
  const baseline = calculateSeries(document, null, years);
  const scenarios = Object.fromEntries(document.scenarios.map((scenario) => {
    const result = calculateSeries(document, scenario.id, years);
    result.totals.savings = baseline.totals.tco - result.totals.tco;
    result.totals.costDifference = result.totals.tco - baseline.totals.tco;
    result.totals.fuelDisplacedLitres = baseline.totals.totalFuelLitres - result.totals.totalFuelLitres;
    result.totals.emissionsReductionKgCo2e = baseline.totals.emissionsKgCo2e - result.totals.emissionsKgCo2e;
    result.totals.emissionsReductionPercentage = baseline.totals.emissionsKgCo2e === 0
      ? null
      : result.totals.emissionsReductionKgCo2e / baseline.totals.emissionsKgCo2e * 100;
    const reached = payback(baseline, result);
    return [scenario.id, {
      ...result,
      annual: result.annual.map((row, index) => ({
        ...row,
        annualCashSavings: baseline.annual[index].netCashCost - row.netCashCost,
        cumulativeCashSavings: baseline.annual[index].cumulativeCashCost - row.cumulativeCashCost,
      })),
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      paybackYear: reached.year,
      paybackStatus: reached.status,
    } satisfies ScenarioSimulation];
  }));
  return { years, baseline, scenarios };
}
