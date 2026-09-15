/**
 * Serializable vehicle preset data.
 *
 * This module is the extractable domain core: it must not import React, Three.js,
 * Zustand, or the object catalog. Callers that know the catalog pass its keys to
 * `normalizePreset` instead, so a preset never depends on rendering.
 */

export type Propulsion = "diesel" | "petrol" | "electric" | "hybrid";

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
};

export const propulsions = ["diesel", "petrol", "electric", "hybrid"] as const;

/** Numeric fields share one validation rule: finite and nonnegative. */
export const presetNumericFields = ["litresPer100Km", "kWhPer100Km", "batteryCapacityKWh", "chargingPowerKW", "purchaseCost"] as const;
export type PresetNumericField = (typeof presetNumericFields)[number];

export const maxNameLength = 100;

// Ids may later key a record, so refuse names that would reach Object.prototype.
const reservedIds = new Set(["__proto__", "constructor", "prototype"]);

const isText = (value: unknown, max = maxNameLength): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max;

const isAmount = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;

export const copyPreset = (preset: VehiclePreset): VehiclePreset => ({ ...preset });

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

  return {
    id: draft.id,
    name: draft.name.trim(),
    category: draft.category.trim(),
    propulsion: draft.propulsion as Propulsion,
    modelId: draft.modelId,
    ...amounts,
  };
}
