import { PROJECT_FLEET_CAPACITY } from "./depotLayout";
import type { Transform } from "../scene/types";
import { copyPreset, maxNameLength, normalizePreset, type VehiclePreset } from "../vehicles/types";

export const PROJECT_DOCUMENT_VERSION = 5 as const;

export type ProjectAnalysisSettings = ReturnType<typeof requiredAnalysis>;

export type ProjectDepot = {
  id: string;
  name: string;
  transform: Transform;
};

export type CurrentVehicleHolding =
  | { kind: "owned"; currentValue: number; endResidualValue: number }
  | { kind: "leased"; annualPayment: number; exitFee: number };

export type ProjectVehicle = {
  id: string;
  name: string;
  baselinePresetId: string | null;
  transform: Transform;
  annualKm: number;
  typicalDailyKm: number;
  operatingDays: number;
  utilisation: number;
  routePattern: "predictable" | "variable";
  returnsToDepot: boolean;
  depotDwellHours: number;
  externalChargingAccess: boolean;
  replacementYear: number | null;
  currentHolding: CurrentVehicleHolding;
};

export type VehicleTransition = { year: number; targetPresetId: string };
export type ProjectVehiclePlan = { transitions: VehicleTransition[] };
export type ProjectScenario = {
  id: string;
  name: string;
  vehiclePlans: Record<string, ProjectVehiclePlan>;
};

