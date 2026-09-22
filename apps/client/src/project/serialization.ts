import {
  M1_PROJECT_DOCUMENT_VERSION,
  M1_SCENARIO_DOCUMENT_VERSION,
  analysisEndYear,
  type AnalysisSettings,
  type FleetVehicle,
  type M1ProjectDocument,
  type M1ScenarioDocument,
  type M1VehiclePreset,
  type ScenarioAssumptions,
  type ScenarioVehiclePlan,
} from "../domain/contracts";
import type { Appearance, SceneDocument, SceneObject, Transform, Vector3 } from "../scene/types";
import { normalizePreset } from "../vehicles/types";
import type {
  WorkspaceRecord,
  WorkspaceSaveInput,
  WorldRecord,
} from "./types";

const reservedIds = new Set(["__proto__", "constructor", "prototype"]);
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export const LEGACY_ANALYSIS_DEFAULTS: AnalysisSettings = {
  startYear: 2026,
  yearCount: 10,
  currency: "SGD",
  fuelPricePerLitre: 0,
  fuelEmissionsKgCo2ePerLitre: 0,
  electricityEmissionsKgCo2ePerKWh: 0,
};

export const LEGACY_SCENARIO_ASSUMPTION_DEFAULTS: ScenarioAssumptions = {
  chargingStrategy: "external",
  depotChargingShare: 0,
  depotElectricityPricePerKWh: 0,
  externalElectricityPricePerKWh: 0,
};

export class ProjectValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectValidationError";
  }
}

function fail(path: string, message: string): never {
  throw new ProjectValidationError(`${path}: ${message}`);
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail(path, "must be an object.");
  return value as Record<string, unknown>;
}

function text(value: unknown, path: string, maxLength = 100): string {
  if (typeof value !== "string" || !value.trim()) fail(path, "must be nonempty text.");
  const normalized = value.trim();
  if (normalized.length > maxLength) fail(path, `must be ${maxLength} characters or fewer.`);
  return normalized;
}

function id(value: unknown, path: string): string {
  const normalized = text(value, path);
  if (reservedIds.has(normalized)) fail(path, "uses a reserved identifier.");
  return normalized;
}

function finite(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) fail(path, "must be a finite number.");
  return value;
}

function nonnegative(value: unknown, path: string): number {
  const normalized = finite(value, path);
  if (normalized < 0) fail(path, "must be nonnegative.");
  return normalized;
}

function integer(value: unknown, path: string): number {
  const normalized = finite(value, path);
  if (!Number.isInteger(normalized)) fail(path, "must be an integer.");
  return normalized;
}

function boolean(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") fail(path, "must be true or false.");
  return value;
}

function unique(values: readonly string[], path: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) fail(path, `contains duplicate identifier “${value}”.`);
    seen.add(value);
  }
}

function currentPreset(value: unknown, path: string): M1VehiclePreset {
  const source = record(value, path);
  const base = normalizePreset(source);
  if (!base) fail(path, "contains invalid base vehicle-preset fields.");
  const range = source.rangeKm === null ? null : nonnegative(source.rangeKm, `${path}.rangeKm`);
  const chargingEfficiency = finite(source.chargingEfficiency, `${path}.chargingEfficiency`);
  if (chargingEfficiency <= 0 || chargingEfficiency > 1) fail(`${path}.chargingEfficiency`, "must be greater than 0 and at most 1.");

  const acquisition = record(source.acquisition, `${path}.acquisition`);
  if (acquisition.kind === "owned") {
    return {
      ...base,
      maintenanceCostPerYear: nonnegative(source.maintenanceCostPerYear, `${path}.maintenanceCostPerYear`),
      rangeKm: range,
      chargingEfficiency,
      acquisition: { kind: "owned", endResidualValue: nonnegative(acquisition.endResidualValue, `${path}.acquisition.endResidualValue`) },
    };
  }
  if (acquisition.kind === "leased") {
    return {
      ...base,
      maintenanceCostPerYear: nonnegative(source.maintenanceCostPerYear, `${path}.maintenanceCostPerYear`),
      rangeKm: range,
      chargingEfficiency,
      acquisition: {
        kind: "leased",
        annualPayment: nonnegative(acquisition.annualPayment, `${path}.acquisition.annualPayment`),
        exitFee: nonnegative(acquisition.exitFee, `${path}.acquisition.exitFee`),
      },
    };
  }
  return fail(`${path}.acquisition.kind`, "must be “owned” or “leased”.");
}

