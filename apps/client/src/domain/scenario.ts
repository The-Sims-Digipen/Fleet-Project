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

/** Keeps only entries that are shaped like a plan, dropping anything unusable. */
function normalizePlans(value: unknown): Record<string, ScenarioVehiclePlan> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  const plans: Record<string, ScenarioVehiclePlan> = {};
  for (const [vehicleId, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) continue;
    const draft = entry as Record<string, unknown>;
    const plan: ScenarioVehiclePlan = {};
    if (typeof draft.transitionYear === "number" && Number.isInteger(draft.transitionYear)) plan.transitionYear = draft.transitionYear;
    else if (draft.transitionYear === null) plan.transitionYear = null;
    if (typeof draft.targetPresetId === "string" && draft.targetPresetId) plan.targetPresetId = draft.targetPresetId;
    plans[vehicleId] = plan;
  }
  return plans;
}

/**
 * Reads any supported scenario document as the authoritative M1 shape.
 *
 * Legacy version 1 documents carry vehicle plans but no assumptions, so they
 * gain the project's defaults. This runs at the persistence boundary only;
 * feature components always receive a version 2 document.
 */
export function toM1ScenarioDocument(document: unknown): M1ScenarioDocument {
  if (typeof document !== "object" || document === null || Array.isArray(document)) return createScenarioDocument();
  const record = document as Record<string, unknown>;
  return {
    version: M1_SCENARIO_DOCUMENT_VERSION,
    vehiclePlans: normalizePlans(record.vehiclePlans),
    assumptions: normalizeScenarioAssumptions(record.assumptions) ?? { ...defaultScenarioAssumptions },
  };
}

export const cloneScenarioDocument = (document: M1ScenarioDocument): M1ScenarioDocument => ({
  version: document.version,
  vehiclePlans: clonePlans(document.vehiclePlans),
  assumptions: { ...document.assumptions },
});
