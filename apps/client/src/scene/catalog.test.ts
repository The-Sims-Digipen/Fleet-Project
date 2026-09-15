import { describe, expect, it } from "vitest";
import { Group } from "three";
import { createObject, getDefinition, objectDefinitions, vehicleModelEntries } from "./catalog";

describe("object catalog", () => {
  it("resolves every definition to a procedural Group with finite defaults", () => {
    for (const definition of Object.values(objectDefinitions)) {
      expect(definition.createModel()).toBeInstanceOf(Group);
      expect(Object.values(definition.transform).flat().every(Number.isFinite)).toBe(true);
      expect(definition.transform.scale.every((value) => value > 0)).toBe(true);
    }
  });
  it("carries an optional preset link and name without inventing one", () => {
    expect(createObject("van", "a")).not.toHaveProperty("presetId");
    const linked = createObject("van", "b", "electric-van", "  Electric Delivery Van  ")!;
    expect(linked.presetId).toBe("electric-van");
    expect(linked.name).toBe("Electric Delivery Van");
    expect(createObject("van", "c", "electric-van", "   ")!.name).toBe("Low-poly Van");
  });
  it("keeps environment models out of vehicle preset choices", () => {
    expect(getDefinition("depot")).toBeDefined();
    expect(vehicleModelEntries.map(([id]) => id)).toEqual(["van"]);
  });
  it("copies defaults independently and rejects unknown or inherited keys", () => {
    const first = createObject("van", "a")!;
    const second = createObject("van", "b")!;
    first.transform.position[0] = 99;
    first.appearance.tint = "#123456";
    expect(second.transform.position).toEqual([0, 0, 0]);
    expect(second.appearance).toEqual({});
    expect(getDefinition("van")!.transform.position).toEqual([0, 0, 0]);
    for (const key of ["missing", "constructor", "__proto__"]) {
      expect(getDefinition(key)).toBeUndefined();
      expect(createObject(key, "c")).toBeUndefined();
    }
  });
});