function legacyPreset(value: unknown, path: string): M1VehiclePreset {
  const base = normalizePreset(value);
  if (!base) fail(path, "contains an invalid legacy vehicle preset.");
  return {
    ...base,
    maintenanceCostPerYear: 0,
    rangeKm: null,
    chargingEfficiency: 1,
    acquisition: { kind: "owned", endResidualValue: 0 },
  };
}

function analysisSettings(value: unknown, path: string): AnalysisSettings {
  const source = record(value, path);
  const startYear = integer(source.startYear, `${path}.startYear`);
  const yearCount = integer(source.yearCount, `${path}.yearCount`);
  if (yearCount <= 0) fail(`${path}.yearCount`, "must be a positive integer.");
  const currency = text(source.currency, `${path}.currency`, 3).toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) fail(`${path}.currency`, "must be a three-letter ISO currency code.");
  return {
    startYear,
    yearCount,
    currency,
    fuelPricePerLitre: nonnegative(source.fuelPricePerLitre, `${path}.fuelPricePerLitre`),
    fuelEmissionsKgCo2ePerLitre: nonnegative(source.fuelEmissionsKgCo2ePerLitre, `${path}.fuelEmissionsKgCo2ePerLitre`),
    electricityEmissionsKgCo2ePerKWh: nonnegative(source.electricityEmissionsKgCo2ePerKWh, `${path}.electricityEmissionsKgCo2ePerKWh`),
  };
}

function fleetVehicle(value: unknown, analysis: AnalysisSettings, path: string): FleetVehicle {
  const source = record(value, path);
  const replacementYear = source.replacementYear === null
    ? null
    : integer(source.replacementYear, `${path}.replacementYear`);
  if (replacementYear !== null && (replacementYear < analysis.startYear || replacementYear > analysisEndYear(analysis))) {
    fail(`${path}.replacementYear`, "must be null or inside the analysis period.");
  }
  const utilisation = finite(source.utilisation, `${path}.utilisation`);
  if (utilisation < 0 || utilisation > 1) fail(`${path}.utilisation`, "must be between 0 and 1.");
  const routePattern = source.routePattern;
  if (routePattern !== "predictable" && routePattern !== "variable") fail(`${path}.routePattern`, "must be “predictable” or “variable”.");

  const holding = record(source.currentHolding, `${path}.currentHolding`);
  const currentHolding = holding.kind === "owned"
    ? {
        kind: "owned" as const,
        currentValue: nonnegative(holding.currentValue, `${path}.currentHolding.currentValue`),
        endResidualValue: nonnegative(holding.endResidualValue, `${path}.currentHolding.endResidualValue`),
      }
    : holding.kind === "leased"
      ? {
          kind: "leased" as const,
          annualPayment: nonnegative(holding.annualPayment, `${path}.currentHolding.annualPayment`),
          exitFee: nonnegative(holding.exitFee, `${path}.currentHolding.exitFee`),
        }
      : fail(`${path}.currentHolding.kind`, "must be “owned” or “leased”.");

  const operatingDays = integer(source.operatingDays, `${path}.operatingDays`);
  if (operatingDays < 0) fail(`${path}.operatingDays`, "must be nonnegative.");
  return {
    id: id(source.id, `${path}.id`),
    name: text(source.name, `${path}.name`),
    currentPresetId: id(source.currentPresetId, `${path}.currentPresetId`),
    annualKm: nonnegative(source.annualKm, `${path}.annualKm`),
    typicalDailyKm: nonnegative(source.typicalDailyKm, `${path}.typicalDailyKm`),
    operatingDays,
    utilisation,
    routePattern,
    returnsToDepot: boolean(source.returnsToDepot, `${path}.returnsToDepot`),
    depotDwellHours: nonnegative(source.depotDwellHours, `${path}.depotDwellHours`),
    externalChargingAccess: boolean(source.externalChargingAccess, `${path}.externalChargingAccess`),
    replacementYear,
    currentHolding,
  };
}

