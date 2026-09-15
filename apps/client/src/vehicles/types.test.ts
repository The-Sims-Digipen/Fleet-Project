import { describe, expect, it } from "vitest";
import seedFile from "./defaults.json";
import { loadDefaultPresets } from "./defaults";
import { copyPreset, normalizePreset, presetFileVersion, presetNumericFields, type VehiclePreset } from "./types";

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
});

describe("vehicle preset validation", () => {
  it("accepts a well-formed record, trims text and copies independently", () => {
    const normalized = normalizePreset({ ...valid(), name: "  Test Van  " }, new Set(["van"]))!;
    expect(normalized.name).toBe("Test Van");
    expect(normalized).not.toBe(valid());
    const copy = copyPreset(normalized);
    copy.purchaseCost = 1;
    expect(normalized.purchaseCost).toBe(45000);
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

  it("seeds a valid library of independent presets", () => {
    const first = loadDefaultPresets();
    const second = loadDefaultPresets();
    expect(first.length).toBeGreaterThan(0);
    expect(new Set(first.map((preset) => preset.id)).size).toBe(first.length);
    for (const preset of first) expect(normalizePreset(preset, new Set(["van"]))).toBeDefined();
    first[0].name = "Mutated";
    expect(second[0].name).not.toBe("Mutated");
  });

  // defaults.json is data rather than type-checked code, and loadDefaultPresets
  // skips bad records rather than crashing — so the suite, not tsc, is what
  // catches a broken seed file. Comparing against the raw file means a single
  // invalid record fails here instead of silently shrinking the library.
  it("loads every record in defaults.json, so a broken seed cannot pass silently", () => {
    expect(seedFile.version).toBe(presetFileVersion);
    expect(loadDefaultPresets()).toHaveLength(seedFile.presets.length);
    for (const record of seedFile.presets) expect(normalizePreset(record, new Set(["van"]))).toBeDefined();
  });
});
