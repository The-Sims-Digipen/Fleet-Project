import { DEFAULT_VEHICLE_SPAWN_TRANSFORMS } from "./depotLayout";
import { createMockPresets } from "./mockProject";
import { createProjectV5, type ProjectDocumentV5, type ProjectVehicle } from "./projectV5";

export function createProjectV5Fixture(id = "project-v5-fixture"): ProjectDocumentV5 {
  const vehiclePresets = createMockPresets();
  const vehicles: ProjectVehicle[] = [
    {
      id: "UNIT-01",
      name: "City Delivery Van",
      baselinePresetId: vehiclePresets[0]?.id ?? null,
      transform: structuredClone(DEFAULT_VEHICLE_SPAWN_TRANSFORMS[0]),
      annualKm: 28_000,
      typicalDailyKm: 112,
      operatingDays: 250,
      utilisation: 0.85,
      routePattern: "predictable",
      returnsToDepot: true,
      depotDwellHours: 12,
      externalChargingAccess: true,
      replacementYear: null,
      currentHolding: { kind: "owned", currentValue: 18_000, endResidualValue: 4_000 },
    },
  ];
  return createProjectV5({
    id,
    name: "Version 5 fixture",
    vehiclePresets,
    vehicles,
    scenarios: [
      { id: "plan-a", name: "Plan A", vehiclePlans: {} },
      { id: "plan-b", name: "Plan B", vehiclePlans: {} },
    ],
    activeScenarioId: "plan-a",
  });
}
