import { describe, expect, it } from "vitest";
import { createObject, getAsset, getDefinition, objectDefinitions } from "./catalog";

describe("object catalog", () => {
  it("resolves every definition to a bundled GLB with finite correction/default transforms", () => {
    for (const definition of Object.values(objectDefinitions)) {
      const asset = getAsset(definition.assetId)!;
      expect(asset.url).toMatch(/models\/.+\.glb$/);
      for (const transform of [asset.correction, definition.transform]) {
        expect(Object.values(transform).flat().every(Number.isFinite)).toBe(true);
        expect(transform.scale.every((value) => value > 0)).toBe(true);
      }
    }
  });
  it("copies defaults independently and rejects unknown or inherited keys", () => {
    const first = createObject("bollard", "a")!;
    const second = createObject("bollard", "b")!;
    first.transform.position[0] = 99;
    first.appearance.tint = "#123456";
    expect(second.transform.position).toEqual([0, 0, 0]);
    expect(second.appearance).toEqual({});
    expect(getDefinition("bollard")!.transform.position).toEqual([0, 0, 0]);
    for (const key of ["missing", "constructor", "__proto__"]) {
      expect(getDefinition(key)).toBeUndefined();
      expect(getAsset(key)).toBeUndefined();
      expect(createObject(key, "c")).toBeUndefined();
    }
  });
});
