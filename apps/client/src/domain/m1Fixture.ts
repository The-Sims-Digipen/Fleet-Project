import type { M1ProjectDocument, M1ScenarioDocument } from "./contracts";

/**
 * Shared SIM01 handoff fixture. T01, T03, T04, T05 and T07 tests should reuse
 * this data instead of inventing subtly different sample assumptions.
 */
export const sim01Project: M1ProjectDocument = {
  version: 3,
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
  fleetVehicles: [
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
