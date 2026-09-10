import { Box3, Box3Helper, Color, Material, Mesh, MeshStandardMaterial, Object3D, Skeleton, SkinnedMesh } from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import type { Appearance, MaterialPreset } from "./types";

const presets: Record<MaterialPreset, { roughness: number; metalness: number }> = {
  matte: { roughness: 0.9, metalness: 0 }, glossy: { roughness: 0.18, metalness: 0.1 }, metal: { roughness: 0.3, metalness: 0.85 },
};

export function createModelInstance(source: Object3D) {
  const scene = clone(source);
  const materials = new Map<Material, Material>();
  const skeletons = new Set<Skeleton>();
  const ownedMaterial = (original: Material) => {
    let material = materials.get(original);
    if (!material) { material = original.clone(); materials.set(original, material); }
    return material;
  };
  scene.traverse((node) => {
    if (node instanceof Mesh) node.material = Array.isArray(node.material) ? node.material.map(ownedMaterial) : ownedMaterial(node.material);
    if (node instanceof SkinnedMesh) skeletons.add(node.skeleton);
  });
  const outline = new Box3Helper(new Box3().setFromObject(scene), new Color("#ffffff"));
  outline.raycast = () => {};
  return {
    scene, outline,
    applyAppearance(appearance: Appearance) {
      for (const [original, material] of materials) {
        material.copy(original);
        if (appearance.tint && "color" in material && material.color instanceof Color) material.color.multiply(new Color(appearance.tint));
        if (appearance.material && material instanceof MeshStandardMaterial) Object.assign(material, presets[appearance.material]);
        if (appearance.wireframe !== undefined && "wireframe" in material) material.wireframe = appearance.wireframe;
        material.needsUpdate = true;
      }
    },
    dispose() {
      for (const material of materials.values()) material.dispose();
      for (const skeleton of skeletons) skeleton.dispose();
      outline.dispose();
    },
  };
}
