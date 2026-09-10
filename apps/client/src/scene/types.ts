export type Vector3 = [number, number, number];
export type MaterialPreset = "matte" | "glossy" | "metal";
export type Transform = { position: Vector3; rotation: Vector3; scale: Vector3 };
export type Appearance = { tint?: string; material?: MaterialPreset; wireframe?: boolean };
export type SceneObject = {
  id: string;
  name: string;
  definitionId: string;
  transform: Transform;
  appearance: Appearance;
};
export type SceneDocument = { version: 2; objects: SceneObject[]; light: number };
export type TransformProperty = keyof Transform;
export type ModelAsset = { url: string; correction: Transform };
export type ObjectDefinition = { kind: "model"; name: string; assetId: string; transform: Transform };

export const identityTransform = (): Transform => ({ position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] });
export const copyTransform = (value: Transform): Transform => ({ position: [...value.position], rotation: [...value.rotation], scale: [...value.scale] });
