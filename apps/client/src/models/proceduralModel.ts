import { Box3, Box3Helper, Color, Material, Mesh, MeshStandardMaterial, Texture, type BufferGeometry, type Group } from "three";
import type { Appearance, MaterialPreset } from "../scene/types";

const presets: Record<MaterialPreset, { roughness: number; metalness: number }> = {
  matte: { roughness: 0.9, metalness: 0 },
  glossy: { roughness: 0.18, metalness: 0.1 },
  metal: { roughness: 0.3, metalness: 0.85 },
};

/** Owns every render resource returned by a procedural model factory. */
export function createProceduralInstance(factory: () => Group) {
  const group = factory();
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  const textures = new Set<Texture>();
  const authoredMaterials = new Map<Material, Material>();

  group.traverse((node) => {
    if (!(node instanceof Mesh)) return;
    geometries.add(node.geometry);
    const nodeMaterials = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of nodeMaterials) {
      materials.add(material);
      if (!authoredMaterials.has(material)) authoredMaterials.set(material, material.clone());
      for (const value of Object.values(material)) if (value instanceof Texture) textures.add(value);
    }
  });

  const outline = new Box3Helper(new Box3().setFromObject(group), new Color("#ffffff"));
  outline.name = "Selection outline";
  outline.raycast = () => {};

  return {
    group,
    outline,
    applyAppearance(appearance: Appearance) {
      for (const [material, authored] of authoredMaterials) {
        material.copy(authored);
        if (appearance.tint && "color" in material && material.color instanceof Color) material.color.multiply(new Color(appearance.tint));
        if (appearance.material && material instanceof MeshStandardMaterial) Object.assign(material, presets[appearance.material]);
        if (appearance.wireframe !== undefined && "wireframe" in material) material.wireframe = appearance.wireframe;
        material.needsUpdate = true;
      }
    },
    dispose() {
      for (const authored of authoredMaterials.values()) authored.dispose();
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      for (const texture of textures) texture.dispose();
      outline.dispose();
    },
  };
}
