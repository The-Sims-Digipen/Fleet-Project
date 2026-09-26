import { describe, expect, it } from "vitest";
import { createMockPresets } from "../domain/mockProject";
import { copyPreset, normalizePreset, presetNumericFields, type VehiclePreset } from "./types";

const valid = (): VehiclePreset => ({
  id: "test-van",
  name: "Test Van",
  category: "Van",
  propulsion: "electric",
  modelId: "van",
  litresPer100Km: 0,
  kWhPer100Km: 22,
  batteryCapacityKWh: 64,
  chargingPowerKW: 11,
  purchaseCost: 45000,
  maintenanceCostPerYear: 900,
  rangeKm: 280,
  chargingEfficiency: 0.9,
  acquisition: { kind: "owned", endResidualValue: 9000 },
});

describe("vehicle preset validation", () => {
  it("accepts a well-formed record, trims text and copies independently", () => {
    const normalized = normalizePreset({ ...valid(), name: "  Test Van  " }, new Set(["van"]))!;
    expect(normalized.name).toBe("Test Van");
    expect(normalized).not.toBe(valid());
    const copy = copyPreset(normalized);
    copy.purchaseCost = 1;
    copy.acquisition = { kind: "leased", annualPayment: 1, exitFee: 1 };
    expect(normalized.purchaseCost).toBe(45000);
    expect(normalized.acquisition).toEqual({ kind: "owned", endResidualValue: 9000 });
  });

  it("rejects malformed records, unknown enums and unknown models", () => {
    expect(normalizePreset(null)).toBeUndefined();
    expect(normalizePreset([valid()])).toBeUndefined();
    expect(normalizePreset("van")).toBeUndefined();
    expect(normalizePreset({ ...valid(), name: "   " })).toBeUndefined();
    expect(normalizePreset({ ...valid(), name: "x".repeat(101) })).toBeUndefined();
    expect(normalizePreset({ ...valid(), category: "" })).toBeUndefined();
    expect(normalizePreset({ ...valid(), propulsion: "nuclear" })).toBeUndefined();
    expect(normalizePreset({ ...valid(), modelId: "" })).toBeUndefined();
    // Unknown geometry is only rejected when the caller supplies the catalog keys.
    expect(normalizePreset({ ...valid(), modelId: "spaceship" })).toBeDefined();
    expect(normalizePreset({ ...valid(), modelId: "spaceship" }, new Set(["van"]))).toBeUndefined();
    for (const id of ["__proto__", "constructor", "prototype", ""]) {
      expect(normalizePreset({ ...valid(), id })).toBeUndefined();
    }
  });

  it("requires every numeric field to be finite and nonnegative", () => {
    for (const field of presetNumericFields) {
      for (const bad of [-1, Number.NaN, Number.POSITIVE_INFINITY, "12", null, undefined]) {
        expect(normalizePreset({ ...valid(), [field]: bad })).toBeUndefined();
      }
      expect(normalizePreset({ ...valid(), [field]: 0 })).toBeDefined();
    }
  });

  it("allows an absent range but rejects an unusable one", () => {
    expect(normalizePreset({ ...valid(), rangeKm: null })!.rangeKm).toBeNull();
    expect(normalizePreset({ ...valid(), rangeKm: 0 })!.rangeKm).toBe(0);
    for (const bad of [-1, Number.NaN, "280", undefined]) {
      expect(normalizePreset({ ...valid(), rangeKm: bad })).toBeUndefined();
    }
  });

  it("keeps charging efficiency a ratio greater than zero and at most one", () => {
    for (const good of [0.01, 0.9, 1]) expect(normalizePreset({ ...valid(), chargingEfficiency: good })).toBeDefined();
    for (const bad of [0, -0.5, 1.01, Number.NaN, Number.POSITIVE_INFINITY, "1", null, undefined]) {
      expect(normalizePreset({ ...valid(), chargingEfficiency: bad })).toBeUndefined();
    }
  });

  it("validates each acquisition kind on its own fields", () => {
    expect(normalizePreset({ ...valid(), acquisition: { kind: "leased", annualPayment: 7000, exitFee: 500 } })).toBeDefined();
    for (const bad of [
      undefined,
      null,
      { kind: "rented", annualPayment: 1, exitFee: 1 },
      { kind: "owned" },
      { kind: "owned", endResidualValue: -1 },
      // Lease fields are not interchangeable with the owned branch.
      { kind: "leased", endResidualValue: 100 },
      { kind: "leased", annualPayment: 7000 },
      { kind: "leased", annualPayment: Number.NaN, exitFee: 0 },
    ]) {
      expect(normalizePreset({ ...valid(), acquisition: bad })).toBeUndefined();
    }
  });

  it("seeds a valid library of independent presets", () => {
    const first = createMockPresets();
    const second = createMockPresets();
    expect(first.length).toBeGreaterThan(0);
    expect(new Set(first.map((preset) => preset.id)).size).toBe(first.length);
    for (const preset of first) expect(normalizePreset(preset, new Set(["van"]))).toBeDefined();
    first[0].name = "Mutated";
    expect(second[0].name).not.toBe("Mutated");
  });
});
