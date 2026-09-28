import type { CurrentVehicleHolding, FleetVehicle } from "./contracts";
import { normalizeAnalysisSettings, normalizeFleetVehicle } from "./fleet";
import type { Transform } from "../scene/types";
import { copyPreset, normalizePreset, type VehiclePreset } from "../vehicles/types";

export const PROJECT_DOCUMENT_VERSION = 5 as const;

export type ProjectAnalysisSettings = ReturnType<typeof requiredAnalysis>;

export type ProjectDepot = {
  id: string;
  name: string;
  transform: Transform;
};

export type ProjectVehicle = Omit<FleetVehicle, "presetId" | "parkingLotId"> & {
  baselinePresetId: string | null;
  transform: Transform;
};

export type VehicleTransition = { year: number; targetPresetId: string };
export type ProjectVehiclePlan = { transitions: VehicleTransition[] };
export type ProjectScenario = {
  id: string;
  name: string;
  vehiclePlans: Record<string, ProjectVehiclePlan>;
};

export type ProjectDocumentV5 = {
  version: typeof PROJECT_DOCUMENT_VERSION;
  id: string;
  name: string;
  activeScenarioId: string;
  environment: { depot: ProjectDepot; vehicles: ProjectVehicle[] };
  vehiclePresets: VehiclePreset[];
  scenarios: ProjectScenario[];
  analysis: ProjectAnalysisSettings;
};

export const DEFAULT_PROJECT_ANALYSIS = {
  startYear: 2026,
  yearCount: 10,
  currency: "SGD",
  fuelPricePerLitre: 2.15,
  electricityPricePerKWh: 0.3,
  fuelEmissionsKgCo2ePerLitre: 2.7,
  electricityEmissionsKgCo2ePerKWh: 0.4,
  discountRate: 0.05,
} as const;

export const DEFAULT_DEPOT: ProjectDepot = {
  id: "default-project-depot",
  name: "Default depot",
  transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
};

const reservedIds = new Set(["__proto__", "constructor", "prototype"]);

function fail(path: string, message: string): never {
  throw new Error(`${path} ${message}`);
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail(path, "must be an object.");
  return value as Record<string, unknown>;
}

function identifier(value: unknown, path: string): string {
  if (typeof value !== "string" || !value.trim() || reservedIds.has(value)) fail(path, "must be a valid identifier.");
  return value;
}

function name(value: unknown, path: string): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 100) fail(path, "must be nonempty text of 100 characters or fewer.");
  return value.trim();
}

function finite(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) fail(path, "must be a finite number.");
  return value;
}

function vector(value: unknown, path: string, positive = false): [number, number, number] {
  if (!Array.isArray(value) || value.length !== 3) fail(path, "must contain three numbers.");
  const result = value.map((entry, index) => finite(entry, `${path}[${index}]`)) as [number, number, number];
  if (positive && result.some((entry) => entry <= 0)) fail(path, "must contain positive values.");
  return result;
}

function transform(value: unknown, path: string): Transform {
  const source = record(value, path);
  return {
    position: vector(source.position, `${path}.position`),
    rotation: vector(source.rotation, `${path}.rotation`),
    scale: vector(source.scale, `${path}.scale`, true),
  };
}

function requiredAnalysis(value: unknown = DEFAULT_PROJECT_ANALYSIS) {
  const source = record(value, "project.analysis");
  const legacy = normalizeAnalysisSettings(source);
  if (!legacy) fail("project.analysis", "is invalid.");
  const electricityPricePerKWh = finite(source.electricityPricePerKWh, "project.analysis.electricityPricePerKWh");
  const discountRate = finite(source.discountRate, "project.analysis.discountRate");
  if (electricityPricePerKWh < 0) fail("project.analysis.electricityPricePerKWh", "must be nonnegative.");
  if (discountRate < 0 || discountRate > 1) fail("project.analysis.discountRate", "must be between 0 and 1.");
  return { ...legacy, electricityPricePerKWh, discountRate };
}

function depot(value: unknown, path: string): ProjectDepot {
  const source = record(value, path);
  return { id: identifier(source.id, `${path}.id`), name: name(source.name, `${path}.name`), transform: transform(source.transform, `${path}.transform`) };
}

function projectVehicle(value: unknown, presetIds: ReadonlySet<string>, path: string): ProjectVehicle {
  const source = record(value, path);
  const baselinePresetId = source.baselinePresetId;
  const normalized = normalizeFleetVehicle({ ...source, presetId: baselinePresetId, parkingLotId: "parking-lot-01" }, presetIds);
  if (!normalized) fail(path, "is invalid.");
  const { presetId: _presetId, parkingLotId: _parkingLotId, ...vehicle } = normalized;
  return { ...vehicle, baselinePresetId: baselinePresetId as string | null, transform: transform(source.transform, `${path}.transform`) };
}

function unique(ids: readonly string[], path: string): void {
  if (new Set(ids).size !== ids.length) fail(path, "must not contain duplicate identifiers.");
}

