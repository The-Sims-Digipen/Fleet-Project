import { M1_PROJECT_DOCUMENT_VERSION, type AnalysisSettings, type M1ProjectDocument } from "./contracts";
import { copyPreset, type VehiclePreset } from "../vehicles/types";

/**
 * Assembles the project-owned authoritative inputs into a document (T03).
 *
 * Vehicle presets and analysis settings are shared by every depot in the
 * project. The vehicles themselves belong to the depot they stand in and travel
 * with its world document, so they are not part of this.
 *
 * Writing only. Reading, validating and migrating a stored document belongs to
 * `project/serialization.ts`, which is the single reader for every persistence
 * path. Derived results are never part of a project document.
 */

export function createProjectDocument(vehiclePresets: readonly VehiclePreset[], analysis: AnalysisSettings): M1ProjectDocument {
  return {
    version: M1_PROJECT_DOCUMENT_VERSION,
    vehiclePresets: vehiclePresets.map(copyPreset),
    analysis: { ...analysis },
  };
}
