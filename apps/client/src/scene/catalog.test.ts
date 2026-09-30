import { describe, expect, it } from "vitest";
import { Group } from "three";
import { getModelDefinition, modelDefinitions, vehicleModelEntries } from "./catalog";

describe("render model catalog", () => {
  it("resolves each model to an independently constructed procedural Group", () => {
    for (const definition of Object.values(modelDefinitions)) {
      const first = definition.createModel();
      const second = definition.createModel();
      expect(first).toBeInstanceOf(Group);
      expect(first).not.toBe(second);
    }
  });

  it("exposes only Vehicle-compatible models to Preset editing", () => {
    expect(vehicleModelEntries).toEqual([{ id: "van", name: "Low-poly Van" }]);
    expect(getModelDefinition("depot")).toBeDefined();
    expect(getModelDefinition("van")?.vehiclePresetCompatible).toBe(true);
    expect(getModelDefinition("depot")?.vehiclePresetCompatible).toBe(false);
  });

  it("rejects unknown and inherited model identifiers", () => {
    for (const key of ["missing", "constructor", "__proto__"]) {
      expect(getModelDefinition(key)).toBeUndefined();
    }
  });
});
