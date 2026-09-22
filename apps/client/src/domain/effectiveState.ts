import {
  analysisEndYear,
  type AnalysisSettings,
  type EffectiveVehicleState,
  type FleetVehicle,
  type M1ProjectDocument,
  type ScenarioVehiclePlan,
  type SimulationInput,
  type VehicleTransitionEvent,
} from "./contracts";

/**
 * The single transition rule (T03).
 *
 * A vehicle runs on its project-owned current preset before the scenario's
 * transition year, and on the scenario's target preset from that year onward.
 * T04, T05, T07 and the 3D views all read this rule from here; none of them
 * reimplement it. See docs/tech/m1-integration-contract.md.
 */

export type ResolvedVehiclePlan = {
  transitionYear: number | null;
  /** Null when the scenario names no target, or names one this project no longer has. */
  targetPresetId: string | null;
};

export type PlanRecord = Readonly<Record<string, ScenarioVehiclePlan>>;

const presetIdsOf = (project: M1ProjectDocument): ReadonlySet<string> => new Set(project.vehiclePresets.map((preset) => preset.id));

/**
 * Reads a scenario's decision for one vehicle. An absent or dangling entry is
 * not a transition: a scenario that says nothing plans nothing, so no target is
 * ever invented on the vehicle's behalf.
 */
export function resolveVehiclePlan(plan: ScenarioVehiclePlan | undefined, presetIds: ReadonlySet<string>): ResolvedVehiclePlan {
  const targetPresetId = plan?.targetPresetId && presetIds.has(plan.targetPresetId) ? plan.targetPresetId : null;
  return { transitionYear: plan?.transitionYear ?? null, targetPresetId };
}

/** A plan only changes anything when it has both parts and names a different preset. */
export function planChangesPreset(vehicle: FleetVehicle, plan: ResolvedVehiclePlan): boolean {
  return plan.transitionYear !== null && plan.targetPresetId !== null && plan.targetPresetId !== vehicle.currentPresetId;
}

export function effectiveVehicleState(vehicle: FleetVehicle, plan: ScenarioVehiclePlan | undefined, presetIds: ReadonlySet<string>, year: number): EffectiveVehicleState {
  const resolved = resolveVehiclePlan(plan, presetIds);
  const changes = planChangesPreset(vehicle, resolved);
  const transitioned = changes && year >= (resolved.transitionYear as number);
  return {
    vehicleId: vehicle.id,
    presetId: transitioned ? (resolved.targetPresetId as string) : vehicle.currentPresetId,
    transitioned,
    transitionYear: changes ? resolved.transitionYear : null,
  };
}

export function effectiveFleetState(vehicles: readonly FleetVehicle[], plans: PlanRecord, presetIds: ReadonlySet<string>, year: number): EffectiveVehicleState[] {
  return vehicles.map((vehicle) => effectiveVehicleState(vehicle, plans[vehicle.id], presetIds, year));
}

/**
 * The scenario's vehicle changes as timeline events. Only transitions that both
 * change the preset and land inside the analysis period are projected, so the
 * timeline never advertises a change it cannot scrub to.
 */
export function transitionEvents(vehicles: readonly FleetVehicle[], plans: PlanRecord, presetIds: ReadonlySet<string>, settings: AnalysisSettings): VehicleTransitionEvent[] {
  const endYear = analysisEndYear(settings);
  const events: VehicleTransitionEvent[] = [];
  for (const vehicle of vehicles) {
    const resolved = resolveVehiclePlan(plans[vehicle.id], presetIds);
    if (!planChangesPreset(vehicle, resolved)) continue;
    const year = resolved.transitionYear as number;
    if (year < settings.startYear || year > endYear) continue;
    events.push({ kind: "vehicle-transition", year, vehicleId: vehicle.id, fromPresetId: vehicle.currentPresetId, toPresetId: resolved.targetPresetId as string });
  }
  // Stable ordering keeps rendered event lists and snapshots deterministic.
  return events.sort((a, b) => a.year - b.year || a.vehicleId.localeCompare(b.vehicleId));
}

/** Document-level wrappers for callers holding a whole simulation input. */
export function effectiveFleetStateFor(input: SimulationInput, year: number): EffectiveVehicleState[] {
  return effectiveFleetState(input.fleetVehicles, input.scenario.vehiclePlans, presetIdsOf(input.project), year);
}

export function transitionEventsFor(input: SimulationInput): VehicleTransitionEvent[] {
  return transitionEvents(input.fleetVehicles, input.scenario.vehiclePlans, presetIdsOf(input.project), input.project.analysis);
}

export function effectivePresetFor(input: SimulationInput, vehicleId: string, year: number) {
  const vehicle = input.fleetVehicles.find((item) => item.id === vehicleId);
  if (!vehicle) return undefined;
  const state = effectiveVehicleState(vehicle, input.scenario.vehiclePlans[vehicleId], presetIdsOf(input.project), year);
  return input.project.vehiclePresets.find((preset) => preset.id === state.presetId);
}

export { presetIdsOf };
