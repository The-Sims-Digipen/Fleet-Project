import { effectivePresetIdFor, type ProjectDocument } from "../domain/project";
import { getDefinition } from "./catalog";
import { copyTransform, type Appearance, type Transform } from "./types";

export type WorldObjectReference =
  | { kind: "depot"; id: string }
  | { kind: "vehicle"; id: string };

type ReadonlyTransform = Readonly<{
  position: readonly [number, number, number];
  rotation: readonly [number, number, number];
  scale: readonly [number, number, number];
}>;

export type WorldObjectView = Readonly<{
  reference: Readonly<WorldObjectReference>;
  name: string;
  transform: ReadonlyTransform;
  model: Readonly<{ definitionId: string; presetId: string | null }>;
  appearance: Readonly<Appearance>;
}>;

/** Runtime-only key for maps and React reconciliation; domain identity stays in `reference`. */
export function worldObjectReferenceKey(reference: WorldObjectReference): string {
  return JSON.stringify([reference.kind, reference.id]);
}

function readonlyTransform(transform: Transform): ReadonlyTransform {
  const copied = copyTransform(transform);
  return copied;
}

function vehicleView(document: ProjectDocument, vehicleId: string, year: number): WorldObjectView | undefined {
  const vehicle = document.environment.vehicles.find((entry) => entry.id === vehicleId);
  if (!vehicle) return undefined;

  const selectedPresetId = effectivePresetIdFor(document, document.activeScenarioId, vehicle.id, year);
  const presetId = selectedPresetId === undefined ? vehicle.baselinePresetId : selectedPresetId;
  const preset = presetId ? document.vehiclePresets.find((entry) => entry.id === presetId) : undefined;
  const definitionId = preset && getDefinition(preset.modelId)?.vehiclePresetCompatible ? preset.modelId : "van";
  const transitioned = presetId !== vehicle.baselinePresetId;
  const appearance: Appearance = preset
    ? { tint: transitioned ? "#39ff14" : preset.propulsion === "electric" ? "#85d8ff" : preset.propulsion === "hybrid" ? "#f5d18a" : "#ffffff" }
    : { tint: "#87928f" };

  return {
    reference: { kind: "vehicle", id: vehicle.id },
    name: vehicle.name,
    transform: readonlyTransform(vehicle.transform),
    model: { definitionId, presetId },
    appearance,
  };
}

/** Read-only projection of typed Project entities for viewport consumers. */
export function createProjectWorld(document: ProjectDocument, year: number): readonly WorldObjectView[] {
  const { depot, vehicles } = document.environment;
  const objects: WorldObjectView[] = [{
    reference: { kind: "depot", id: depot.id },
    name: depot.name,
    transform: readonlyTransform(depot.transform),
    model: { definitionId: "depot", presetId: null },
    appearance: {},
  }];

  for (const vehicle of vehicles) {
    const view = vehicleView(document, vehicle.id, year);
    if (view) objects.push(view);
  }

  return objects;
}
