import type { AnalysisSettings, FleetVehicle } from "./contracts";
import { DEFAULT_PARKING_LOTS, parkingLotById } from "./depotLayout";
import {
  createProjectV5,
  DEFAULT_DEPOT,
  type ProjectAnalysisSettings,
  type ProjectDocumentV5,
  type ProjectScenario,
  type ProjectVehicle,
} from "./projectV5";
import { createScenarioDocument } from "./scenario";
import { createDefaultProjectScene, DEFAULT_DEPOT_OBJECT_ID } from "../scene/defaultProjectScene";
import { copyTransform, type SceneDocument } from "../scene/types";
import type { WorkspaceScenario } from "../project/types";
import type { VehiclePreset } from "../vehicles/types";

function v5Analysis(analysis: AnalysisSettings, scenarios: readonly WorkspaceScenario[], activeScenarioId: string): ProjectAnalysisSettings {
  const assumptions = scenarios.find((scenario) => scenario.id === activeScenarioId)?.document.assumptions;
  return {
    ...analysis,
    electricityPricePerKWh: assumptions?.depotElectricityPricePerKWh ?? 0.3,
    discountRate: 0.05,
  };
}

function v5Scenario(scenario: WorkspaceScenario): ProjectScenario {
  const vehiclePlans = Object.fromEntries(Object.entries(scenario.document.vehiclePlans).flatMap(([vehicleId, plan]) => {
    if (plan.transitionYear === null || plan.transitionYear === undefined || !plan.targetPresetId) return [];
    return [[vehicleId, { transitions: [{ year: plan.transitionYear, targetPresetId: plan.targetPresetId }] }]];
  }));
  return { id: scenario.id, name: scenario.name, vehiclePlans };
}

function v5Vehicle(vehicle: FleetVehicle, existing?: ProjectVehicle): ProjectVehicle {
  const { presetId, parkingLotId, ...operational } = vehicle;
  return {
    ...structuredClone(operational),
    baselinePresetId: presetId,
    transform: copyTransform(existing?.transform ?? parkingLotById(parkingLotId)?.transform ?? DEFAULT_PARKING_LOTS[0].transform),
  };
}

export function projectV5FromLegacy(input: {
  id: string;
  name: string;
  scene: SceneDocument;
  presets: readonly VehiclePreset[];
  fleet: readonly FleetVehicle[];
  analysis: AnalysisSettings;
  scenarios: readonly WorkspaceScenario[];
  activeScenarioId: string;
}): ProjectDocumentV5 {
  const depotObject = input.scene.objects.find((object) => object.id === DEFAULT_DEPOT_OBJECT_ID);
  const vehicles = input.fleet.map((vehicle) => v5Vehicle(vehicle));
  return createProjectV5({
    id: input.id,
    name: input.name,
    depot: { ...structuredClone(DEFAULT_DEPOT), transform: copyTransform(depotObject?.transform ?? DEFAULT_DEPOT.transform) },
    vehicles,
    vehiclePresets: [...input.presets],
    scenarios: input.scenarios.map(v5Scenario),
    activeScenarioId: input.activeScenarioId,
    analysis: v5Analysis(input.analysis, input.scenarios, input.activeScenarioId),
  });
}

export function mergeLegacyProjectData(
  document: ProjectDocumentV5,
  input: Pick<ReturnType<typeof legacyProjectView>, "scene" | "presets" | "fleet" | "analysis">,
): ProjectDocumentV5 {
  const depotObject = input.scene.objects.find((object) => object.id === DEFAULT_DEPOT_OBJECT_ID);
  const existingVehicles = new Map(document.environment.vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const vehicleIds = new Set(input.fleet.map((vehicle) => vehicle.id));
  return createProjectV5({
    id: document.id,
    name: document.name,
    depot: {
      ...document.environment.depot,
      transform: copyTransform(depotObject?.transform ?? document.environment.depot.transform),
    },
    vehicles: input.fleet.map((vehicle) => v5Vehicle(vehicle, existingVehicles.get(vehicle.id))),
    vehiclePresets: input.presets,
    scenarios: document.scenarios.map((scenario) => ({
      ...scenario,
      vehiclePlans: Object.fromEntries(Object.entries(scenario.vehiclePlans).filter(([vehicleId]) => vehicleIds.has(vehicleId))),
    })),
    activeScenarioId: document.activeScenarioId,
    analysis: { ...document.analysis, ...input.analysis },
  });
}

export function legacyProjectView(document: ProjectDocumentV5, revision: number): {
  scene: SceneDocument;
  presets: VehiclePreset[];
  fleet: FleetVehicle[];
  analysis: AnalysisSettings;
  scenarios: WorkspaceScenario[];
} {
  const scene = createDefaultProjectScene();
  scene.objects = scene.objects.map((object) => object.id === DEFAULT_DEPOT_OBJECT_ID
    ? { ...object, name: document.environment.depot.name, transform: copyTransform(document.environment.depot.transform) }
    : object);
  const fleet = document.environment.vehicles.map((vehicle, index): FleetVehicle => {
    const { baselinePresetId, transform: _transform, ...operational } = vehicle;
    return {
      ...structuredClone(operational),
      presetId: baselinePresetId,
      parkingLotId: DEFAULT_PARKING_LOTS[index]?.id ?? DEFAULT_PARKING_LOTS[0].id,
    };
  });
  const scenarios = document.scenarios.map((scenario, position): WorkspaceScenario => ({
    id: scenario.id,
    projectId: document.id,
    name: scenario.name,
    position,
    revision,
    document: createScenarioDocument(Object.fromEntries(Object.entries(scenario.vehiclePlans).flatMap(([vehicleId, plan]) => {
      const transition = plan.transitions[0];
      return transition ? [[vehicleId, { transitionYear: transition.year, targetPresetId: transition.targetPresetId }]] : [];
    }))),
  }));
  const { electricityPricePerKWh: _electricityPricePerKWh, discountRate: _discountRate, ...analysis } = document.analysis;
  return { scene, presets: structuredClone(document.vehiclePresets), fleet, analysis, scenarios };
}