function scenarios(value: unknown, vehicleIds: ReadonlySet<string>, presetIds: ReadonlySet<string>): ProjectScenario[] {
  if (!Array.isArray(value) || value.length === 0) fail("project.scenarios", "must contain at least one Scenario.");
  const normalized = value.map((entry, scenarioIndex): ProjectScenario => {
    const path = `project.scenarios[${scenarioIndex}]`;
    const source = record(entry, path);
    const rawPlans = record(source.vehiclePlans, `${path}.vehiclePlans`);
    const vehiclePlans = Object.fromEntries(Object.entries(rawPlans).map(([vehicleId, planValue]) => {
      identifier(vehicleId, `${path}.vehiclePlans key`);
      if (!vehicleIds.has(vehicleId)) fail(`${path}.vehiclePlans.${vehicleId}`, "does not resolve to a Project Vehicle.");
      const plan = record(planValue, `${path}.vehiclePlans.${vehicleId}`);
      if (!Array.isArray(plan.transitions)) fail(`${path}.vehiclePlans.${vehicleId}.transitions`, "must be an array.");
      const transitions = plan.transitions.map((transitionValue, transitionIndex): VehicleTransition => {
        const transitionPath = `${path}.vehiclePlans.${vehicleId}.transitions[${transitionIndex}]`;
        const transition = record(transitionValue, transitionPath);
        if (typeof transition.year !== "number" || !Number.isInteger(transition.year)) fail(`${transitionPath}.year`, "must be an integer.");
        const targetPresetId = identifier(transition.targetPresetId, `${transitionPath}.targetPresetId`);
        if (!presetIds.has(targetPresetId)) fail(`${transitionPath}.targetPresetId`, `does not resolve to Preset “${targetPresetId}”.`);
        return { year: transition.year, targetPresetId };
      });
      for (let index = 1; index < transitions.length; index += 1) {
        if (transitions[index - 1].year >= transitions[index].year) fail(`${path}.vehiclePlans.${vehicleId}.transitions`, "must use unique years in ascending order.");
      }
      return [vehicleId, { transitions }];
    }));
    return { id: identifier(source.id, `${path}.id`), name: name(source.name, `${path}.name`), vehiclePlans };
  });
  unique(normalized.map((scenario) => scenario.id), "project.scenarios");
  return normalized;
}

export function normalizeProjectV5(value: unknown): ProjectDocumentV5 {
  const source = record(value, "project");
  if (source.version !== PROJECT_DOCUMENT_VERSION) fail("project.version", `unsupported Project document version “${String(source.version)}”.`);
  if (!Array.isArray(source.vehiclePresets)) fail("project.vehiclePresets", "must be an array.");
  const vehiclePresets = source.vehiclePresets.map((entry, index) => {
    const normalized = normalizePreset(entry);
    if (!normalized) fail(`project.vehiclePresets[${index}]`, "is invalid.");
    return normalized;
  });
  unique(vehiclePresets.map((preset) => preset.id), "project.vehiclePresets");
  const presetIds = new Set(vehiclePresets.map((preset) => preset.id));
  const environment = record(source.environment, "project.environment");
  if (!Array.isArray(environment.vehicles)) fail("project.environment.vehicles", "must be an array.");
  const vehicles = environment.vehicles.map((entry, index) => projectVehicle(entry, presetIds, `project.environment.vehicles[${index}]`));
  unique(vehicles.map((vehicle) => vehicle.id), "project.environment.vehicles");
  const normalizedScenarios = scenarios(source.scenarios, new Set(vehicles.map((vehicle) => vehicle.id)), presetIds);
  const activeScenarioId = identifier(source.activeScenarioId, "project.activeScenarioId");
  if (!normalizedScenarios.some((scenario) => scenario.id === activeScenarioId)) fail("project.activeScenarioId", "must resolve to a Scenario in this Project.");
  return {
    version: PROJECT_DOCUMENT_VERSION,
    id: identifier(source.id, "project.id"),
    name: name(source.name, "project.name"),
    activeScenarioId,
    environment: { depot: depot(environment.depot, "project.environment.depot"), vehicles },
    vehiclePresets: vehiclePresets.map(copyPreset),
    scenarios: normalizedScenarios,
    analysis: requiredAnalysis(source.analysis),
  };
}

export function createProjectV5(input: {
  id: string;
  name: string;
  depot?: ProjectDepot;
  vehicles?: ProjectVehicle[];
  vehiclePresets?: VehiclePreset[];
  scenarios?: ProjectScenario[];
  activeScenarioId?: string;
  analysis?: ProjectAnalysisSettings;
}): ProjectDocumentV5 {
  const scenarios = input.scenarios ?? [{ id: `${input.id}-scenario-1`, name: "Plan A", vehiclePlans: {} }];
  return normalizeProjectV5({
    version: PROJECT_DOCUMENT_VERSION,
    id: input.id,
    name: input.name,
    activeScenarioId: input.activeScenarioId ?? scenarios[0]?.id,
    environment: { depot: structuredClone(input.depot ?? DEFAULT_DEPOT), vehicles: structuredClone(input.vehicles ?? []) },
    vehiclePresets: structuredClone(input.vehiclePresets ?? []),
    scenarios: structuredClone(scenarios),
    analysis: structuredClone(input.analysis ?? DEFAULT_PROJECT_ANALYSIS),
  });
}

