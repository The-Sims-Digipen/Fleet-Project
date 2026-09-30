import { describe, expect, it } from "vitest";

import { projectDocumentSchema, type ProjectDocument } from "./schemas.js";

const transform = { position: [0, 0, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [1, 1, 1] as [number, number, number] };

function projectDocument(): ProjectDocument {
  return {
    version: 1,
    id: "project-fixture",
    name: "Delivery fleet",
    activeScenarioId: "scenario-a",
    environment: {
      depot: { id: "default-project-depot", name: "Depot", transform },
      vehicles: [{
        id: "vehicle-a",
        name: "Vehicle A",
        baselinePresetId: "diesel-van",
        transform,
        annualKm: 28_000,
        typicalDailyKm: 112,
        operatingDays: 250,
        utilisation: 0.85,
        routePattern: "predictable" as const,
        returnsToDepot: true,
        depotDwellHours: 12,
        externalChargingAccess: true,
        replacementYear: null,
        currentHolding: { kind: "owned" as const, currentValue: 18_000, endResidualValue: 4_000 },
      }],
    },
    vehiclePresets: [
      {
        id: "diesel-van", name: "Diesel Van", category: "Van", propulsion: "diesel" as const, modelId: "van",
        litresPer100Km: 8, kWhPer100Km: 0, batteryCapacityKWh: 0, chargingPowerKW: 0,
        purchaseCost: 30_000, maintenanceCostPerYear: 500, rangeKm: null, chargingEfficiency: 1,
        acquisition: { kind: "owned" as const, endResidualValue: 1_000 },
      },
      {
        id: "electric-van", name: "Electric Van", category: "Van", propulsion: "electric" as const, modelId: "van",
        litresPer100Km: 0, kWhPer100Km: 20, batteryCapacityKWh: 75, chargingPowerKW: 11,
        purchaseCost: 55_000, maintenanceCostPerYear: 300, rangeKm: 350, chargingEfficiency: 0.9,
        acquisition: { kind: "leased" as const, annualPayment: 10_000, exitFee: 1_000 },
      },
    ],
    scenarios: [{
      id: "scenario-a",
      name: "Plan A",
      vehiclePlans: { "vehicle-a": { transitions: [
        { year: 2030, targetPresetId: "diesel-van" },
        { year: 2033, targetPresetId: "electric-van" },
      ] } },
    }],
    analysis: {
      startYear: 2026,
      yearCount: 10,
      currency: "SGD",
      fuelPricePerLitre: 2.15,
      electricityPricePerKWh: 0.3,
      fuelEmissionsKgCo2ePerLitre: 2.7,
      electricityEmissionsKgCo2ePerKWh: 0.4,
      discountRate: 0.05,
    },
  };
}

describe("version 1 aggregate Project contract", () => {
  it("accepts the complete Project shape with embedded ordered Scenario transitions", () => {
    const input = projectDocument();

    expect(projectDocumentSchema.parse(input)).toEqual(input);
  });

  it("preserves valid string identities exactly as authored by the Project domain", () => {
    const input = projectDocument();
    input.id = " project-fixture ";
    input.activeScenarioId = " scenario-a ";
    input.scenarios[0].id = " scenario-a ";

    expect(projectDocumentSchema.parse(input)).toEqual(input);
  });

  it("rejects Vehicle Preset text beyond the client domain's raw string limit", () => {
    const input = projectDocument();
    input.vehiclePresets[0].name = `${" ".repeat(100)}Diesel`;
    input.vehiclePresets[0].category = `${" ".repeat(100)}Van`;

    expect(projectDocumentSchema.safeParse(input).success).toBe(false);
  });

  it.each([
    ["active Scenario identity", (document: ProjectDocument) => { document.activeScenarioId = "missing-scenario"; }],
    ["baseline Preset references", (document: ProjectDocument) => { document.environment.vehicles[0].baselinePresetId = "missing-preset"; }],
    ["Vehicle references", (document: ProjectDocument) => { document.scenarios[0].vehiclePlans["missing-vehicle"] = { transitions: [] }; }],
    ["Preset references", (document: ProjectDocument) => { document.scenarios[0].vehiclePlans["vehicle-a"].transitions[0].targetPresetId = "missing-preset"; }],
    ["duplicate Scenario ids", (document: ProjectDocument) => { document.scenarios[0].id = "scenario-duplicate"; document.scenarios.push({ id: "scenario-duplicate", name: "Plan B", vehiclePlans: {} }); }],
    ["duplicate transition years", (document: ProjectDocument) => { document.scenarios[0].vehiclePlans["vehicle-a"].transitions[1].year = 2030; }],
    ["unordered transitions", (document: ProjectDocument) => { document.scenarios[0].vehiclePlans["vehicle-a"].transitions.reverse(); }],
  ])("rejects invalid %s", (_label, mutate) => {
    const input = projectDocument();
    mutate(input);

    expect(projectDocumentSchema.safeParse(input).success).toBe(false);
  });

  it("rejects unsupported Project document versions", () => {
    expect(projectDocumentSchema.safeParse({ ...projectDocument(), version: 2 }).success).toBe(false);
  });
});
