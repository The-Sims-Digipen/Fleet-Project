import type { OwnershipTerms, VehiclePreset } from "../vehicles/types";

/**
 * Canonical, serializable M1 domain contracts.
 *
 * This module must stay independent of React, Zustand, Three.js, IndexedDB and
 * charting. T01-T07 may all import these types without taking a UI or storage
 * dependency.
 */

export const ANNUAL_MODEL_VERSION = "annual-v1" as const;
export const M1_PROJECT_DOCUMENT_VERSION = 4 as const;
export const M1_SCENARIO_DOCUMENT_VERSION = 2 as const;

export type { OwnershipTerms };

/**
 * The M1 calculation contract's preset. `VehiclePreset` in `vehicles/types.ts`
 * carries these fields directly, so there is one preset shape and one validator
 * rather than a base record plus an M1 extension that could drift from it.
 */
export type M1VehiclePreset = VehiclePreset;

export type CurrentVehicleHolding =
  | { kind: "owned"; currentValue: number; endResidualValue: number }
  | { kind: "leased"; annualPayment: number; exitFee: number };

/**
 * Planning data carried by a vehicle placed in a depot.
 *
 * This is the half of a fleet vehicle that is not already on its scene object:
 * identity, display name and current preset come from the object itself. It is
 * stored on the object, so a depot's vehicles are exactly what stands in it.
 */
export type VehicleData = {
  annualKm: number;
  typicalDailyKm: number;
  operatingDays: number;
  utilisation: number;
  routePattern: "predictable" | "variable";
  returnsToDepot: boolean;
  depotDwellHours: number;
  externalChargingAccess: boolean;
  replacementYear: number | null;
  currentHolding: CurrentVehicleHolding;
};

/**
 * One vehicle in a depot, assembled from its placed object. Transition
 * decisions are scenario-owned and do not belong here.
 */
export type FleetVehicle = VehicleData & {
  id: string;
  name: string;
  currentPresetId: string;
};

/** Common assumptions shared by every scenario in a project. */
export type AnalysisSettings = {
  startYear: number;
  yearCount: number;
  /** ISO 4217 code used for display; M1 defaults to SGD. */
  currency: string;
  fuelPricePerLitre: number;
  fuelEmissionsKgCo2ePerLitre: number;
  electricityEmissionsKgCo2ePerKWh: number;
};

export type ChargingStrategy = "depot" | "external" | "mixed";

/** Assumptions that may differ between two scenarios in the same project. */
export type ScenarioAssumptions = {
  chargingStrategy: ChargingStrategy;
  /** 0 for external, 1 for depot, strictly between for mixed. */
  depotChargingShare: number;
  depotElectricityPricePerKWh: number;
  externalElectricityPricePerKWh: number;
};

export type ScenarioVehiclePlan = {
  transitionYear?: number | null;
  targetPresetId?: string;
};

/**
 * Project-owned inputs. Vehicle presets are shared by every depot in the
 * project; the vehicles themselves belong to the depot they stand in and travel
 * with its world document.
 */
export type M1ProjectDocument = {
  version: typeof M1_PROJECT_DOCUMENT_VERSION;
  vehiclePresets: M1VehiclePreset[];
  analysis: AnalysisSettings;
};

export type M1ScenarioDocument = {
  version: typeof M1_SCENARIO_DOCUMENT_VERSION;
  vehiclePlans: Record<string, ScenarioVehiclePlan>;
  assumptions: ScenarioAssumptions;
};

export type EffectiveVehicleState = {
  vehicleId: string;
  presetId: string;
  transitioned: boolean;
  transitionYear: number | null;
};

export type VehicleTransitionEvent = {
  kind: "vehicle-transition";
  year: number;
  vehicleId: string;
  fromPresetId: string;
  toPresetId: string;
};

export type AnnualPlanResult = {
  acquisitionCapex: number;
  operatingCost: number;
  disposalCredits: number;
  netCashCost: number;
  cumulativeCashCost: number;
  fuelLitres: number;
  electricityKWh: number;
  emissionsKgCo2e: number;
};

export type AnnualComparisonResult = {
  year: number;
  baseline: AnnualPlanResult;
  scenario: AnnualPlanResult;
  cumulativeCashSavings: number;
};

export type PlanTotals = {
  acquisitionCapex: number;
  operatingCost: number;
  disposalCredits: number;
  terminalCredits: number;
  tco: number;
  fuelLitres: number;
  electricityKWh: number;
  emissionsKgCo2e: number;
};

export type PaybackResult =
  | { status: "initial-parity" | "reached"; year: number }
  | { status: "not-reached"; year: null };

/** T05 output consumed by T07. Presentation code must not recalculate these values. */
export type SimulationResult = {
  modelVersion: typeof ANNUAL_MODEL_VERSION;
  annual: AnnualComparisonResult[];
  baseline: PlanTotals;
  scenario: PlanTotals;
  /** Baseline TCO minus scenario TCO; positive means the scenario costs less. */
  savings: number;
  /** Scenario TCO minus baseline TCO; kept separately to make direction explicit. */
  scenarioMinusBaseline: number;
  payback: PaybackResult;
};

export type SimulationInput = {
  project: M1ProjectDocument;
  /** The depot's vehicles, derived from the world the scenario is bound to. */
  fleetVehicles: FleetVehicle[];
  scenario: M1ScenarioDocument;
};

export function analysisEndYear(settings: AnalysisSettings): number {
  return settings.startYear + settings.yearCount - 1;
}

export function analysisYears(settings: AnalysisSettings): number[] {
  return Array.from({ length: settings.yearCount }, (_, index) => settings.startYear + index);
}

export function clampAnalysisYear(settings: AnalysisSettings, year: number): number {
  return Math.max(settings.startYear, Math.min(analysisEndYear(settings), Math.round(year)));
}
