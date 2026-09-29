export type Vector3 = [number, number, number];
export type MaterialPreset = "matte" | "glossy" | "metal";
export type Transform = { position: Vector3; rotation: Vector3; scale: Vector3 };
export type Appearance = { tint?: string; material?: MaterialPreset; wireframe?: boolean };
export type SceneObject = {
  id: string;
  name: string;
  definitionId: string;
  /** Vehicle preset this instance belongs to. When set and resolvable it supplies the geometry; definitionId is the fallback. */
  presetId?: string;
  transform: Transform;
  appearance: Appearance;
};
export const identityTransform = (): Transform => ({ position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] });
export const copyTransform = (value: Readonly<{ position: readonly [number, number, number]; rotation: readonly [number, number, number]; scale: readonly [number, number, number] }>): Transform => ({
  position: [...value.position],
  rotation: [...value.rotation],
  scale: [...value.scale],
});
