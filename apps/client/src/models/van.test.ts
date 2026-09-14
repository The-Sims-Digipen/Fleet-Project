import { Box3, Material, Mesh, MeshStandardMaterial } from "three";
import { describe, expect, it, vi } from "vitest";
import { createProceduralInstance } from "./proceduralModel";
import { createVanModel } from "./van";

describe("low-poly van", () => {
  it("creates independent multi-part THREE.Group instances at metre scale", () => {
    const first = createVanModel();
    const second = createVanModel();
    expect(first).not.toBe(second);
    expect(first.name).toBe("Low-poly van");
    expect(first.children.length).toBeGreaterThan(15);
    expect(first.children.every((child) => child instanceof Mesh)).toBe(true);
    expect((first.children[0] as Mesh).geometry).not.toBe((second.children[0] as Mesh).geometry);
    expect((first.children[0] as Mesh).material).not.toBe((second.children[0] as Mesh).material);
    const bounds = new Box3().setFromObject(first);
    expect(bounds.min.y).toBeGreaterThanOrEqual(0);
    expect(bounds.min.y).toBeLessThan(0.1);
    expect(bounds.max.y).toBeGreaterThan(2.3);
    expect(bounds.max.y).toBeLessThan(2.5);
    expect(bounds.max.x - bounds.min.x).toBeGreaterThan(2.1);
    expect(bounds.max.x - bounds.min.x).toBeLessThan(2.3);
    expect(bounds.max.z - bounds.min.z).toBeGreaterThan(4.8);
    expect(bounds.max.z - bounds.min.z).toBeLessThan(4.9);
  });

  it("applies appearance per instance and disposes owned resources", () => {
    const first = createProceduralInstance(createVanModel);
    const second = createProceduralInstance(createVanModel);
    const firstBody = first.group.getObjectByName("Lower body") as Mesh;
    const secondBody = second.group.getObjectByName("Lower body") as Mesh;
    const originalColor = (secondBody.material as MeshStandardMaterial).color.clone();
    first.applyAppearance({ tint: "#ff0000", material: "metal", wireframe: true });
    expect((firstBody.material as MeshStandardMaterial).color).not.toEqual(originalColor);
    expect((firstBody.material as MeshStandardMaterial).metalness).toBe(0.85);
    expect((firstBody.material as MeshStandardMaterial).wireframe).toBe(true);
    expect((secondBody.material as MeshStandardMaterial).color).toEqual(originalColor);
    const disposeGeometry = vi.spyOn(firstBody.geometry, "dispose");
    const disposeMaterial = vi.spyOn(firstBody.material as Material, "dispose");
    first.dispose();
    expect(disposeGeometry).toHaveBeenCalledOnce();
    expect(disposeMaterial).toHaveBeenCalledOnce();
    second.dispose();
  });
});
