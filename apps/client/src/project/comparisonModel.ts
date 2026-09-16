import type { Scenario, ScenarioVehiclePlan } from "./types";
import type { MockVehicle } from "../state/fleetStore";
import { END_YEAR, START_YEAR } from "./analysisPeriod";
import type { VehiclePreset } from "../vehicles/types";

export const comparisonPreviewAssumptions = {
  dieselPricePerLitre: 2.15,
  electricityPricePerKwh: 0.30,
  dieselKgCo2ePerLitre: 2.70,
  electricityKgCo2ePerKwh: 0.40,
  siteLimitKw: 250,
} as const;

export type ResolvedVehiclePlan = {
  transitionYear: number | null;
  targetPresetId: string;
};

export type ComparisonYearPoint = {
  year: number;
  cumulativeCost: number;
  annualOpex: number;
  annualEmissionsTonnes: number;
  transitionedCount: number;
};

export type ScenarioComparisonResult = {
  scenarioId: string;
  scenarioName: string;
  selectedYear: number;
  electricCount: number;
  combustionCount: number;
  hybridCount: number;
  chargerCount: number;
  peakDemandKw: number;
  siteLimitKw: number;
  capex: number;
  tco: number;
  annualOpex: number;
  emissionsTonnes: number;
  selectedYearEmissionsTonnes: number;
  warnings: string[];
  yearly: ComparisonYearPoint[];
  transitionsByYear: Record<number, number>;
};

const presetById = (presets: VehiclePreset[], id: string) => presets.find((preset) => preset.id === id);

export function defaultTargetPresetId(vehicle: MockVehicle, presets: VehiclePreset[]): string {
  const current = presetById(presets, vehicle.currentPreset);
  if (!current) return vehicle.currentPreset;
  if (current.propulsion === "electric") return current.id;
  return presets.find((preset) => preset.category === current.category && preset.propulsion === "electric")?.id
    ?? presets.find((preset) => preset.propulsion === "electric")?.id
    ?? current.id;
}

export function resolveVehiclePlan(scenario: Scenario, vehicle: MockVehicle, presets: VehiclePreset[]): ResolvedVehiclePlan {
  const plan = scenario.document.vehiclePlans?.[vehicle.vehicleId] as ScenarioVehiclePlan | undefined;
  const transitionYear = plan && "transitionYear" in plan ? plan.transitionYear ?? null : vehicle.plannedTransitionYear;
  const targetPresetId = plan?.targetPresetId && presetById(presets, plan.targetPresetId)
    ? plan.targetPresetId
    : defaultTargetPresetId(vehicle, presets);
  return { transitionYear, targetPresetId };
}

export function effectivePresetForYear(scenario: Scenario, vehicle: MockVehicle, presets: VehiclePreset[], year: number): VehiclePreset | undefined {
  const plan = resolveVehiclePlan(scenario, vehicle, presets);
  const current = presetById(presets, vehicle.currentPreset);
  if (plan.transitionYear !== null && year >= plan.transitionYear) return presetById(presets, plan.targetPresetId) ?? current;
  return current;
}

function annualEnergyCost(vehicle: MockVehicle, preset: VehiclePreset | undefined): number {
  if (!preset) return 0;
  const scale = vehicle.annualDistance / 100;
  return scale * (
    preset.litresPer100Km * comparisonPreviewAssumptions.dieselPricePerLitre
    + preset.kWhPer100Km * comparisonPreviewAssumptions.electricityPricePerKwh
  );
}

function annualEmissionsTonnes(vehicle: MockVehicle, preset: VehiclePreset | undefined): number {
  if (!preset) return 0;
  const scale = vehicle.annualDistance / 100;
  return scale * (
    preset.litresPer100Km * comparisonPreviewAssumptions.dieselKgCo2ePerLitre
    + preset.kWhPer100Km * comparisonPreviewAssumptions.electricityKgCo2ePerKwh
  ) / 1000;
}

export function calculateScenarioComparison(
  scenario: Scenario,
  vehicles: MockVehicle[],
  presets: VehiclePreset[],
  selectedYear: number,
): ScenarioComparisonResult {
  let cumulativeCost = 0;
  let totalCapex = 0;
  let totalEmissions = 0;
  const yearly: ComparisonYearPoint[] = [];
  const transitionsByYear: Record<number, number> = {};

  for (let year = START_YEAR; year <= END_YEAR; year++) {
    let annualOpex = 0;
    let annualEmissions = 0;
    let annualCapex = 0;
    let transitionedCount = 0;

    for (const vehicle of vehicles) {
      const plan = resolveVehiclePlan(scenario, vehicle, presets);
      const effective = effectivePresetForYear(scenario, vehicle, presets, year);
      annualOpex += annualEnergyCost(vehicle, effective);
      annualEmissions += annualEmissionsTonnes(vehicle, effective);
      if (plan.transitionYear === year) {
        const current = presetById(presets, vehicle.currentPreset);
        const target = presetById(presets, plan.targetPresetId);
        if (target && target.id !== current?.id) {
          annualCapex += target.purchaseCost;
          transitionedCount++;
        }
      }
    }

    transitionsByYear[year] = transitionedCount;
    cumulativeCost += annualOpex + annualCapex;
    totalCapex += annualCapex;
    totalEmissions += annualEmissions;
    yearly.push({ year, cumulativeCost, annualOpex, annualEmissionsTonnes: annualEmissions, transitionedCount });
  }

  let electricCount = 0;
  let combustionCount = 0;
  let hybridCount = 0;
  let chargerCount = 0;
  let peakDemandKw = 0;
  let selectedYearOpex = 0;
  let selectedYearEmissions = 0;

  for (const vehicle of vehicles) {
    const effective = effectivePresetForYear(scenario, vehicle, presets, selectedYear);
    if (!effective) continue;
    selectedYearOpex += annualEnergyCost(vehicle, effective);
    selectedYearEmissions += annualEmissionsTonnes(vehicle, effective);
    if (effective.propulsion === "electric") electricCount++;
    else if (effective.propulsion === "hybrid") hybridCount++;
    else combustionCount++;
    if (effective.chargingPowerKW > 0) {
      chargerCount++;
      peakDemandKw += effective.chargingPowerKW;
    }
  }

  const warnings: string[] = [];
  if (peakDemandKw > comparisonPreviewAssumptions.siteLimitKw) {
    warnings.push(`Preview charging demand exceeds the ${comparisonPreviewAssumptions.siteLimitKw} kW site limit by ${Math.round(peakDemandKw - comparisonPreviewAssumptions.siteLimitKw)} kW.`);
  } else {
    warnings.push(`Preview charging demand is within the ${comparisonPreviewAssumptions.siteLimitKw} kW site limit.`);
  }
  if (!vehicles.length) warnings.push("No fleet vehicles are available to compare.");

  return {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    selectedYear,
    electricCount,
    combustionCount,
    hybridCount,
    chargerCount,
    peakDemandKw,
    siteLimitKw: comparisonPreviewAssumptions.siteLimitKw,
    capex: totalCapex,
    tco: cumulativeCost,
    annualOpex: selectedYearOpex,
    emissionsTonnes: totalEmissions,
    selectedYearEmissionsTonnes: selectedYearEmissions,
    warnings,
    yearly,
    transitionsByYear,
  };
}
