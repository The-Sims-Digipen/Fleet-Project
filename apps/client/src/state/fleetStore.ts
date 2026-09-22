import { create } from "zustand";

import type { AnalysisSettings, FleetVehicle } from "../domain/contracts";
import { copyFleetVehicle, createFleetVehicle, isYearInPeriod, normalizeAnalysisSettings, normalizeFleetVehicle, uniqueVehicleName } from "../domain/fleet";
import { createMockAnalysis, createMockFleet } from "../domain/mockProject";
import { usePresetStore } from "./presetStore";

/**
 * The authoritative project fleet (T03).
 *
 * Holds the project-owned half of `M1ProjectDocument`: real fleet vehicles and
 * the common analysis settings. Scenario-owned transition decisions are not
 * here — they live in each scenario document, so editing one scenario cannot
 * change another or the shared fleet.
 *
 * Deleting a vehicle also has to clear its scenario plan entries. That crosses
 * two stores, so it lives in `domain/fleetCommands.ts` rather than here.
 */

type FleetState = {
  vehicles: FleetVehicle[];
  analysis: AnalysisSettings;
  /** Snapshot taken when a continuous edit begins, so Escape can restore it. */
  baseline: FleetVehicle[] | null;
  /** Returns the new vehicle id, or null when no preset exists to reference. */
  createVehicle: () => string | null;
  duplicateVehicle: (id: string) => string | null;
  updateVehicle: (id: string, patch: Partial<FleetVehicle>) => void;
  /** Removes the vehicle only. Callers must clear scenario plans themselves. */
  removeVehicle: (id: string) => void;
  replaceFleet: (vehicles: FleetVehicle[]) => void;
  updateAnalysis: (patch: Partial<AnalysisSettings>) => void;
  beginEdit: () => void;
  commitEdit: () => void;
  cancelEdit: () => void;
};

const knownPresetIds = (): ReadonlySet<string> => new Set(usePresetStore.getState().presets.map((preset) => preset.id));
const firstPresetId = () => usePresetStore.getState().presets[0]?.id;

export const useFleetStore = create<FleetState>((set, get) => {
  return {
    vehicles: createMockFleet(),
    analysis: createMockAnalysis(),
    baseline: null,

    createVehicle: () => {
      get().commitEdit();
      const presetId = firstPresetId();
      // A fleet vehicle must resolve to a preset, so it cannot be created without one.
      if (!presetId) return null;
      const vehicle = createFleetVehicle(crypto.randomUUID(), uniqueVehicleName("New Vehicle", get().vehicles), presetId);
      if (!normalizeFleetVehicle(vehicle, knownPresetIds())) return null;
      set({ vehicles: [...get().vehicles, vehicle] });
      return vehicle.id;
    },

    duplicateVehicle: (id) => {
      get().commitEdit();
      const source = get().vehicles.find((vehicle) => vehicle.id === id);
      if (!source) return null;
      const copy = { ...copyFleetVehicle(source), id: crypto.randomUUID(), name: uniqueVehicleName(`${source.name} copy`, get().vehicles) };
      set({ vehicles: [...get().vehicles, copy] });
      return copy.id;
    },

    updateVehicle: (id, patch) => {
      const current = get().vehicles.find((vehicle) => vehicle.id === id);
      if (!current) return;
      // Reject the whole edit when the patched record would be invalid, so a bad
      // draft never replaces valid inputs (docs/tech/contracts.md).
      const next = normalizeFleetVehicle({ ...current, ...patch, id: current.id }, knownPresetIds());
      if (!next || !isYearInPeriod(get().analysis, next.replacementYear)) return;
      set({ vehicles: get().vehicles.map((vehicle) => (vehicle.id === id ? next : vehicle)) });
    },

    removeVehicle: (id) => {
      get().commitEdit();
      set({ vehicles: get().vehicles.filter((vehicle) => vehicle.id !== id) });
    },

    replaceFleet: (vehicles) => {
      get().commitEdit();
      set({ vehicles: vehicles.map(copyFleetVehicle) });
    },

    updateAnalysis: (patch) => {
      const next = normalizeAnalysisSettings({ ...get().analysis, ...patch });
      if (!next) return;
      // A shorter period must not strand replacement years outside it.
      const vehicles = get().vehicles.map((vehicle) => isYearInPeriod(next, vehicle.replacementYear) ? vehicle : { ...vehicle, replacementYear: null });
      set({ analysis: next, vehicles });
    },

    beginEdit: () => {
      if (!get().baseline) set({ baseline: get().vehicles });
    },
    commitEdit: () => {
      if (get().baseline) set({ baseline: null });
    },
    cancelEdit: () => {
      const baseline = get().baseline;
      if (!baseline) return;
      set({ baseline: null, vehicles: baseline });
    },
  };
});
