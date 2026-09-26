import type { AnalysisSettings, FleetVehicle } from "../domain/contracts";
import { analysisYears } from "../domain/contracts";
import { effectiveVehicleState, planChangesPreset, resolveVehiclePlan, type PlanRecord, type ResolvedVehiclePlan } from "../domain/effectiveState";
import type { VehiclePreset } from "../vehicles/types";

/**
 * Indicative scenario preview used by the Compare workspace.
 *
 * This is a presentation-level preview, not the M1 financial model: T05 owns
 * `SimulationInput -> SimulationResult`. It reads the authoritative fleet and
 * the shared transition rule from T03 so the preview and the real engine can
 * never disagree about which preset a vehicle is on in a given year.
 */

export const comparisonPreviewAssumptions = {
  electricityPricePerKwh: 0.3,
  siteLimitKw: 250,
} as const;

export type { ResolvedVehiclePlan };

export type ComparisonYearPoint = {
  year: number;
  cumulativeCost: number;
  annualCost: number;
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

export type ComparisonScenario = { id: string; name: string; vehiclePlans: PlanRecord };

const presetById = (presets: readonly VehiclePreset[], id: string) => presets.find((preset) => preset.id === id);
const presetIdsOf = (presets: readonly VehiclePreset[]) => new Set(presets.map((preset) => preset.id));

export function effectivePresetForYear(
  scenario: ComparisonScenario,
  vehicle: FleetVehicle,
  presets: readonly VehiclePreset[],
  year: number,
): VehiclePreset | undefined {
  const state = effectiveVehicleState(vehicle, scenario.vehiclePlans[vehicle.id], presetIdsOf(presets), year);
  return presetById(presets, state.presetId);
}

function annualEnergyCost(vehicle: FleetVehicle, preset: VehiclePreset | undefined, analysis: AnalysisSettings): number {
  if (!preset) return 0;
  const scale = vehicle.annualKm / 100;
  return scale * (preset.litresPer100Km * analysis.fuelPricePerLitre + preset.kWhPer100Km * comparisonPreviewAssumptions.electricityPricePerKwh)
    + preset.maintenanceCostPerYear;
}

function annualEmissionsTonnes(vehicle: FleetVehicle, preset: VehiclePreset | undefined, analysis: AnalysisSettings): number {
  if (!preset) return 0;
  const scale = vehicle.annualKm / 100;
  return scale * (
    preset.litresPer100Km * analysis.fuelEmissionsKgCo2ePerLitre
    + preset.kWhPer100Km * analysis.electricityEmissionsKgCo2ePerKWh
  ) / 1000;
}

export function calculateScenarioComparison(
  scenario: ComparisonScenario,
  vehicles: readonly FleetVehicle[],
  presets: readonly VehiclePreset[],
  analysis: AnalysisSettings,
  selectedYear: number,
): ScenarioComparisonResult {
  const presetIds = presetIdsOf(presets);
  let cumulativeCost = 0;
  let totalCapex = 0;
  let totalEmissions = 0;
  const yearly: ComparisonYearPoint[] = [];
  const transitionsByYear: Record<number, number> = {};

  for (const year of analysisYears(analysis)) {
    let annualOpex = 0;
    let annualEmissions = 0;
    let annualCapex = 0;
    let transitionedCount = 0;

    for (const vehicle of vehicles) {
      const plan = resolveVehiclePlan(scenario.vehiclePlans[vehicle.id], presetIds);
      const effective = effectivePresetForYear(scenario, vehicle, presets, year);
      annualOpex += annualEnergyCost(vehicle, effective, analysis);
      annualEmissions += annualEmissionsTonnes(vehicle, effective, analysis);
      if (plan.transitionYear === year && planChangesPreset(vehicle, plan)) {
        const target = presetById(presets, plan.targetPresetId as string);
        if (target) {
          annualCapex += target.purchaseCost;
          transitionedCount++;
        }
      }
    }

    transitionsByYear[year] = transitionedCount;
    cumulativeCost += annualOpex + annualCapex;
    totalCapex += annualCapex;
    totalEmissions += annualEmissions;
    yearly.push({ year, cumulativeCost, annualCost: annualOpex + annualCapex, annualOpex, annualEmissionsTonnes: annualEmissions, transitionedCount });
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
    selectedYearOpex += annualEnergyCost(vehicle, effective, analysis);
    selectedYearEmissions += annualEmissionsTonnes(vehicle, effective, analysis);
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