/** Validate a current document or migrate the supported version 2 project document. */
export function normalizeProjectDocument(value: unknown, path = "project.document"): M1ProjectDocument {
  const source = record(value, path);
  if (source.version === 2) {
    if (!Array.isArray(source.vehiclePresets)) fail(`${path}.vehiclePresets`, "must be an array.");
    const vehiclePresets = source.vehiclePresets.map((preset, index) => legacyPreset(preset, `${path}.vehiclePresets[${index}]`));
    unique(vehiclePresets.map((preset) => preset.id), `${path}.vehiclePresets`);
    // A version 2 document stored no fleet, so it reopens without one. Inventing
    // vehicles here would present data the user never entered as their own.
    return {
      version: M1_PROJECT_DOCUMENT_VERSION,
      vehiclePresets,
      fleetVehicles: [],
      analysis: clone(LEGACY_ANALYSIS_DEFAULTS),
    };
  }
  if (source.version !== M1_PROJECT_DOCUMENT_VERSION) fail(`${path}.version`, `unsupported project document version “${String(source.version)}”.`);
  if (!Array.isArray(source.vehiclePresets)) fail(`${path}.vehiclePresets`, "must be an array.");
  if (!Array.isArray(source.fleetVehicles)) fail(`${path}.fleetVehicles`, "must be an array.");
  const analysis = analysisSettings(source.analysis, `${path}.analysis`);
  const vehiclePresets = source.vehiclePresets.map((preset, index) => currentPreset(preset, `${path}.vehiclePresets[${index}]`));
  const fleetVehicles = source.fleetVehicles.map((vehicle, index) => fleetVehicle(vehicle, analysis, `${path}.fleetVehicles[${index}]`));
  unique(vehiclePresets.map((preset) => preset.id), `${path}.vehiclePresets`);
  unique(fleetVehicles.map((vehicle) => vehicle.id), `${path}.fleetVehicles`);
  const presetIds = new Set(vehiclePresets.map((preset) => preset.id));
  for (const vehicle of fleetVehicles) {
    if (!presetIds.has(vehicle.currentPresetId)) fail(`${path}.fleetVehicles[${vehicle.id}].currentPresetId`, `does not resolve to preset “${vehicle.currentPresetId}”.`);
  }
  return { version: M1_PROJECT_DOCUMENT_VERSION, vehiclePresets, fleetVehicles, analysis };
}

function scenarioPlan(value: unknown, path: string): ScenarioVehiclePlan {
  const source = record(value, path);
  const plan: ScenarioVehiclePlan = {};
  if (Object.hasOwn(source, "transitionYear")) {
    plan.transitionYear = source.transitionYear === null ? null : integer(source.transitionYear, `${path}.transitionYear`);
  }
  if (Object.hasOwn(source, "targetPresetId")) plan.targetPresetId = id(source.targetPresetId, `${path}.targetPresetId`);
  if (plan.transitionYear !== undefined && plan.transitionYear !== null && !plan.targetPresetId) {
    fail(path, "a scheduled transition requires targetPresetId.");
  }
  return plan;
}

function vehiclePlans(value: unknown, path: string): Record<string, ScenarioVehiclePlan> {
  if (value === undefined) return {};
  const source = record(value, path);
  const plans: Record<string, ScenarioVehiclePlan> = {};
  for (const [vehicleId, value] of Object.entries(source)) {
    const normalizedId = id(vehicleId, `${path} key`);
    plans[normalizedId] = scenarioPlan(value, `${path}.${normalizedId}`);
  }
  return plans;
}

