import type { AnalysisSettings, FleetVehicle } from "./contracts";
import { normalizeFleetVehicle } from "./fleet";
import { normalizePreset, type VehiclePreset } from "../vehicles/types";

/**
 * Mock project inputs used to seed a project that has not been saved yet.
 *
 * These are indicative synthetic planning figures, not manufacturer
 * specifications. They are the starting point for a new project only: once a
 * project is saved, its presets, fleet and analysis settings travel inside the
 * project document and this module is no longer consulted.
 *
 * Every function returns freshly validated records, so two callers never share
 * mutable state and a malformed entry here fails the suite rather than the app.
 */

const presetSeed: VehiclePreset[] = [
  {
    id: "diesel-van", name: "Diesel Delivery Van", category: "Van", propulsion: "diesel", modelId: "van",
    litresPer100Km: 9.5, kWhPer100Km: 0, batteryCapacityKWh: 0, chargingPowerKW: 0,
    purchaseCost: 32_000, maintenanceCostPerYear: 1_800, rangeKm: null, chargingEfficiency: 1,
    acquisition: { kind: "owned", endResidualValue: 6_000 },
  },
  {
    id: "electric-van", name: "Electric Delivery Van", category: "Van", propulsion: "electric", modelId: "van",
    litresPer100Km: 0, kWhPer100Km: 22, batteryCapacityKWh: 64, chargingPowerKW: 11,
    purchaseCost: 45_000, maintenanceCostPerYear: 900, rangeKm: 280, chargingEfficiency: 0.9,
    acquisition: { kind: "owned", endResidualValue: 9_000 },
  },
  {
    id: "hybrid-van", name: "Hybrid Delivery Van", category: "Van", propulsion: "hybrid", modelId: "van",
    litresPer100Km: 5.4, kWhPer100Km: 12, batteryCapacityKWh: 14, chargingPowerKW: 7.4,
    purchaseCost: 38_500, maintenanceCostPerYear: 1_500, rangeKm: 60, chargingEfficiency: 0.9,
    acquisition: { kind: "owned", endResidualValue: 7_500 },
  },
  {
    id: "diesel-box-truck", name: "Diesel Box Truck", category: "Box truck", propulsion: "diesel", modelId: "van",
    litresPer100Km: 14.2, kWhPer100Km: 0, batteryCapacityKWh: 0, chargingPowerKW: 0,
    purchaseCost: 58_000, maintenanceCostPerYear: 3_200, rangeKm: null, chargingEfficiency: 1,
    acquisition: { kind: "owned", endResidualValue: 11_000 },
  },
  {
    id: "electric-box-truck", name: "Electric Box Truck", category: "Box truck", propulsion: "electric", modelId: "van",
    litresPer100Km: 0, kWhPer100Km: 38, batteryCapacityKWh: 120, chargingPowerKW: 22,
    purchaseCost: 79_000, maintenanceCostPerYear: 1_600, rangeKm: 220, chargingEfficiency: 0.88,
    acquisition: { kind: "owned", endResidualValue: 15_000 },
  },
];

// Daily distance times operating days reproduces annual distance exactly, so the
// seed cannot be read as two disagreeing statements about the same vehicle.
const fleetSeed: FleetVehicle[] = [
  {
    id: "UNIT-01", name: "City Delivery Van", currentPresetId: "diesel-van",
    annualKm: 28_000, typicalDailyKm: 112, operatingDays: 250, utilisation: 0.85,
    routePattern: "predictable", returnsToDepot: true, depotDwellHours: 12, externalChargingAccess: true,
    replacementYear: null, currentHolding: { kind: "owned", currentValue: 18_000, endResidualValue: 4_000 },
  },
  {
    id: "UNIT-02", name: "Regional Hauler", currentPresetId: "diesel-box-truck",
    annualKm: 54_000, typicalDailyKm: 216, operatingDays: 250, utilisation: 0.95,
    routePattern: "variable", returnsToDepot: true, depotDwellHours: 8, externalChargingAccess: false,
    replacementYear: null, currentHolding: { kind: "owned", currentValue: 34_000, endResidualValue: 7_000 },
  },
  {
    id: "UNIT-03", name: "Urban Courier", currentPresetId: "electric-van",
    annualKm: 19_000, typicalDailyKm: 76, operatingDays: 250, utilisation: 0.6,
    routePattern: "predictable", returnsToDepot: true, depotDwellHours: 14, externalChargingAccess: true,
    replacementYear: null, currentHolding: { kind: "owned", currentValue: 27_000, endResidualValue: 8_000 },
  },
  {
    id: "UNIT-04", name: "Service Support", currentPresetId: "hybrid-van",
    annualKm: 32_000, typicalDailyKm: 128, operatingDays: 250, utilisation: 0.8,
    routePattern: "variable", returnsToDepot: true, depotDwellHours: 10, externalChargingAccess: true,
    replacementYear: null, currentHolding: { kind: "leased", annualPayment: 7_200, exitFee: 1_500 },
  },
  {
    id: "UNIT-05", name: "Depot Shuttle", currentPresetId: "diesel-van",
    annualKm: 24_000, typicalDailyKm: 96, operatingDays: 250, utilisation: 0.7,
    routePattern: "predictable", returnsToDepot: true, depotDwellHours: 13, externalChargingAccess: false,
    replacementYear: null, currentHolding: { kind: "owned", currentValue: 15_000, endResidualValue: 3_500 },
  },
  {
    id: "UNIT-06", name: "Long-haul Supply", currentPresetId: "diesel-box-truck",
    annualKm: 61_000, typicalDailyKm: 244, operatingDays: 250, utilisation: 1,
    routePattern: "variable", returnsToDepot: false, depotDwellHours: 4, externalChargingAccess: false,
    replacementYear: null, currentHolding: { kind: "owned", currentValue: 41_000, endResidualValue: 9_000 },
  },
];

/** Common assumptions a new project starts from. The period is inclusive: 2026-2035. */
export const defaultAnalysisSettings: AnalysisSettings = {
  startYear: 2026,
  yearCount: 10,
  currency: "SGD",
  fuelPricePerLitre: 2.15,
  fuelEmissionsKgCo2ePerLitre: 2.7,
  electricityEmissionsKgCo2ePerKWh: 0.4,
};

function seeded<T>(records: unknown[], normalize: (record: unknown) => T | undefined, label: string): T[] {
  const accepted: T[] = [];
  for (const [index, record] of records.entries()) {
    const normalized = normalize(record);
    // A hand-edited seed should not white-screen the app; skip and report.
    if (normalized) accepted.push(normalized);
    else console.error(`Mock ${label} ${index + 1} is invalid and was skipped.`);
  }
  return accepted;
}

export function createMockPresets(): VehiclePreset[] {
  return seeded(presetSeed, (record) => normalizePreset(record), "preset");
}

export function createMockFleet(): FleetVehicle[] {
  const presetIds = new Set(presetSeed.map((preset) => preset.id));
  return seeded(fleetSeed, (record) => normalizeFleetVehicle(record, presetIds), "fleet vehicle");
}

export function createMockAnalysis(): AnalysisSettings {
  return { ...defaultAnalysisSettings };
}
