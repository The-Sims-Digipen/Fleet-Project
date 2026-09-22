import { analysisEndYear, type AnalysisSettings, type CurrentVehicleHolding, type FleetVehicle } from "./contracts";
import { maxNameLength } from "../vehicles/types";

/**
 * Validation and construction for canonical fleet vehicles (T03).
 *
 * Framework-independent by contract: no React, Zustand, storage or rendering.
 * Every rule here comes from docs/tech/m1-integration-contract.md, so a record
 * that survives `normalizeFleetVehicle` is safe for T05 to calculate with.
 */

const routePatterns = ["predictable", "variable"] as const;
const hoursPerDay = 24;
const maxOperatingDays = 366;

// Ids key `vehiclePlans` records, so refuse names that would reach Object.prototype.
const reservedIds = new Set(["__proto__", "constructor", "prototype"]);

const isText = (value: unknown, max = maxNameLength): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max;

const isAmount = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
const isShare = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
const isYear = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value);
const isCount = (value: unknown, max: number): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= max;

/** Holding terms differ per kind, so each branch is validated on its own fields. */
function normalizeHolding(value: unknown): CurrentVehicleHolding | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return;
  const draft = value as Record<string, unknown>;
  if (draft.kind === "owned") {
    return isAmount(draft.currentValue) && isAmount(draft.endResidualValue)
      ? { kind: "owned", currentValue: draft.currentValue, endResidualValue: draft.endResidualValue }
      : undefined;
  }
  if (draft.kind === "leased") {
    return isAmount(draft.annualPayment) && isAmount(draft.exitFee)
      ? { kind: "leased", annualPayment: draft.annualPayment, exitFee: draft.exitFee }
      : undefined;
  }
  return undefined;
}

export const copyFleetVehicle = (vehicle: FleetVehicle): FleetVehicle => ({ ...vehicle, currentHolding: { ...vehicle.currentHolding } });

/**
 * Validates an untrusted record, returning a fresh vehicle or `undefined`.
 * Supply `knownPresetIds` to also reject a vehicle whose current preset is
 * missing from the same project.
 */
export function normalizeFleetVehicle(value: unknown, knownPresetIds?: ReadonlySet<string>): FleetVehicle | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return;
  const draft = value as Record<string, unknown>;
  if (!isText(draft.id) || reservedIds.has(draft.id)) return;
  if (!isText(draft.name)) return;
  if (!isText(draft.currentPresetId) || (knownPresetIds && !knownPresetIds.has(draft.currentPresetId))) return;
  if (!isAmount(draft.annualKm) || !isAmount(draft.typicalDailyKm)) return;
  if (!isCount(draft.operatingDays, maxOperatingDays)) return;
  if (!isShare(draft.utilisation)) return;
  if (!routePatterns.includes(draft.routePattern as (typeof routePatterns)[number])) return;
  if (typeof draft.returnsToDepot !== "boolean" || typeof draft.externalChargingAccess !== "boolean") return;
  if (!isAmount(draft.depotDwellHours) || draft.depotDwellHours > hoursPerDay) return;
  if (draft.replacementYear !== null && !isYear(draft.replacementYear)) return;

  const currentHolding = normalizeHolding(draft.currentHolding);
  if (!currentHolding) return;

  return {
    id: draft.id,
    name: draft.name.trim(),
    currentPresetId: draft.currentPresetId,
    annualKm: draft.annualKm,
    typicalDailyKm: draft.typicalDailyKm,
    operatingDays: draft.operatingDays,
    utilisation: draft.utilisation,
    routePattern: draft.routePattern as FleetVehicle["routePattern"],
    returnsToDepot: draft.returnsToDepot,
    externalChargingAccess: draft.externalChargingAccess,
    depotDwellHours: draft.depotDwellHours,
    replacementYear: draft.replacementYear as number | null,
    currentHolding,
  };
}

const analysisAmounts = ["fuelPricePerLitre", "fuelEmissionsKgCo2ePerLitre", "electricityEmissionsKgCo2ePerKWh"] as const;

export function normalizeAnalysisSettings(value: unknown): AnalysisSettings | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return;
  const draft = value as Record<string, unknown>;
  if (!isYear(draft.startYear)) return;
  if (typeof draft.yearCount !== "number" || !Number.isInteger(draft.yearCount) || draft.yearCount < 1) return;
  if (!isText(draft.currency, 8)) return;
  const amounts = {} as Record<(typeof analysisAmounts)[number], number>;
  for (const field of analysisAmounts) {
    const amount = draft[field];
    if (!isAmount(amount)) return;
    amounts[field] = amount;
  }
  return { startYear: draft.startYear, yearCount: draft.yearCount, currency: draft.currency.trim(), ...amounts };
}

/** A transition or replacement year is unset, or inside the inclusive period. */
export function isYearInPeriod(settings: AnalysisSettings, year: number | null | undefined): boolean {
  if (year === null || year === undefined) return true;
  return Number.isInteger(year) && year >= settings.startYear && year <= analysisEndYear(settings);
}

/** Produces a name no existing vehicle uses, so a new row is identifiable at a glance. */
export function uniqueVehicleName(base: string, vehicles: readonly FleetVehicle[]): string {
  const taken = new Set(vehicles.map((vehicle) => vehicle.name));
  if (!taken.has(base)) return base;
  for (let index = 2; ; index += 1) {
    const candidate = `${base} ${index}`.slice(0, maxNameLength);
    if (!taken.has(candidate)) return candidate;
  }
}

/**
 * A new vehicle with neutral planning values. The caller supplies the id so
 * tests stay deterministic and the store keeps sole ownership of id minting.
 */
export function createFleetVehicle(id: string, name: string, currentPresetId: string): FleetVehicle {
  return {
    id,
    name,
    currentPresetId,
    annualKm: 0,
    typicalDailyKm: 0,
    operatingDays: 250,
    utilisation: 1,
    routePattern: "predictable",
    returnsToDepot: true,
    externalChargingAccess: false,
    depotDwellHours: 8,
    replacementYear: null,
    currentHolding: { kind: "owned", currentValue: 0, endResidualValue: 0 },
  };
}