function scenarioAssumptions(value: unknown, path: string): ScenarioAssumptions {
  const source = record(value, path);
  if (source.chargingStrategy !== "depot" && source.chargingStrategy !== "external" && source.chargingStrategy !== "mixed") {
    fail(`${path}.chargingStrategy`, "must be “depot”, “external”, or “mixed”.");
  }
  const depotChargingShare = finite(source.depotChargingShare, `${path}.depotChargingShare`);
  if (depotChargingShare < 0 || depotChargingShare > 1) fail(`${path}.depotChargingShare`, "must be between 0 and 1.");
  if (source.chargingStrategy === "depot" && depotChargingShare !== 1) fail(`${path}.depotChargingShare`, "must be 1 for depot charging.");
  if (source.chargingStrategy === "external" && depotChargingShare !== 0) fail(`${path}.depotChargingShare`, "must be 0 for external charging.");
  if (source.chargingStrategy === "mixed" && (depotChargingShare <= 0 || depotChargingShare >= 1)) fail(`${path}.depotChargingShare`, "must be between 0 and 1 for mixed charging.");
  return {
    chargingStrategy: source.chargingStrategy,
    depotChargingShare,
    depotElectricityPricePerKWh: nonnegative(source.depotElectricityPricePerKWh, `${path}.depotElectricityPricePerKWh`),
    externalElectricityPricePerKWh: nonnegative(source.externalElectricityPricePerKWh, `${path}.externalElectricityPricePerKWh`),
  };
}

/**
 * Drops plan entries naming a vehicle the project no longer has.
 *
 * Only legacy documents are pruned. A version 2 project stored no fleet, so its
 * scenarios can carry plans for vehicles that no longer exist; silently dropping
 * those keeps the project openable. An authoritative version 2 scenario is held
 * to the stricter rule in `validateScenarioReferences`, where a dangling
 * reference is corruption rather than history.
 */
function prunedPlans(plans: Record<string, ScenarioVehiclePlan>, project: M1ProjectDocument): Record<string, ScenarioVehiclePlan> {
  const vehicleIds = new Set(project.fleetVehicles.map((vehicle) => vehicle.id));
  return Object.fromEntries(Object.entries(plans).filter(([vehicleId]) => vehicleIds.has(vehicleId)));
}

/** Validate a current document or migrate the supported version 1 scenario document. */
export function normalizeScenarioDocument(value: unknown, path = "scenario.document", project?: M1ProjectDocument): M1ScenarioDocument {
  const source = record(value, path);
  if (source.version === 1) {
    const stored = vehiclePlans(source.vehiclePlans, `${path}.vehiclePlans`);
    return {
      version: M1_SCENARIO_DOCUMENT_VERSION,
      vehiclePlans: project ? prunedPlans(stored, project) : stored,
      assumptions: clone(LEGACY_SCENARIO_ASSUMPTION_DEFAULTS),
    };
  }
  if (source.version !== M1_SCENARIO_DOCUMENT_VERSION) fail(`${path}.version`, `unsupported scenario document version “${String(source.version)}”.`);
  return {
    version: M1_SCENARIO_DOCUMENT_VERSION,
    vehiclePlans: vehiclePlans(source.vehiclePlans, `${path}.vehiclePlans`),
    assumptions: scenarioAssumptions(source.assumptions, `${path}.assumptions`),
  };
}

