import { analysisEndYear, type FleetVehicle, type M1ProjectDocument, type ScenarioVehiclePlan } from "./contracts";
import { isYearInPeriod } from "./fleet";

/**
 * Reference integrity between presets, fleet vehicles and scenario plans (T03).
 *
 * The rules come from docs/tech/m1-integration-contract.md: a preset in use
 * cannot be deleted silently, and deleting a vehicle takes its scenario plan
 * entries with it as one edit. These helpers report what is affected so the UI
 * can show it; they never mutate a store.
 */

/** The scenario data reference checks need, without depending on workspace types. */
export type ScenarioPlans = {
  id: string;
  name: string;
  vehiclePlans: Readonly<Record<string, ScenarioVehiclePlan>>;
};

export type PresetReference =
  | { kind: "fleet-current"; vehicleId: string; vehicleName: string }
  | { kind: "scenario-target"; scenarioId: string; scenarioName: string; vehicleId: string };

export type VehiclePlanReference = {
  scenarioId: string;
  scenarioName: string;
  plan: ScenarioVehiclePlan;
};

/** Every place a preset is still pointed at, so deletion can be refused with reasons. */
export function findPresetReferences(presetId: string, vehicles: readonly FleetVehicle[], scenarios: readonly ScenarioPlans[]): PresetReference[] {
  const references: PresetReference[] = [];
  for (const vehicle of vehicles) {
    if (vehicle.currentPresetId === presetId) references.push({ kind: "fleet-current", vehicleId: vehicle.id, vehicleName: vehicle.name });
  }
  for (const scenario of scenarios) {
    for (const [vehicleId, plan] of Object.entries(scenario.vehiclePlans)) {
      if (plan.targetPresetId === presetId) references.push({ kind: "scenario-target", scenarioId: scenario.id, scenarioName: scenario.name, vehicleId });
    }
  }
  return references;
}

/** One readable line per reference, for the confirmation the contract requires. */
export function describePresetReference(reference: PresetReference): string {
  return reference.kind === "fleet-current"
    ? `${reference.vehicleId} · ${reference.vehicleName} uses it as its current preset`
    : `${reference.scenarioName} targets it for ${reference.vehicleId}`;
}

/** Scenario plan entries that would be removed along with a fleet vehicle. */
export function findVehiclePlanReferences(vehicleId: string, scenarios: readonly ScenarioPlans[]): VehiclePlanReference[] {
  const references: VehiclePlanReference[] = [];
  for (const scenario of scenarios) {
    const plan = scenario.vehiclePlans[vehicleId];
    if (plan) references.push({ scenarioId: scenario.id, scenarioName: scenario.name, plan });
  }
  return references;
}

/** A copy of one scenario's plans without the given vehicle. Never mutates the input. */
export function withoutVehiclePlan(plans: Readonly<Record<string, ScenarioVehiclePlan>>, vehicleId: string): Record<string, ScenarioVehiclePlan> {
  const rest = { ...plans };
  delete rest[vehicleId];
  return rest;
}

/**
 * Every invariant violation in one depot and its scenarios, as readable
 * messages. The fleet is the depot's own; presets come from the project.
 * An empty array means the workspace satisfies the contract's reference rules.
 */
export function findReferenceIssues(project: M1ProjectDocument, fleetVehicles: readonly FleetVehicle[], scenarios: readonly ScenarioPlans[]): string[] {
  const issues: string[] = [];
  const presetIds = new Set<string>();
  for (const preset of project.vehiclePresets) {
    if (presetIds.has(preset.id)) issues.push(`Preset id "${preset.id}" is used more than once.`);
    presetIds.add(preset.id);
  }

  const vehicleIds = new Set<string>();
  for (const vehicle of fleetVehicles) {
    if (vehicleIds.has(vehicle.id)) issues.push(`Vehicle id "${vehicle.id}" is used more than once.`);
    vehicleIds.add(vehicle.id);
    if (!presetIds.has(vehicle.currentPresetId)) issues.push(`${vehicle.id} references missing preset "${vehicle.currentPresetId}".`);
    if (!isYearInPeriod(project.analysis, vehicle.replacementYear)) {
      issues.push(`${vehicle.id} has a replacement year outside ${project.analysis.startYear}-${analysisEndYear(project.analysis)}.`);
    }
  }

  for (const scenario of scenarios) {
    for (const [vehicleId, plan] of Object.entries(scenario.vehiclePlans)) {
      if (!vehicleIds.has(vehicleId)) issues.push(`${scenario.name} plans for missing vehicle "${vehicleId}".`);
      if (plan.targetPresetId !== undefined && !presetIds.has(plan.targetPresetId)) {
        issues.push(`${scenario.name} targets missing preset "${plan.targetPresetId}" for ${vehicleId}.`);
      }
      if (!isYearInPeriod(project.analysis, plan.transitionYear)) {
        issues.push(`${scenario.name} sets a transition year outside ${project.analysis.startYear}-${analysisEndYear(project.analysis)} for ${vehicleId}.`);
      }
    }
  }
  return issues;
}
