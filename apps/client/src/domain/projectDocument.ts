import { M1_PROJECT_DOCUMENT_VERSION, type AnalysisSettings, type FleetVehicle, type M1ProjectDocument } from "./contracts";
import { copyFleetVehicle, normalizeAnalysisSettings, normalizeFleetVehicle } from "./fleet";
import { defaultAnalysisSettings } from "./mockProject";
import { copyPreset, normalizePreset, type VehiclePreset } from "../vehicles/types";

/**
 * Serialization of the project-owned authoritative inputs (T03).
 *
 * T01 and T06 use these to move presets, fleet and analysis settings in and out
 * of storage without knowing the store layout. Derived results are never part
 * of a project document.
 */

export function createProjectDocument(vehiclePresets: readonly VehiclePreset[], fleetVehicles: readonly FleetVehicle[], analysis: AnalysisSettings): M1ProjectDocument {
  return {
    version: M1_PROJECT_DOCUMENT_VERSION,
    vehiclePresets: vehiclePresets.map(copyPreset),
    fleetVehicles: fleetVehicles.map(copyFleetVehicle),
    analysis: { ...analysis },
  };
}

/**
 * Fields a version 2 preset predates. The values are deliberately neutral: a
 * legacy preset must not gain invented running costs or residual value when a
 * project written before those fields existed is reopened.
 */
const legacyPresetDefaults = { maintenanceCostPerYear: 0, rangeKm: null, chargingEfficiency: 1, acquisition: { kind: "owned", endResidualValue: 0 } } as const;

function readPreset(record: unknown): VehiclePreset | undefined {
  if (typeof record !== "object" || record === null || Array.isArray(record)) return;
  return normalizePreset(record) ?? normalizePreset({ ...legacyPresetDefaults, ...record });
}

/**
 * Reads any supported project document as the authoritative M1 shape.
 *
 * Version 2 documents carry presets only, so they reopen with an empty fleet
 * and the default analysis period rather than an invented fleet. Records that
 * fail validation are dropped rather than crashing the reopen.
 */
export function toM1ProjectDocument(document: unknown): M1ProjectDocument {
  if (typeof document !== "object" || document === null || Array.isArray(document)) {
    return createProjectDocument([], [], defaultAnalysisSettings);
  }
  const record = document as Record<string, unknown>;

  const vehiclePresets: VehiclePreset[] = [];
  const seenPresets = new Set<string>();
  if (Array.isArray(record.vehiclePresets)) {
    for (const entry of record.vehiclePresets) {
      const preset = readPreset(entry);
      if (preset && !seenPresets.has(preset.id)) {
        seenPresets.add(preset.id);
        vehiclePresets.push(preset);
      }
    }
  }

  const analysis = normalizeAnalysisSettings(record.analysis) ?? { ...defaultAnalysisSettings };

  const fleetVehicles: FleetVehicle[] = [];
  const seenVehicles = new Set<string>();
  if (Array.isArray(record.fleetVehicles)) {
    for (const entry of record.fleetVehicles) {
      const vehicle = normalizeFleetVehicle(entry, seenPresets);
      if (vehicle && !seenVehicles.has(vehicle.id)) {
        seenVehicles.add(vehicle.id);
        fleetVehicles.push(vehicle);
      }
    }
  }

  return { version: M1_PROJECT_DOCUMENT_VERSION, vehiclePresets, fleetVehicles, analysis };
}
