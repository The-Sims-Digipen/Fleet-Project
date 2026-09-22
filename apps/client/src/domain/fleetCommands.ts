import type { M1ProjectDocument, M1ScenarioDocument, SimulationInput } from "./contracts";
import { createProjectDocument } from "./projectDocument";
import { findPresetReferences, findVehiclePlanReferences, type PresetReference, type ScenarioPlans, type VehiclePlanReference } from "./references";
import { useFleetStore } from "../state/fleetStore";
import { usePresetStore } from "../state/presetStore";
import { useProjectStore } from "../state/projectStore";

/**
 * Domain edits that span more than one store (T03).
 *
 * The fleet is project-owned and transition plans are scenario-owned, so
 * deleting a vehicle or a preset has to consider both. Keeping these commands
 * here means the stores stay independent while the contract's reference rules
 * are still enforced in one place.
 */

/** Every scenario in the project, across all of its worlds. */
export function projectScenarioPlans(): ScenarioPlans[] {
  return useProjectStore.getState().worlds.flatMap((world) =>
    world.scenarios.map((scenario) => ({ id: scenario.id, name: scenario.name, vehiclePlans: scenario.document.vehiclePlans })));
}

/** Scenario plan entries that deleting this vehicle would also remove. */
export function vehicleDeletionImpact(vehicleId: string): VehiclePlanReference[] {
  return findVehiclePlanReferences(vehicleId, projectScenarioPlans());
}

/**
 * Removes a fleet vehicle and every scenario plan entry keyed by it. The
 * contract requires this to be one domain edit, so no intermediate state ever
 * has a plan pointing at a vehicle the project no longer has.
 */
export function deleteFleetVehicle(vehicleId: string): void {
  useProjectStore.getState().removeVehiclePlans(vehicleId);
  useFleetStore.getState().removeVehicle(vehicleId);
}

/** Fleet and scenario references that must be cleared before this preset can go. */
export function presetDeletionImpact(presetId: string): PresetReference[] {
  return findPresetReferences(presetId, useFleetStore.getState().vehicles, projectScenarioPlans());
}

export type PresetDeletion = { ok: true } | { ok: false; references: PresetReference[] };

/**
 * Deletes a preset only when nothing still points at it. A blocked deletion
 * returns the references so the UI can list what to reassign first.
 */
export function deleteVehiclePreset(presetId: string): PresetDeletion {
  const references = presetDeletionImpact(presetId);
  if (references.length) return { ok: false, references };
  usePresetStore.getState().deletePreset(presetId);
  return { ok: true };
}

/** The project-owned authoritative inputs, assembled for T01, T05 and T07. */
export function currentProjectDocument(): M1ProjectDocument {
  const fleet = useFleetStore.getState();
  return createProjectDocument(usePresetStore.getState().presets, fleet.vehicles, fleet.analysis);
}

export function activeScenarioDocument(): M1ScenarioDocument | undefined {
  const project = useProjectStore.getState();
  return project.scenarios.find((scenario) => scenario.id === project.activeScenarioId)?.document ?? project.scenarios[0]?.document;
}

/** The complete deterministic input pair T05 consumes, or undefined with no scenario. */
export function currentSimulationInput(): SimulationInput | undefined {
  const scenario = activeScenarioDocument();
  return scenario ? { project: currentProjectDocument(), scenario } : undefined;
}
