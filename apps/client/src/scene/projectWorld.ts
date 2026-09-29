import {
  effectivePresetIdFor,
  type ProjectDepot,
  type ProjectDocument,
  type ProjectEntityReference,
  type ProjectVehicle,
} from "../domain/project";
import { copyTransform, type Transform } from "../domain/spatial";
import { getModelDefinition } from "./catalog";

type ReadonlyTransform = Readonly<{
  position: readonly [number, number, number];
  rotation: readonly [number, number, number];
  scale: readonly [number, number, number];
}>;

export type ProjectWorldObject = Readonly<{
  reference: Readonly<ProjectEntityReference>;
  name: string;
  transform: ReadonlyTransform;
  modelId: string;
  tint: string | null;
}>;

export type ProjectWorldSelection =
  | Readonly<{ kind: "depot"; worldObject: ProjectWorldObject; entity: ProjectDepot }>
  | Readonly<{ kind: "vehicle"; worldObject: ProjectWorldObject; entity: ProjectVehicle }>;

/** Runtime-only key for maps and React reconciliation; domain identity stays in `reference`. */
export function projectEntityReferenceKey(reference: ProjectEntityReference): string {
  return JSON.stringify([reference.kind, reference.id]);
}

function readonlyTransform(transform: Transform): ReadonlyTransform {
  const copied = copyTransform(transform);
  return copied;
}

function vehicleView(document: ProjectDocument, vehicleId: string, scenarioId: string | null, year: number): ProjectWorldObject | undefined {
  const vehicle = document.environment.vehicles.find((entry) => entry.id === vehicleId);
  if (!vehicle) return undefined;

  const selectedPresetId = effectivePresetIdFor(document, scenarioId, vehicle.id, year);
  const presetId = selectedPresetId === undefined ? vehicle.baselinePresetId : selectedPresetId;
  const preset = presetId ? document.vehiclePresets.find((entry) => entry.id === presetId) : undefined;
  const modelId = preset && getModelDefinition(preset.modelId)?.vehiclePresetCompatible ? preset.modelId : "van";
  const transitioned = presetId !== vehicle.baselinePresetId;
  const tint = preset
    ? transitioned ? "#39ff14" : preset.propulsion === "electric" ? "#85d8ff" : preset.propulsion === "hybrid" ? "#f5d18a" : "#ffffff"
    : "#87928f";

  return {
    reference: { kind: "vehicle", id: vehicle.id },
    name: vehicle.name,
    transform: readonlyTransform(vehicle.transform),
    modelId,
    tint,
  };
}

/** Read-only projection of typed Project entities for viewport consumers. */
export function createProjectWorld(
  document: ProjectDocument,
  year: number,
  scenarioId: string | null = document.activeScenarioId,
): readonly ProjectWorldObject[] {
  const { depot, vehicles } = document.environment;
  const objects: ProjectWorldObject[] = [{
    reference: { kind: "depot", id: depot.id },
    name: depot.name,
    transform: readonlyTransform(depot.transform),
    modelId: "depot",
    tint: null,
  }];

  for (const vehicle of vehicles) {
    const view = vehicleView(document, vehicle.id, scenarioId, year);
    if (view) objects.push(view);
  }

  return objects;
}

/** Resolves editor routing through the same typed objects used for picking and outlines. */
export function resolveProjectWorldSelection(
  document: ProjectDocument,
  world: readonly ProjectWorldObject[],
  reference: ProjectEntityReference | null,
): ProjectWorldSelection | undefined {
  if (!reference) return undefined;
  const worldObject = world.find((object) => projectEntityReferenceKey(object.reference) === projectEntityReferenceKey(reference));
  if (!worldObject) return undefined;

  if (reference.kind === "depot") {
    const entity = document.environment.depot.id === reference.id ? document.environment.depot : undefined;
    return entity ? { kind: "depot", worldObject, entity } : undefined;
  }

  const entity = document.environment.vehicles.find((vehicle) => vehicle.id === reference.id);
  return entity ? { kind: "vehicle", worldObject, entity } : undefined;
}