export function validateScenarioReferences(project: M1ProjectDocument, scenario: M1ScenarioDocument, path = "scenario.document"): void {
  const presetIds = new Set(project.vehiclePresets.map((preset) => preset.id));
  const vehicleIds = new Set(project.fleetVehicles.map((vehicle) => vehicle.id));
  const endYear = analysisEndYear(project.analysis);
  for (const [vehicleId, plan] of Object.entries(scenario.vehiclePlans)) {
    if (!vehicleIds.has(vehicleId)) fail(`${path}.vehiclePlans.${vehicleId}`, `does not resolve to a project fleet vehicle.`);
    if (plan.targetPresetId && !presetIds.has(plan.targetPresetId)) fail(`${path}.vehiclePlans.${vehicleId}.targetPresetId`, `does not resolve to preset “${plan.targetPresetId}”.`);
    if (plan.transitionYear !== undefined && plan.transitionYear !== null
      && (plan.transitionYear < project.analysis.startYear || plan.transitionYear > endYear)) {
      fail(`${path}.vehiclePlans.${vehicleId}.transitionYear`, "must be inside the analysis period.");
    }
  }
}

function vector(value: unknown, path: string, positive = false): Vector3 {
  if (!Array.isArray(value) || value.length !== 3) fail(path, "must contain three numbers.");
  const normalized = value.map((item, index) => finite(item, `${path}[${index}]`)) as Vector3;
  if (positive && normalized.some((item) => item <= 0)) fail(path, "must contain positive scale values.");
  return normalized;
}

function transform(value: unknown, path: string): Transform {
  const source = record(value, path);
  return {
    position: vector(source.position, `${path}.position`),
    rotation: vector(source.rotation, `${path}.rotation`),
    scale: vector(source.scale, `${path}.scale`, true),
  };
}

