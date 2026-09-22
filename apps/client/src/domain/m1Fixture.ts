import { M1_PROJECT_DOCUMENT_VERSION, type FleetVehicle, type M1ProjectDocument, type M1ScenarioDocument } from "./contracts";
import { SCENE_DOCUMENT_VERSION, type SceneDocument } from "../scene/types";
import { placeMigratedFleet } from "./worldFleet";

/**
 * Shared SIM01 handoff fixture. T01, T03, T04, T05 and T07 tests should reuse
 * this data instead of inventing subtly different sample assumptions.
 */
export const sim01Project: M1ProjectDocument = {
  version: M1_PROJECT_DOCUMENT_VERSION,
  vehiclePresets: [
    {
      id: "sim01-diesel",
      name: "SIM01 diesel vehicle",
      category: "Van",
      propulsion: "diesel",
      modelId: "van",
      litresPer100Km: 10,
      kWhPer100Km: 0,
      batteryCapacityKWh: 0,
      chargingPowerKW: 0,
      purchaseCost: 0,
      maintenanceCostPerYear: 500,
      rangeKm: null,
      chargingEfficiency: 1,
      acquisition: { kind: "owned", endResidualValue: 0 },
    },
    {
      id: "sim01-electric",
      name: "SIM01 electric vehicle",
      category: "Van",
      propulsion: "electric",
      modelId: "van",
      litresPer100Km: 0,
      kWhPer100Km: 20,
      batteryCapacityKWh: 60,
      chargingPowerKW: 11,
      purchaseCost: 12_000,
      maintenanceCostPerYear: 200,
      rangeKm: 300,
      chargingEfficiency: 1,
      acquisition: { kind: "owned", endResidualValue: 2_000 },
    },
  ],
  analysis: {
    startYear: 2026,
    yearCount: 4,
    currency: "SGD",
    fuelPricePerLitre: 2,
    fuelEmissionsKgCo2ePerLitre: 2,
    electricityEmissionsKgCo2ePerKWh: 0.5,
  },
};

/** SIM01's depot fleet. Vehicles belong to the world they stand in, not the project. */
export const sim01Fleet: FleetVehicle[] = [
  {
    id: "SIM01-VEHICLE",
    name: "SIM01 vehicle",
    currentPresetId: "sim01-diesel",
    annualKm: 10_000,
    typicalDailyKm: 100,
    operatingDays: 100,
    utilisation: 1,
    routePattern: "predictable",
    returnsToDepot: true,
    depotDwellHours: 8,
    externalChargingAccess: true,
    replacementYear: null,
    currentHolding: { kind: "owned", currentValue: 0, endResidualValue: 0 },
  },
];

export const sim01Scenario: M1ScenarioDocument = {
  version: 2,
  vehiclePlans: {
    "SIM01-VEHICLE": { transitionYear: 2026, targetPresetId: "sim01-electric" },
  },
  assumptions: {
    chargingStrategy: "external",
    depotChargingShare: 0,
    depotElectricityPricePerKWh: 0.25,
    externalElectricityPricePerKWh: 0.25,
  },
};

export const sim01Expected = {
  baselineTco: 10_000,
  scenarioTco: 12_800,
  savings: -2_800,
  paybackYear: null,
  fuelDisplacedLitres: 4_000,
  electricityKWh: 8_000,
  emissionsReductionKgCo2e: 4_000,
} as const;

/** SIM01's depot: the world its vehicles stand in, matching `sim01Fleet`. */
export function sim01World(): SceneDocument {
  return { version: SCENE_DOCUMENT_VERSION, light: 65, objects: placeMigratedFleet(sim01Fleet, sim01Project.vehiclePresets, []) };
}
