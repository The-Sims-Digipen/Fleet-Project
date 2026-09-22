import {
  M1_SCENARIO_DOCUMENT_VERSION,
  type ChargingStrategy,
  type M1ScenarioDocument,
  type ScenarioAssumptions,
  type ScenarioVehiclePlan,
} from "./contracts";

/**
 * Scenario-owned planning data (T03).
 *
 * A scenario holds per-vehicle transition decisions plus the electricity and
 * charging assumptions that may differ between plans. Duplicating a scenario
 * deep-copies both, so editing one plan can never reach another.
 *
 * These are constructors for new and duplicated scenarios. Reading a stored
 * scenario document belongs to `project/serialization.ts`.
 */

export const defaultScenarioAssumptions: ScenarioAssumptions = {
  chargingStrategy: "depot",
  depotChargingShare: 1,
  depotElectricityPricePerKWh: 0.3,
  externalElectricityPricePerKWh: 0.45,
};

const chargingStrategies = ["depot", "external", "mixed"] as const;

const isAmount = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
const isShare = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;

export function createScenarioDocument(vehiclePlans: Record<string, ScenarioVehiclePlan> = {}): M1ScenarioDocument {
  return { version: M1_SCENARIO_DOCUMENT_VERSION, vehiclePlans: clonePlans(vehiclePlans), assumptions: { ...defaultScenarioAssumptions } };
}

export function clonePlans(plans: Readonly<Record<string, ScenarioVehiclePlan>>): Record<string, ScenarioVehiclePlan> {
  return Object.fromEntries(Object.entries(plans).map(([vehicleId, plan]) => [vehicleId, { ...plan }]));
}

export function normalizeScenarioAssumptions(value: unknown): ScenarioAssumptions | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return;
  const draft = value as Record<string, unknown>;
  if (!chargingStrategies.includes(draft.chargingStrategy as ChargingStrategy)) return;
  if (!isShare(draft.depotChargingShare)) return;
  if (!isAmount(draft.depotElectricityPricePerKWh) || !isAmount(draft.externalElectricityPricePerKWh)) return;
  return {
    chargingStrategy: draft.chargingStrategy as ChargingStrategy,
    depotChargingShare: draft.depotChargingShare,
    depotElectricityPricePerKWh: draft.depotElectricityPricePerKWh,
    externalElectricityPricePerKWh: draft.externalElectricityPricePerKWh,
  };
}

export const cloneScenarioDocument = (document: M1ScenarioDocument): M1ScenarioDocument => ({
  version: document.version,
  vehiclePlans: clonePlans(document.vehiclePlans),
  assumptions: { ...document.assumptions },
});
