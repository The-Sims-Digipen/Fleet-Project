import { M1_PROJECT_DOCUMENT_VERSION, type AnalysisSettings, type FleetVehicle, type M1ProjectDocument } from "./contracts";
import { copyFleetVehicle } from "./fleet";
import { copyPreset, type VehiclePreset } from "../vehicles/types";

/**
 * Assembles the project-owned authoritative inputs into a document (T03).
 *
 * Writing only. Reading, validating and migrating a stored document belongs to
 * `project/serialization.ts`, which is the single reader for every persistence
 * path. Derived results are never part of a project document.
 */

export function createProjectDocument(vehiclePresets: readonly VehiclePreset[], fleetVehicles: readonly FleetVehicle[], analysis: AnalysisSettings): M1ProjectDocument {
  return {
    version: M1_PROJECT_DOCUMENT_VERSION,
    vehiclePresets: vehiclePresets.map(copyPreset),
    fleetVehicles: fleetVehicles.map(copyFleetVehicle),
    analysis: { ...analysis },
  };
}