export function copyProjectV5(document: ProjectDocumentV5): ProjectDocumentV5 {
  return normalizeProjectV5(structuredClone(document));
}

export type VehiclePlanReference = {
  scenarioId: string;
  vehicleId: string;
};

export function addVehicleTransition(
  document: ProjectDocumentV5,
  reference: VehiclePlanReference,
  transition: VehicleTransition,
): ProjectDocumentV5 {
  const { scenarioId, vehicleId } = reference;
  const scenario = document.scenarios.find((entry) => entry.id === scenarioId);
  if (!scenario) throw new Error(`Scenario “${scenarioId}” does not exist.`);
  if (!document.environment.vehicles.some((entry) => entry.id === vehicleId)) throw new Error(`Vehicle “${vehicleId}” does not exist.`);
  if (!document.vehiclePresets.some((entry) => entry.id === transition.targetPresetId)) throw new Error(`Preset “${transition.targetPresetId}” does not exist.`);
  const current = scenario.vehiclePlans[vehicleId]?.transitions ?? [];
  if (current.some((entry) => entry.year === transition.year)) throw new Error(`Vehicle “${vehicleId}” already has a transition in ${transition.year}.`);
  const transitions = [...current, { ...transition }].sort((left, right) => left.year - right.year);
  return normalizeProjectV5({
    ...document,
    scenarios: document.scenarios.map((entry) => entry.id === scenarioId
      ? { ...entry, vehiclePlans: { ...entry.vehiclePlans, [vehicleId]: { transitions } } }
      : entry),
  });
}

export function effectivePresetIdFor(
  document: ProjectDocumentV5,
  scenarioId: string,
  vehicleId: string,
  year: number,
): string | null | undefined {
  const vehicle = document.environment.vehicles.find((entry) => entry.id === vehicleId);
  const scenario = document.scenarios.find((entry) => entry.id === scenarioId);
  if (!vehicle || !scenario) return undefined;
  let presetId = vehicle.baselinePresetId;
  for (const transition of scenario.vehiclePlans[vehicleId]?.transitions ?? []) {
    if (transition.year > year) break;
    presetId = transition.targetPresetId;
  }
  return presetId;
}

function withVehicleTransitions(
  document: ProjectDocumentV5,
  reference: VehiclePlanReference,
  transitions: readonly VehicleTransition[],
): ProjectDocumentV5 {
  const { scenarioId, vehicleId } = reference;
  if (!document.environment.vehicles.some((entry) => entry.id === vehicleId)) throw new Error(`Vehicle “${vehicleId}” does not exist.`);
  if (!document.scenarios.some((entry) => entry.id === scenarioId)) throw new Error(`Scenario “${scenarioId}” does not exist.`);
  const sorted = transitions.map((entry) => ({ ...entry })).sort((left, right) => left.year - right.year);
  return normalizeProjectV5({
    ...document,
    scenarios: document.scenarios.map((scenario) => {
      if (scenario.id !== scenarioId) return scenario;
      const vehiclePlans = { ...scenario.vehiclePlans };
      if (sorted.length) vehiclePlans[vehicleId] = { transitions: sorted };
      else delete vehiclePlans[vehicleId];
      return { ...scenario, vehiclePlans };
    }),
  });
}

export function updateVehicleTransition(
  document: ProjectDocumentV5,
  reference: VehiclePlanReference,
  currentYear: number,
  transition: VehicleTransition,
): ProjectDocumentV5 {
  const { scenarioId, vehicleId } = reference;
  const current = document.scenarios.find((entry) => entry.id === scenarioId)?.vehiclePlans[vehicleId]?.transitions ?? [];
  if (!current.some((entry) => entry.year === currentYear)) throw new Error(`Vehicle “${vehicleId}” has no transition in ${currentYear}.`);
  return withVehicleTransitions(document, reference, current.map((entry) => entry.year === currentYear ? transition : entry));
}

export function removeVehicleTransition(
  document: ProjectDocumentV5,
  reference: VehiclePlanReference,
  year: number,
): ProjectDocumentV5 {
  const { scenarioId, vehicleId } = reference;
  const current = document.scenarios.find((entry) => entry.id === scenarioId)?.vehiclePlans[vehicleId]?.transitions ?? [];
  return withVehicleTransitions(document, reference, current.filter((entry) => entry.year !== year));
}

export function replaceVehicleTransitions(
  document: ProjectDocumentV5,
  reference: VehiclePlanReference,
  transitions: readonly VehicleTransition[],
): ProjectDocumentV5 {
  return withVehicleTransitions(document, reference, transitions);
}

export type { CurrentVehicleHolding };
