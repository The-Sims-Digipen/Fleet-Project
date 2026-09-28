import { createObject } from "./catalog";
import type { SceneDocument } from "./types";

export const DEFAULT_DEPOT_OBJECT_ID = "default-project-depot";

export function createDefaultProjectScene(): SceneDocument {
  const depot = createObject("depot", DEFAULT_DEPOT_OBJECT_ID, undefined, "Default depot");
  if (!depot) throw new Error("The default depot model is not registered.");
  return { version: 3, light: 65, objects: [depot] };
}

export function hasDefaultDepot(document: SceneDocument): boolean {
  return document.objects.some((object) => object.id === DEFAULT_DEPOT_OBJECT_ID && object.definitionId === "depot");
}
