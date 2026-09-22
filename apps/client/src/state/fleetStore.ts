import { useMemo } from "react";
import { create } from "zustand";

import type { AnalysisSettings, FleetVehicle, VehicleData } from "../domain/contracts";
import { isYearInPeriod, normalizeAnalysisSettings } from "../domain/fleet";
import { createMockAnalysis } from "../domain/mockProject";
import { fleetFromObjects, findVehicleObject, placeVehicle } from "../domain/worldFleet";
import type { VehiclePreset } from "../vehicles/types";
import { usePresetStore } from "./presetStore";
import { useSceneStore } from "./sceneStore";

/**
 * Project-owned analysis settings, plus the write path for a depot's vehicles (T03).
 *
 * Vehicle presets and analysis settings are shared by every depot in the
 * project. The vehicles are not: each one is an object standing in a particular
 * depot, so they live in that world's scene document and are read with
 * `useFleetVehicles()`. Writing through the scene store means placing, editing
 * and deleting a vehicle are ordinary scene edits, and therefore undoable.
 */

type FleetState = {
  analysis: AnalysisSettings;
  /** Snapshot taken when a continuous analysis edit begins, so Escape can restore it. */
  baseline: AnalysisSettings | null;
  updateAnalysis: (patch: Partial<AnalysisSettings>) => void;
  beginEdit: () => void;
  commitEdit: () => void;
  cancelEdit: () => void;
};

export const useFleetStore = create<FleetState>((set, get) => ({
  analysis: createMockAnalysis(),
  baseline: null,

  updateAnalysis: (patch) => {
    const next = normalizeAnalysisSettings({ ...get().analysis, ...patch });
    if (!next) return;
    // A shorter period must not strand replacement years outside it.
    const scene = useSceneStore.getState();
    for (const vehicle of fleetFromObjects(scene.document.objects)) {
      if (!isYearInPeriod(next, vehicle.replacementYear)) {
        scene.updateVehicleData(vehicle.id, { ...vehicleDataOf(vehicle), replacementYear: null });
      }
    }
    set({ analysis: next });
  },

  beginEdit: () => {
    if (!get().baseline) set({ baseline: get().analysis });
  },
  commitEdit: () => {
    if (get().baseline) set({ baseline: null });
  },
  cancelEdit: () => {
    const baseline = get().baseline;
    if (!baseline) return;
    set({ baseline: null, analysis: baseline });
  },
}));

const vehicleDataOf = ({ id: _id, name: _name, currentPresetId: _presetId, ...data }: FleetVehicle): VehicleData => data;

/**
 * The vehicles standing in the depot currently being edited.
 *
 * Subscribes to the object list, whose identity only changes when the document
 * does, and derives from that. Selecting a freshly mapped array instead would
 * hand the store a new reference on every render and never settle.
 */
export function useFleetVehicles(): FleetVehicle[] {
  const objects = useSceneStore((state) => state.document.objects);
  return useMemo(() => fleetFromObjects(objects), [objects]);
}

export const currentFleet = (): FleetVehicle[] => fleetFromObjects(useSceneStore.getState().document.objects);

/**
 * Instantiates a preset as a vehicle in the active depot. Returns its id, or
 * null when the preset has no usable model.
 */
export function placeVehicleFromPreset(preset: VehiclePreset): string | null {
  const scene = useSceneStore.getState();
  const object = placeVehicle(preset, crypto.randomUUID(), scene.document.objects);
  if (!object) return null;
  scene.insertObject(object);
  return object.id;
}

/**
 * Applies a patch to one vehicle, rejecting the whole edit when the result
 * would be invalid so a bad draft never replaces good inputs.
 */
export function updateFleetVehicle(vehicleId: string, patch: Partial<FleetVehicle>): void {
  const scene = useSceneStore.getState();
  const object = findVehicleObject(scene.document.objects, vehicleId);
  if (!object?.vehicle) return;

  if (patch.currentPresetId !== undefined) {
    // The preset belongs to the object, so repointing it also changes the model.
    if (!usePresetStore.getState().presets.some((preset) => preset.id === patch.currentPresetId)) return;
    scene.updateObjectPreset(vehicleId, patch.currentPresetId);
  }
  const next = { ...object.vehicle, ...vehiclePatchData(patch) };
  if (!isYearInPeriod(useFleetStore.getState().analysis, next.replacementYear)) return;
  if (!validVehicleData(next)) return;
  scene.updateVehicleData(vehicleId, next);
}

function vehiclePatchData(patch: Partial<FleetVehicle>): Partial<VehicleData> {
  const { id: _id, name: _name, currentPresetId: _presetId, ...data } = patch;
  return data;
}

function validVehicleData(data: VehicleData): boolean {
  const amounts = [data.annualKm, data.typicalDailyKm, data.depotDwellHours, data.utilisation];
  if (amounts.some((value) => !Number.isFinite(value) || value < 0)) return false;
  if (data.utilisation > 1 || data.depotDwellHours > 24) return false;
  if (!Number.isInteger(data.operatingDays) || data.operatingDays < 0 || data.operatingDays > 366) return false;
  return data.replacementYear === null || Number.isInteger(data.replacementYear);
}
