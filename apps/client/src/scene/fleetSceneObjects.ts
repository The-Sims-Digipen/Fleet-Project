import type { FleetVehicle, ScenarioVehiclePlan } from "../domain/contracts";
import { effectiveVehicleState } from "../domain/effectiveState";
import { parkingLotById } from "../domain/depotLayout";
import type { VehiclePreset } from "../vehicles/types";
import { createObject } from "./catalog";
import { copyTransform, type SceneObject } from "./types";

export function createFleetSceneObjects(input: {
  vehicles: readonly FleetVehicle[];
  presets: readonly VehiclePreset[];
  vehiclePlans: Readonly<Record<string, ScenarioVehiclePlan>>;
  year: number;
}): SceneObject[] {
  const presetIds = new Set(input.presets.map((preset) => preset.id));

  return input.vehicles.flatMap((vehicle) => {
    const parkingLot = parkingLotById(vehicle.parkingLotId);
    if (!parkingLot) return [];
    const effective = effectiveVehicleState(vehicle, input.vehiclePlans[vehicle.id], presetIds, input.year);
    const preset = effective.presetId ? input.presets.find((item) => item.id === effective.presetId) : undefined;
    const object = createObject(
      preset?.modelId || "van",
      `fleet-${vehicle.id}`,
      preset?.id,
      `${vehicle.id} · ${vehicle.name}`,
    );
    if (!object) return [];
    object.transform = copyTransform(parkingLot.transform);
    object.appearance = preset
      ? { tint: effective.transitioned ? "#39ff14" : preset.propulsion === "electric" ? "#85d8ff" : preset.propulsion === "hybrid" ? "#f5d18a" : "#ffffff" }
      : { tint: "#87928f" };
    return [object];
  });
}
