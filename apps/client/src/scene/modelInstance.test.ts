/// <reference types="node" />
import { readFileSync } from "node:fs";
import { BoxGeometry, Color, Group, Mesh, MeshStandardMaterial, Texture } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { describe, expect, it, vi } from "vitest";
import { createModelInstance } from "./modelInstance";

describe("model instances", () => {
  it("shares geometry/textures, isolates multi-material edits, and restores authored materials", () => {
    const texture = new Texture();
    const original = new MeshStandardMaterial({ color: "#88aa66", roughness: 0.42, metalness: 0.12, map: texture });
    const secondMaterial = new MeshStandardMaterial({ color: "#eeeeee" });
    const geometry = new BoxGeometry();
    const source = new Group();
    source.add(new Mesh(geometry, [original, secondMaterial]));
    const first = createModelInstance(source);
    const second = createModelInstance(source);
    const mesh = first.scene.children[0] as Mesh;
    const materials = mesh.material as MeshStandardMaterial[];
    expect(mesh.geometry).toBe(geometry);
    expect(materials[0]).not.toBe(original);
    expect(materials[0].map).toBe(texture);
    first.applyAppearance({ tint: "#ff0088", material: "metal", wireframe: true });
    expect(materials[0].color).toEqual(original.color.clone().multiply(new Color("#ff0088")));
    expect(materials[0].metalness).toBe(0.85);
    expect(materials.every((material) => material.wireframe)).toBe(true);
    const otherMaterial = ((second.scene.children[0] as Mesh).material as MeshStandardMaterial[])[0];
    expect(otherMaterial.color).toEqual(original.color);
    expect(otherMaterial.wireframe).toBe(false);
    expect(original.roughness).toBe(0.42);
    first.applyAppearance({});
    expect(materials[0].color).toEqual(original.color);
    expect(materials[0].roughness).toBe(0.42);
    expect(materials[0].wireframe).toBe(false);
    const disposeMaterial = vi.spyOn(materials[0], "dispose");
    const disposeGeometry = vi.spyOn(geometry, "dispose");
    const disposeTexture = vi.spyOn(texture, "dispose");
    first.dispose();
    expect(disposeMaterial).toHaveBeenCalledOnce();
    expect(disposeGeometry).not.toHaveBeenCalled();
    expect(disposeTexture).not.toHaveBeenCalled();
    second.dispose();
  });
  it("loads the actual bundled GLB and preserves metre dimensions and multiple materials", async () => {
    const file = readFileSync("public/models/sample-bollard.glb");
    // Copy into this test environment's ArrayBuffer realm (jsdom differs from node:fs).
    const buffer = new Uint8Array(file).buffer;
    const gltf = await new GLTFLoader().parseAsync(buffer, "");
    expect(gltf.scene.children).toHaveLength(5);
    const instance = createModelInstance(gltf.scene);
    expect(instance.outline.box.min.y).toBeCloseTo(0);
    expect(instance.outline.box.max.y).toBeCloseTo(2.4);
    expect(new Set(gltf.scene.children.map((node) => (node as Mesh).material)).size).toBe(3);
    instance.dispose();
  });
});
