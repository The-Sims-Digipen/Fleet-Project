import { M1_PROJECT_DOCUMENT_VERSION, type AnalysisSettings, type FleetVehicle, type M1ProjectDocument } from "./contracts";
import { hasValidParkingAssignments } from "./depotLayout";
import { copyFleetVehicle, normalizeAnalysisSettings, normalizeFleetVehicle } from "./fleet";
import { hasDefaultDepot } from "../scene/defaultProjectScene";
import type { SceneDocument } from "../scene/types";
import { copyPreset, normalizePreset, type VehiclePreset } from "../vehicles/types";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

/** Creates the one persisted aggregate used by project save, export and simulation. */
export function createProjectDocument(
  vehiclePresets: readonly VehiclePreset[],
  fleetVehicles: readonly FleetVehicle[],
  analysis: AnalysisSettings,
  scene: SceneDocument,
): M1ProjectDocument {
  return {
    version: M1_PROJECT_DOCUMENT_VERSION,
    scene: clone(scene),
    vehiclePresets: vehiclePresets.map(copyPreset),
    fleetVehicles: fleetVehicles.map(copyFleetVehicle),
    analysis: { ...analysis },
  };
}

/** Reads the current single-environment document shape. Legacy World documents are intentionally unsupported. */
export function toM1ProjectDocument(document: unknown): M1ProjectDocument {
  if (typeof document !== "object" || document === null || Array.isArray(document)) {
    throw new Error("The project document is invalid.");
  }
  const record = document as Record<string, unknown>;
  if (record.version !== M1_PROJECT_DOCUMENT_VERSION) {
    throw new Error(`Unsupported project document version “${String(record.version)}”.`);
  }
  if (!Array.isArray(record.vehiclePresets) || !Array.isArray(record.fleetVehicles)) {
    throw new Error("The project document is incomplete.");
  }

  const vehiclePresets: VehiclePreset[] = [];
  const presetIds = new Set<string>();
  for (const entry of record.vehiclePresets) {
    const preset = normalizePreset(entry);
    if (!preset || presetIds.has(preset.id)) throw new Error("The project contains an invalid or duplicate vehicle preset.");
    presetIds.add(preset.id);
    vehiclePresets.push(preset);
  }

  const fleetVehicles: FleetVehicle[] = [];
  const vehicleIds = new Set<string>();
  for (const entry of record.fleetVehicles) {
    const vehicle = normalizeFleetVehicle(entry, presetIds);
    if (!vehicle || vehicleIds.has(vehicle.id)) throw new Error("The project contains an invalid or duplicate fleet vehicle.");
    vehicleIds.add(vehicle.id);
    fleetVehicles.push(vehicle);
  }
  if (!hasValidParkingAssignments(fleetVehicles)) throw new Error("Fleet parking assignments are invalid.");

  const analysis = normalizeAnalysisSettings(record.analysis);
  if (!analysis) throw new Error("The project analysis settings are invalid.");
  if (typeof record.scene !== "object" || record.scene === null || Array.isArray(record.scene)) {
    throw new Error("The project scene is invalid.");
  }
  const scene = clone(record.scene) as SceneDocument;
  if (!Array.isArray(scene.objects)) throw new Error("The project scene is invalid.");
  if (!hasDefaultDepot(scene)) throw new Error("The project scene must contain the default depot.");

  return createProjectDocument(vehiclePresets, fleetVehicles, analysis, scene);
}
