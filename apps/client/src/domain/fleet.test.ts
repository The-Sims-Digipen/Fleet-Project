import { describe, expect, it } from "vitest";
import { analysisEndYear, type FleetVehicle } from "./contracts";
import { copyFleetVehicle, createFleetVehicle, isYearInPeriod, normalizeAnalysisSettings, normalizeFleetVehicle, uniqueVehicleName } from "./fleet";
import { createMockAnalysis, createMockFleet, createMockPresets } from "./mockProject";

const valid = (): FleetVehicle => ({
  id: "UNIT-99",
  name: "Test Vehicle",
  currentPresetId: "diesel-van",
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
});

const presetIds = new Set(["diesel-van", "electric-van"]);

describe("fleet vehicle validation", () => {
  it("accepts a well-formed record, trims the name and copies independently", () => {
    const normalized = normalizeFleetVehicle({ ...valid(), name: "  Test Vehicle  " }, presetIds)!;
    expect(normalized.name).toBe("Test Vehicle");
    const copy = copyFleetVehicle(normalized);
    copy.currentHolding = { kind: "leased", annualPayment: 1, exitFee: 1 };
    expect(normalized.currentHolding).toEqual({ kind: "owned", currentValue: 18_000, endResidualValue: 4_000 });
  });

  it("requires the current preset to resolve inside the same project", () => {
    expect(normalizeFleetVehicle({ ...valid(), currentPresetId: "missing" }, presetIds)).toBeUndefined();
    // Without a catalogue of ids the reference cannot be checked, only its shape.
    expect(normalizeFleetVehicle({ ...valid(), currentPresetId: "missing" })).toBeDefined();
    expect(normalizeFleetVehicle({ ...valid(), currentPresetId: "" }, presetIds)).toBeUndefined();
  });

  it("rejects malformed records and ids that would reach Object.prototype", () => {
    expect(normalizeFleetVehicle(null)).toBeUndefined();
    expect(normalizeFleetVehicle([valid()])).toBeUndefined();
    expect(normalizeFleetVehicle({ ...valid(), name: "   " })).toBeUndefined();
    expect(normalizeFleetVehicle({ ...valid(), routePattern: "chaotic" })).toBeUndefined();
    expect(normalizeFleetVehicle({ ...valid(), returnsToDepot: "yes" })).toBeUndefined();
    for (const id of ["__proto__", "constructor", "prototype", ""]) {
      expect(normalizeFleetVehicle({ ...valid(), id })).toBeUndefined();
    }
  });

  it("keeps every numeric planning input inside its contract range", () => {
    for (const bad of [-1, Number.NaN, Number.POSITIVE_INFINITY, "100", null]) {
      expect(normalizeFleetVehicle({ ...valid(), annualKm: bad })).toBeUndefined();
      expect(normalizeFleetVehicle({ ...valid(), typicalDailyKm: bad })).toBeUndefined();
    }
    // Utilisation is a share, so it cannot leave 0-1.
    for (const good of [0, 0.5, 1]) expect(normalizeFleetVehicle({ ...valid(), utilisation: good })).toBeDefined();
    for (const bad of [-0.1, 1.1]) expect(normalizeFleetVehicle({ ...valid(), utilisation: bad })).toBeUndefined();
    // Operating days are whole days within a year, dwell hours within a day.
    for (const bad of [-1, 367, 12.5]) expect(normalizeFleetVehicle({ ...valid(), operatingDays: bad })).toBeUndefined();
    for (const bad of [-1, 25]) expect(normalizeFleetVehicle({ ...valid(), depotDwellHours: bad })).toBeUndefined();
    expect(normalizeFleetVehicle({ ...valid(), depotDwellHours: 24 })).toBeDefined();
  });

  it("allows an unset replacement year but not a fractional one", () => {
    expect(normalizeFleetVehicle({ ...valid(), replacementYear: null })!.replacementYear).toBeNull();
    expect(normalizeFleetVehicle({ ...valid(), replacementYear: 2030 })!.replacementYear).toBe(2030);
    for (const bad of [2030.5, "2030", undefined]) {
      expect(normalizeFleetVehicle({ ...valid(), replacementYear: bad })).toBeUndefined();
    }
  });

  it("validates each holding kind on its own fields", () => {
    expect(normalizeFleetVehicle({ ...valid(), currentHolding: { kind: "leased", annualPayment: 7_200, exitFee: 1_500 } })).toBeDefined();
    for (const bad of [
      undefined,
      { kind: "owned", currentValue: 1 },
      { kind: "owned", currentValue: -1, endResidualValue: 0 },
      { kind: "leased", currentValue: 1, endResidualValue: 1 },
      { kind: "financed", currentValue: 1, endResidualValue: 1 },
    ]) {
      expect(normalizeFleetVehicle({ ...valid(), currentHolding: bad })).toBeUndefined();
    }
  });
});

describe("analysis settings", () => {
  it("requires a whole, positive period and nonnegative factors", () => {
    const settings = createMockAnalysis();
    expect(normalizeAnalysisSettings(settings)).toEqual(settings);
    for (const bad of [0, -1, 2.5, "10"]) expect(normalizeAnalysisSettings({ ...settings, yearCount: bad })).toBeUndefined();
    expect(normalizeAnalysisSettings({ ...settings, startYear: 2026.5 })).toBeUndefined();
    expect(normalizeAnalysisSettings({ ...settings, currency: "" })).toBeUndefined();
    expect(normalizeAnalysisSettings({ ...settings, fuelPricePerLitre: -1 })).toBeUndefined();
    expect(normalizeAnalysisSettings({ ...settings, electricityEmissionsKgCo2ePerKWh: Number.NaN })).toBeUndefined();
  });

  it("treats the analysis period as inclusive of both ends", () => {
    const settings = createMockAnalysis();
    const end = analysisEndYear(settings);
    expect(isYearInPeriod(settings, settings.startYear)).toBe(true);
    expect(isYearInPeriod(settings, end)).toBe(true);
    expect(isYearInPeriod(settings, settings.startYear - 1)).toBe(false);
    expect(isYearInPeriod(settings, end + 1)).toBe(false);
    // An unset year is always acceptable: it plans nothing.
    expect(isYearInPeriod(settings, null)).toBe(true);
    expect(isYearInPeriod(settings, undefined)).toBe(true);
  });
});

describe("fleet construction", () => {
  it("seeds a valid fleet of independent vehicles that resolve to seeded presets", () => {
    const first = createMockFleet();
    const second = createMockFleet();
    const ids = new Set(createMockPresets().map((preset) => preset.id));
    expect(first.length).toBeGreaterThan(0);
    expect(new Set(first.map((vehicle) => vehicle.id)).size).toBe(first.length);
    for (const vehicle of first) {
      expect(normalizeFleetVehicle(vehicle, ids)).toBeDefined();
      // Daily distance times operating days must reproduce the annual figure.
      expect(vehicle.typicalDailyKm * vehicle.operatingDays).toBe(vehicle.annualKm);
    }
    first[0].name = "Mutated";
    expect(second[0].name).not.toBe("Mutated");
  });

  it("creates a valid neutral vehicle and never repeats an existing name", () => {
    const vehicle = createFleetVehicle("new-id", "New Vehicle", "diesel-van");
    expect(normalizeFleetVehicle(vehicle, presetIds)).toBeDefined();
    const existing = [{ ...valid(), name: "New Vehicle" }, { ...valid(), name: "New Vehicle 2" }];
    expect(uniqueVehicleName("New Vehicle", existing)).toBe("New Vehicle 3");
    expect(uniqueVehicleName("Unused", existing)).toBe("Unused");
  });
});