export type ProjectDocument = {
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
const routePatterns = ["predictable", "variable"] as const;

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

function amount(value: unknown, path: string): number {
  const result = finite(value, path);
  if (result < 0) fail(path, "must be nonnegative.");
  return result;
}

function integer(value: unknown, path: string, minimum?: number, maximum?: number): number {
  const result = finite(value, path);
  if (!Number.isInteger(result) || (minimum !== undefined && result < minimum) || (maximum !== undefined && result > maximum)) {
    fail(path, "must be an integer in the supported range.");
  }
  return result;
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
  const currency = name(source.currency, "project.analysis.currency");
  if (currency.length > 8) fail("project.analysis.currency", "must contain eight characters or fewer.");
  const electricityPricePerKWh = amount(source.electricityPricePerKWh, "project.analysis.electricityPricePerKWh");
  const discountRate = finite(source.discountRate, "project.analysis.discountRate");
  if (discountRate < 0 || discountRate > 1) fail("project.analysis.discountRate", "must be between 0 and 1.");
  return {
    startYear: integer(source.startYear, "project.analysis.startYear"),
    yearCount: integer(source.yearCount, "project.analysis.yearCount", 1),
    currency,
    fuelPricePerLitre: amount(source.fuelPricePerLitre, "project.analysis.fuelPricePerLitre"),
    electricityPricePerKWh,
    fuelEmissionsKgCo2ePerLitre: amount(source.fuelEmissionsKgCo2ePerLitre, "project.analysis.fuelEmissionsKgCo2ePerLitre"),
    electricityEmissionsKgCo2ePerKWh: amount(source.electricityEmissionsKgCo2ePerKWh, "project.analysis.electricityEmissionsKgCo2ePerKWh"),
    discountRate,
  };
}

function depot(value: unknown, path: string): ProjectDepot {
  const source = record(value, path);
  return { id: identifier(source.id, `${path}.id`), name: name(source.name, `${path}.name`), transform: transform(source.transform, `${path}.transform`) };
}

function projectVehicle(value: unknown, presetIds: ReadonlySet<string>, path: string): ProjectVehicle {
  const source = record(value, path);
  const baselinePresetId = source.baselinePresetId;
  if (baselinePresetId !== null && (typeof baselinePresetId !== "string" || !presetIds.has(baselinePresetId))) {
    fail(`${path}.baselinePresetId`, "must be null or resolve to a Project Preset.");
  }
  if (!routePatterns.includes(source.routePattern as ProjectVehicle["routePattern"])) fail(`${path}.routePattern`, "is invalid.");
  if (typeof source.returnsToDepot !== "boolean") fail(`${path}.returnsToDepot`, "must be boolean.");
  if (typeof source.externalChargingAccess !== "boolean") fail(`${path}.externalChargingAccess`, "must be boolean.");
  const depotDwellHours = amount(source.depotDwellHours, `${path}.depotDwellHours`);
  if (depotDwellHours > 24) fail(`${path}.depotDwellHours`, "must not exceed 24.");
  const utilisation = finite(source.utilisation, `${path}.utilisation`);
  if (utilisation < 0 || utilisation > 1) fail(`${path}.utilisation`, "must be between 0 and 1.");
  const replacementYear = source.replacementYear;
  if (replacementYear !== null && (typeof replacementYear !== "number" || !Number.isInteger(replacementYear))) {
    fail(`${path}.replacementYear`, "must be null or an integer year.");
  }
  const holding = record(source.currentHolding, `${path}.currentHolding`);
  const currentHolding: CurrentVehicleHolding = holding.kind === "owned"
    ? { kind: "owned", currentValue: amount(holding.currentValue, `${path}.currentHolding.currentValue`), endResidualValue: amount(holding.endResidualValue, `${path}.currentHolding.endResidualValue`) }
    : holding.kind === "leased"
      ? { kind: "leased", annualPayment: amount(holding.annualPayment, `${path}.currentHolding.annualPayment`), exitFee: amount(holding.exitFee, `${path}.currentHolding.exitFee`) }
      : fail(`${path}.currentHolding.kind`, "is invalid.");
  return {
    id: identifier(source.id, `${path}.id`),
    name: name(source.name, `${path}.name`).slice(0, maxNameLength),
    baselinePresetId: baselinePresetId as string | null,
    transform: transform(source.transform, `${path}.transform`),
    annualKm: amount(source.annualKm, `${path}.annualKm`),
    typicalDailyKm: amount(source.typicalDailyKm, `${path}.typicalDailyKm`),
    operatingDays: integer(source.operatingDays, `${path}.operatingDays`, 0, 366),
    utilisation,
    routePattern: source.routePattern as ProjectVehicle["routePattern"],
    returnsToDepot: source.returnsToDepot,
    depotDwellHours,
    externalChargingAccess: source.externalChargingAccess,
    replacementYear: replacementYear as number | null,
    currentHolding,
  };
}

function unique(ids: readonly string[], path: string): void {
  if (new Set(ids).size !== ids.length) fail(path, "must not contain duplicate identifiers.");
}

function scenarios(
  value: unknown,
  vehicleIds: ReadonlySet<string>,
  presetIds: ReadonlySet<string>,
): ProjectScenario[] {
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

export function normalizeProject(value: unknown): ProjectDocument {
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
  if (environment.vehicles.length > PROJECT_FLEET_CAPACITY) {
    fail("project.environment.vehicles", `exceeds the fleet capacity of ${PROJECT_FLEET_CAPACITY}.`);
  }
  const vehicles = environment.vehicles.map((entry, index) => projectVehicle(entry, presetIds, `project.environment.vehicles[${index}]`));
  unique(vehicles.map((vehicle) => vehicle.id), "project.environment.vehicles");
  const analysis = requiredAnalysis(source.analysis);
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
    analysis,
  };
}

export function createProject(input: {
  id: string;
  name: string;
  depot?: ProjectDepot;
  vehicles?: ProjectVehicle[];
  vehiclePresets?: VehiclePreset[];
  scenarios?: ProjectScenario[];
  activeScenarioId?: string;
  analysis?: ProjectAnalysisSettings;
}): ProjectDocument {
  const scenarios = input.scenarios ?? [{ id: `${input.id}-scenario-1`, name: "Plan A", vehiclePlans: {} }];
  return normalizeProject({
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

export function copyProject(document: ProjectDocument): ProjectDocument {
  return normalizeProject(structuredClone(document));
}

export type VehiclePlanReference = {
  scenarioId: string;
  vehicleId: string;
};

export type VehiclePresetReference = { kind: "baseline" | "transition"; label: string };

/** Lists the authoritative Project fields that prevent a Preset from being deleted. */
export function vehiclePresetReferences(document: ProjectDocument, presetId: string): VehiclePresetReference[] {
  const vehicles = new Map(document.environment.vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const references: VehiclePresetReference[] = [];
  for (const vehicle of document.environment.vehicles) {
    if (vehicle.baselinePresetId === presetId) references.push({ kind: "baseline", label: `Baseline for ${vehicle.name} (${vehicle.id})` });
  }
  for (const scenario of document.scenarios) {
    for (const [vehicleId, plan] of Object.entries(scenario.vehiclePlans)) {
      const vehicle = vehicles.get(vehicleId);
      for (const transition of plan.transitions) {
        if (transition.targetPresetId === presetId) {
          references.push({
            kind: "transition",
            label: `Transition for ${vehicle?.name ?? vehicleId} (${vehicleId}) in ${scenario.name}, ${transition.year}`,
          });
        }
      }
    }
  }
  return references;
}

export function deleteVehiclePreset(document: ProjectDocument, presetId: string): ProjectDocument {
  const preset = document.vehiclePresets.find((entry) => entry.id === presetId);
  if (!preset) return document;
  const references = vehiclePresetReferences(document, presetId);
  if (references.length) {
    throw new Error(`Cannot delete Preset “${preset.name}”; it is still used by: ${references.map((reference) => reference.label).join("; ")}.`);
  }
  return normalizeProject({ ...document, vehiclePresets: document.vehiclePresets.filter((entry) => entry.id !== presetId) });
}

export function addVehicleTransition(
  document: ProjectDocument,
  reference: VehiclePlanReference,
  transition: VehicleTransition,
): ProjectDocument {
  const { scenarioId, vehicleId } = reference;
  const scenario = document.scenarios.find((entry) => entry.id === scenarioId);
  if (!scenario) throw new Error(`Scenario “${scenarioId}” does not exist.`);
  if (!document.environment.vehicles.some((entry) => entry.id === vehicleId)) throw new Error(`Vehicle “${vehicleId}” does not exist.`);
  if (!document.vehiclePresets.some((entry) => entry.id === transition.targetPresetId)) throw new Error(`Preset “${transition.targetPresetId}” does not exist.`);
  const current = scenario.vehiclePlans[vehicleId]?.transitions ?? [];
  if (current.some((entry) => entry.year === transition.year)) throw new Error(`Vehicle “${vehicleId}” already has a transition in ${transition.year}.`);
  const transitions = [...current, { ...transition }].sort((left, right) => left.year - right.year);
  return normalizeProject({
    ...document,
    scenarios: document.scenarios.map((entry) => entry.id === scenarioId
      ? { ...entry, vehiclePlans: { ...entry.vehiclePlans, [vehicleId]: { transitions } } }
      : entry),
  });
}

export function effectivePresetIdFor(
  document: ProjectDocument,
  scenarioId: string | null,
  vehicleId: string,
  year: number,
): string | null | undefined {
  const vehicle = document.environment.vehicles.find((entry) => entry.id === vehicleId);
  const scenario = scenarioId === null ? undefined : document.scenarios.find((entry) => entry.id === scenarioId);
  if (!vehicle || (scenarioId !== null && !scenario)) return undefined;
  let presetId = vehicle.baselinePresetId;
  for (const transition of scenario?.vehiclePlans[vehicleId]?.transitions ?? []) {
    if (transition.year > year) break;
    presetId = transition.targetPresetId;
  }
  return presetId;
}

function withVehicleTransitions(
  document: ProjectDocument,
  reference: VehiclePlanReference,
  transitions: readonly VehicleTransition[],
): ProjectDocument {
  const { scenarioId, vehicleId } = reference;
  if (!document.environment.vehicles.some((entry) => entry.id === vehicleId)) throw new Error(`Vehicle “${vehicleId}” does not exist.`);
  if (!document.scenarios.some((entry) => entry.id === scenarioId)) throw new Error(`Scenario “${scenarioId}” does not exist.`);
  const sorted = transitions.map((entry) => ({ ...entry })).sort((left, right) => left.year - right.year);
  return normalizeProject({
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
  document: ProjectDocument,
  reference: VehiclePlanReference,
  currentYear: number,
  transition: VehicleTransition,
): ProjectDocument {
  const { scenarioId, vehicleId } = reference;
  const current = document.scenarios.find((entry) => entry.id === scenarioId)?.vehiclePlans[vehicleId]?.transitions ?? [];
  if (!current.some((entry) => entry.year === currentYear)) throw new Error(`Vehicle “${vehicleId}” has no transition in ${currentYear}.`);
  return withVehicleTransitions(document, reference, current.map((entry) => entry.year === currentYear ? transition : entry));
}

export function removeVehicleTransition(
  document: ProjectDocument,
  reference: VehiclePlanReference,
  year: number,
): ProjectDocument {
  const { scenarioId, vehicleId } = reference;
  const current = document.scenarios.find((entry) => entry.id === scenarioId)?.vehiclePlans[vehicleId]?.transitions ?? [];
  return withVehicleTransitions(document, reference, current.filter((entry) => entry.year !== year));
}

export function replaceVehicleTransitions(
  document: ProjectDocument,
  reference: VehiclePlanReference,
  transitions: readonly VehicleTransition[],
): ProjectDocument {
  return withVehicleTransitions(document, reference, transitions);
}
