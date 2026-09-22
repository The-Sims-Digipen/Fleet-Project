import type { VehicleData } from "../domain/contracts";

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
  /**
   * Present when this object is a real fleet vehicle rather than scenery.
   * Placing a preset creates it; deleting the object removes the vehicle with it,
   * so a depot's fleet is exactly the vehicles standing in that depot.
   */
  vehicle?: VehicleData;
  transform: Transform;
  appearance: Appearance;
};

/** Version 4 added per-object vehicle data. Version 3 documents carry none. */
export const SCENE_DOCUMENT_VERSION = 4 as const;
export type SceneDocument = { version: typeof SCENE_DOCUMENT_VERSION; objects: SceneObject[]; light: number };
export type TransformProperty = keyof Transform;
export const identityTransform = (): Transform => ({ position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] });
export const copyTransform = (value: Transform): Transform => ({ position: [...value.position], rotation: [...value.rotation], scale: [...value.scale] });
