import type { FleetVehicle, VehicleData } from "./contracts";
import { createObject } from "../scene/catalog";
import type { SceneDocument, SceneObject } from "../scene/types";
import type { VehiclePreset } from "../vehicles/types";

/**
 * A depot's fleet, derived from the objects standing in it (T03).
 *
 * A vehicle preset is a reusable type shared by every depot in the project.
 * Placing one instantiates a vehicle in that depot, and the placed object *is*
 * the vehicle: its id, name and preset come from the object, its planning data
 * rides along in `object.vehicle`. There is no second list to keep in step, so
 * a depot's fleet can never disagree with what it contains.
 */

/** Only preset placements are vehicles; a bare catalog object stays scenery. */
export function isVehicleObject(object: SceneObject): object is SceneObject & { presetId: string; vehicle: VehicleData } {
  return object.vehicle !== undefined && object.presetId !== undefined;
}

export function toFleetVehicle(object: SceneObject & { presetId: string; vehicle: VehicleData }): FleetVehicle {
  return { ...object.vehicle, currentHolding: { ...object.vehicle.currentHolding }, id: object.id, name: object.name, currentPresetId: object.presetId };
}

/** Every vehicle in one depot, in placement order. */
export function fleetFromObjects(objects: readonly SceneObject[]): FleetVehicle[] {
  return objects.filter(isVehicleObject).map(toFleetVehicle);
}

export const fleetFromDocument = (document: SceneDocument): FleetVehicle[] => fleetFromObjects(document.objects);

export const findVehicleObject = (objects: readonly SceneObject[], vehicleId: string): SceneObject | undefined =>
  objects.find((object) => object.id === vehicleId && isVehicleObject(object));

/** Neutral planning values for a newly placed vehicle. Nothing is invented. */
export function newVehicleData(): VehicleData {
  return {
    annualKm: 0,
    typicalDailyKm: 0,
    operatingDays: 250,
    utilisation: 1,
    routePattern: "predictable",
    returnsToDepot: true,
    externalChargingAccess: false,
    depotDwellHours: 8,
    replacementYear: null,
    currentHolding: { kind: "owned", currentValue: 0, endResidualValue: 0 },
  };
}

/** Spacing used when laying vehicles out so a new one does not land inside another. */
const ROW_SPACING_METRES = 4.5;

/** Places vehicles in a row along X, clear of anything already in the depot. */
export function rowPosition(index: number, existing: readonly SceneObject[]): [number, number, number] {
  const occupied = existing.reduce((furthest, object) => Math.max(furthest, object.transform.position[0]), 0);
  return [occupied + ROW_SPACING_METRES * (index + 1), 0, 0];
}

/**
 * Instantiates a preset as a vehicle in this depot. The caller supplies the id
 * so tests stay deterministic and the scene store keeps sole ownership of
 * minting them.
 */
export function placeVehicle(preset: VehiclePreset, id: string, existing: readonly SceneObject[], data: VehicleData = newVehicleData()): SceneObject | undefined {
  const object = createObject(preset.modelId, id, preset.id, preset.name);
  if (!object) return;
  object.transform.position = rowPosition(0, existing);
  object.vehicle = data;
  return object;
}

/**
 * Rebuilds vehicles that were stored on the project as placed objects.
 *
 * Used once, when a project saved while the fleet was project-wide is reopened:
 * its vehicles move into the depot that was active, laid out in a row. Ids are
 * preserved so existing scenario plans keep resolving.
 */
export function placeMigratedFleet(vehicles: readonly FleetVehicle[], presets: readonly VehiclePreset[], existing: readonly SceneObject[]): SceneObject[] {
  const modelFor = (presetId: string) => presets.find((preset) => preset.id === presetId)?.modelId;
  const placed: SceneObject[] = [];
  for (const vehicle of vehicles) {
    const { id, name, currentPresetId, ...data } = vehicle;
    // A preset that no longer exists still renders through the catalog fallback.
    const object = createObject(modelFor(currentPresetId) ?? "van", id, currentPresetId, name);
    if (!object) continue;
    object.transform.position = rowPosition(placed.length, existing);
    object.vehicle = { ...data, currentHolding: { ...data.currentHolding } };
    placed.push(object);
  }
  return placed;
}
