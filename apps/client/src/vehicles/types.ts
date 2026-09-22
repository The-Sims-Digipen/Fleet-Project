/**
 * Serializable vehicle preset data.
 *
 * This module is the extractable domain core: it must not import React, Three.js,
 * Zustand, or the object catalog. Callers that know the catalog pass its keys to
 * `normalizePreset` instead, so a preset never depends on rendering.
 *
 * The shape here is the canonical M1 preset described in docs/tech/contracts.md:
 * identity, propulsion, efficiency, range, charging capability and economics.
 * `domain/contracts.ts` re-exports it as `M1VehiclePreset` for T05/T07.
 */

export type Propulsion = "diesel" | "petrol" | "electric" | "hybrid";

/** How a vehicle is held, which decides whether capex or a recurring payment applies. */
export type OwnershipTerms =
  | { kind: "owned"; endResidualValue: number }
  | { kind: "leased"; annualPayment: number; exitFee: number };

export type VehiclePreset = {
  id: string;
  name: string;
  category: string;
  propulsion: Propulsion;
  /** Object catalog definition id supplying this preset's geometry. */
  modelId: string;
  litresPer100Km: number;
  kWhPer100Km: number;
  batteryCapacityKWh: number;
  chargingPowerKW: number;
  purchaseCost: number;
  maintenanceCostPerYear: number;
  /** Null means range is not a meaningful constraint for this preset. */
  rangeKm: number | null;
  /** Supplied-energy multiplier denominator; valid values are > 0 and <= 1. */
  chargingEfficiency: number;
  /** Terms used when this preset is acquired during the analysis. */
  acquisition: OwnershipTerms;
};

export const propulsions = ["diesel", "petrol", "electric", "hybrid"] as const;
export const ownershipKinds = ["owned", "leased"] as const;

/** Numeric fields sharing one validation rule: finite and nonnegative. */
export const presetNumericFields = ["litresPer100Km", "kWhPer100Km", "batteryCapacityKWh", "chargingPowerKW", "purchaseCost", "maintenanceCostPerYear"] as const;
export type PresetNumericField = (typeof presetNumericFields)[number];

export const maxNameLength = 100;

// Ids may later key a record, so refuse names that would reach Object.prototype.
const reservedIds = new Set(["__proto__", "constructor", "prototype"]);

const isText = (value: unknown, max = maxNameLength): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max;

const isAmount = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;

/** Charging efficiency is a ratio of supplied to usable energy, so 0 is not meaningful. */
const isEfficiency = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0 && value <= 1;

export const copyPreset = (preset: VehiclePreset): VehiclePreset => ({ ...preset, acquisition: { ...preset.acquisition } });

/** Terms carry different fields per kind, so each branch is validated separately. */
function normalizeOwnership(value: unknown): OwnershipTerms | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return;
  const draft = value as Record<string, unknown>;
  if (draft.kind === "owned") return isAmount(draft.endResidualValue) ? { kind: "owned", endResidualValue: draft.endResidualValue } : undefined;
  if (draft.kind === "leased") return isAmount(draft.annualPayment) && isAmount(draft.exitFee) ? { kind: "leased", annualPayment: draft.annualPayment, exitFee: draft.exitFee } : undefined;
  return undefined;
}

/**
 * Validates an untrusted record, returning a fresh preset or `undefined`.
 * Supply `knownModelIds` to also reject presets referencing missing geometry.
 */
export function normalizePreset(value: unknown, knownModelIds?: ReadonlySet<string>): VehiclePreset | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return;
  const draft = value as Record<string, unknown>;
  if (!isText(draft.id) || reservedIds.has(draft.id)) return;
  if (!isText(draft.name) || !isText(draft.category)) return;
  if (!propulsions.includes(draft.propulsion as Propulsion)) return;
  if (!isText(draft.modelId) || (knownModelIds && !knownModelIds.has(draft.modelId))) return;

  const amounts = {} as Record<PresetNumericField, number>;
  for (const field of presetNumericFields) {
    const amount = draft[field];
    if (!isAmount(amount)) return;
    amounts[field] = amount;
  }

  if (draft.rangeKm !== null && !isAmount(draft.rangeKm)) return;
  if (!isEfficiency(draft.chargingEfficiency)) return;
  const acquisition = normalizeOwnership(draft.acquisition);
  if (!acquisition) return;

  return {
    id: draft.id,
    name: draft.name.trim(),
    category: draft.category.trim(),
    propulsion: draft.propulsion as Propulsion,
    modelId: draft.modelId,
    ...amounts,
    rangeKm: draft.rangeKm as number | null,
    chargingEfficiency: draft.chargingEfficiency,
    acquisition,
  };
}