function appearance(value: unknown, path: string): Appearance {
  const source = record(value, path);
  const normalized: Appearance = {};
  if (source.tint !== undefined) {
    if (typeof source.tint !== "string" || !/^#[0-9a-f]{6}$/i.test(source.tint)) fail(`${path}.tint`, "must be a six-digit hex colour.");
    normalized.tint = source.tint;
  }
  if (source.material !== undefined) {
    if (source.material !== "matte" && source.material !== "glossy" && source.material !== "metal") fail(`${path}.material`, "is unsupported.");
    normalized.material = source.material;
  }
  if (source.wireframe !== undefined) normalized.wireframe = boolean(source.wireframe, `${path}.wireframe`);
  return normalized;
}

function sceneObject(value: unknown, path: string): SceneObject {
  const source = record(value, path);
  const normalized: SceneObject = {
    id: id(source.id, `${path}.id`),
    name: text(source.name, `${path}.name`),
    definitionId: id(source.definitionId, `${path}.definitionId`),
    transform: transform(source.transform, `${path}.transform`),
    appearance: appearance(source.appearance, `${path}.appearance`),
  };
  if (source.presetId !== undefined) normalized.presetId = id(source.presetId, `${path}.presetId`);
  return normalized;
}

export function normalizeSceneDocument(value: unknown, path = "world.document"): SceneDocument {
  const source = record(value, path);
  if (source.version !== 3) fail(`${path}.version`, `unsupported world document version “${String(source.version)}”.`);
  if (!Array.isArray(source.objects)) fail(`${path}.objects`, "must be an array.");
  const objects = source.objects.map((object, index) => sceneObject(object, `${path}.objects[${index}]`));
  unique(objects.map((object) => object.id), `${path}.objects`);
  const light = finite(source.light, `${path}.light`);
  if (light < 0 || light > 100) fail(`${path}.light`, "must be between 0 and 100.");
  return { version: 3, light, objects };
}

function validateWorkspaceShape(input: WorkspaceSaveInput): void {
  id(input.project.id, "project.id");
  text(input.project.name, "project.name");
  id(input.project.activeWorldId, "project.activeWorldId");
  if (!Array.isArray(input.worlds) || !input.worlds.length) fail("worlds", "must contain at least one world.");
  if (!Array.isArray(input.scenarios)) fail("scenarios", "must be an array.");
  unique(input.worlds.map((world, index) => id(world.id, `worlds[${index}].id`)), "worlds");
  unique(input.scenarios.map((scenario, index) => id(scenario.id, `scenarios[${index}].id`)), "scenarios");
}

/**
 * Canonicalize an untrusted save snapshot before a repository transaction starts.
 * Legacy documents stay readable; strict cross-document reference checks apply to
 * authoritative version 3 project inputs.
 */
export function normalizeWorkspaceSaveInput(input: WorkspaceSaveInput): WorkspaceSaveInput {
  validateWorkspaceShape(input);
  const sourceProject = record(input.project.document, "project.document");
  const projectDocument = normalizeProjectDocument(sourceProject);
  const worlds = input.worlds.map((world, index) => ({
    id: id(world.id, `worlds[${index}].id`),
    name: text(world.name, `worlds[${index}].name`),
    expectedRevision: integer(world.expectedRevision, `worlds[${index}].expectedRevision`),
    document: normalizeSceneDocument(world.document, `worlds[${index}].document`),
  }));
  if (worlds.some((world) => world.expectedRevision < 0)) fail("worlds.expectedRevision", "must be nonnegative.");
  const worldIds = new Set(worlds.map((world) => world.id));
  if (!worldIds.has(input.project.activeWorldId)) fail("project.activeWorldId", "must resolve to a world in this project.");
  const scenarios = input.scenarios.map((scenario, index) => {
    const path = `scenarios[${index}]`;
    const normalized = {
      id: id(scenario.id, `${path}.id`),
      worldId: id(scenario.worldId, `${path}.worldId`),
      name: text(scenario.name, `${path}.name`),
      expectedRevision: integer(scenario.expectedRevision, `${path}.expectedRevision`),
      document: normalizeScenarioDocument(scenario.document, `${path}.document`, projectDocument),
    };
    if (normalized.expectedRevision < 0) fail(`${path}.expectedRevision`, "must be nonnegative.");
    if (!worldIds.has(normalized.worldId)) fail(`${path}.worldId`, "must resolve to a world in this project.");
    validateScenarioReferences(projectDocument, normalized.document, `${path}.document`);
    return normalized;
  });
  for (const world of worlds) {
    if (!scenarios.some((scenario) => scenario.worldId === world.id)) fail(`worlds.${world.id}`, "must retain at least one scenario.");
  }
  const expectedRevision = input.project.expectedRevision;
  if (expectedRevision !== undefined && (integer(expectedRevision, "project.expectedRevision") < 0)) fail("project.expectedRevision", "must be nonnegative.");
  return {
    project: {
      id: id(input.project.id, "project.id"),
      name: text(input.project.name, "project.name"),
      activeWorldId: id(input.project.activeWorldId, "project.activeWorldId"),
      ...(expectedRevision === undefined ? {} : { expectedRevision }),
      document: projectDocument,
    },
    worlds,
    scenarios,
  };
}

/** Migrate documents read from storage while preserving record metadata. */
export function normalizeWorkspaceRecord(workspace: WorkspaceRecord): WorkspaceRecord {
  const worldIds = new Set(workspace.worlds.map((world) => world.id));
  if (!worldIds.has(workspace.project.worldId)) fail("project.worldId", "must resolve to a stored project world.");
  const projectDocument = normalizeProjectDocument(workspace.project.document);
  return {
    project: { ...clone(workspace.project), document: projectDocument },
    worlds: workspace.worlds.map((world, index) => ({ ...clone(world), document: normalizeSceneDocument(world.document, `worlds[${index}].document`) })),
    scenarios: workspace.scenarios.map((scenario, index) => {
      if (!worldIds.has(scenario.worldId)) fail(`scenarios[${index}].worldId`, "must resolve to a stored project world.");
      const document = normalizeScenarioDocument(scenario.document, `scenarios[${index}].document`, projectDocument);
      validateScenarioReferences(projectDocument, document, `scenarios[${index}].document`);
      return { ...clone(scenario), document };
    }),
  };
}

export function normalizeWorldRecord(world: WorldRecord): WorldRecord {
  return { ...clone(world), document: normalizeSceneDocument(world.document) };
}
