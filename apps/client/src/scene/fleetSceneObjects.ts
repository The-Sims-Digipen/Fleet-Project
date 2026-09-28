import { effectivePresetIdFor, type ProjectDocument } from "../domain/project";
import { createObject } from "./catalog";
import { copyTransform, type SceneObject } from "./types";

/** Render-only projection of the canonical Project aggregate. */
export function createProjectSceneObjects(document: ProjectDocument, year: number): SceneObject[] {
  const depot = createObject("depot", document.environment.depot.id, undefined, document.environment.depot.name);
  const objects: SceneObject[] = [];
  if (depot) {
    depot.transform = copyTransform(document.environment.depot.transform);
    objects.push(depot);
  }

  for (const vehicle of document.environment.vehicles) {
    const presetId = effectivePresetIdFor(document, document.activeScenarioId, vehicle.id, year);
    const preset = presetId ? document.vehiclePresets.find((entry) => entry.id === presetId) : undefined;
    const object = createObject(preset?.modelId ?? "van", vehicle.id, preset?.id, `${vehicle.id} · ${vehicle.name}`);
    if (!object) continue;
    object.transform = copyTransform(vehicle.transform);
    const transitioned = presetId !== vehicle.baselinePresetId;
    object.appearance = preset
      ? { tint: transitioned ? "#39ff14" : preset.propulsion === "electric" ? "#85d8ff" : preset.propulsion === "hybrid" ? "#f5d18a" : "#ffffff" }
      : { tint: "#87928f" };
    objects.push(object);
  }

  return objects;
}
