import {
  analysisEndYear,
  M1_PROJECT_DOCUMENT_VERSION,
  M1_SCENARIO_DOCUMENT_VERSION,
  type M1ProjectDocument,
  type M1ScenarioDocument,
  type ScenarioAssumptions,
  type ScenarioVehiclePlan,
} from "../domain/contracts";
import { toM1ProjectDocument } from "../domain/projectDocument";
import { hasDefaultDepot } from "../scene/defaultProjectScene";
import type { Appearance, SceneDocument, SceneObject, Transform, Vector3 } from "../scene/types";
import type { Scenario, WorkspaceRecord, WorkspaceSaveInput } from "./types";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

function fail(path: string, message: string): never {
  throw new Error(`${path} ${message}`);
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail(path, "must be an object.");
  return value as Record<string, unknown>;
}

function text(value: unknown, path: string): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 100) fail(path, "must be nonempty text of 100 characters or fewer.");
  return value.trim();
}

function id(value: unknown, path: string): string {
  if (typeof value !== "string" || !value.trim() || ["__proto__", "constructor", "prototype"].includes(value)) fail(path, "must be a valid identifier.");
  return value;
}

function integer(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isInteger(value)) fail(path, "must be an integer.");
  return value;
}

function finite(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) fail(path, "must be a finite number.");
  return value;
}

function unique(values: readonly string[], path: string): void {
  if (new Set(values).size !== values.length) fail(path, "must not contain duplicate identifiers.");
}

function vector(value: unknown, path: string, positive = false): Vector3 {
  if (!Array.isArray(value) || value.length !== 3) fail(path, "must contain three numbers.");
  const normalized = value.map((item, index) => finite(item, `${path}[${index}]`)) as Vector3;
  if (positive && normalized.some((item) => item <= 0)) fail(path, "must contain positive values.");
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
    if (!(["matte", "glossy", "metal"] as const).includes(source.material as never)) fail(`${path}.material`, "is unsupported.");
    normalized.material = source.material as Appearance["material"];
  }
  if (source.wireframe !== undefined) {
    if (typeof source.wireframe !== "boolean") fail(`${path}.wireframe`, "must be true or false.");
    normalized.wireframe = source.wireframe;
  }
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

export function normalizeSceneDocument(value: unknown, path = "project.document.scene"): SceneDocument {
  const source = record(value, path);
  if (source.version !== 3) fail(`${path}.version`, `unsupported scene document version “${String(source.version)}”.`);
  if (!Array.isArray(source.objects)) fail(`${path}.objects`, "must be an array.");
  const objects = source.objects.map((object, index) => sceneObject(object, `${path}.objects[${index}]`));
  unique(objects.map((object) => object.id), `${path}.objects`);
  const light = finite(source.light, `${path}.light`);
  if (light < 0 || light > 100) fail(`${path}.light`, "must be between 0 and 100.");
  const document = { version: 3 as const, objects, light };
  if (!hasDefaultDepot(document)) fail(path, "must contain the default depot.");
  return document;
}

export function normalizeProjectDocument(value: unknown, path = "project.document"): M1ProjectDocument {
  const source = record(value, path);
  if (source.version !== M1_PROJECT_DOCUMENT_VERSION) fail(`${path}.version`, `unsupported project document version “${String(source.version)}”.`);
  const scene = normalizeSceneDocument(source.scene, `${path}.scene`);
  try {
    return toM1ProjectDocument({ ...source, scene });
  } catch (error) {
    fail(path, error instanceof Error ? error.message : "is invalid.");
  }
}

function scenarioPlan(value: unknown, path: string): ScenarioVehiclePlan {
  const source = record(value, path);
  const plan: ScenarioVehiclePlan = {};
  if (Object.hasOwn(source, "transitionYear")) plan.transitionYear = source.transitionYear === null ? null : integer(source.transitionYear, `${path}.transitionYear`);
  if (Object.hasOwn(source, "targetPresetId")) plan.targetPresetId = id(source.targetPresetId, `${path}.targetPresetId`);
  if (plan.transitionYear !== undefined && plan.transitionYear !== null && !plan.targetPresetId) fail(path, "a scheduled transition requires targetPresetId.");
  return plan;
}

function scenarioAssumptions(value: unknown, path: string): ScenarioAssumptions {
  const source = record(value, path);
  if (source.chargingStrategy !== "depot" && source.chargingStrategy !== "external" && source.chargingStrategy !== "mixed") {
    fail(`${path}.chargingStrategy`, "must be depot, external, or mixed.");
  }
  const depotChargingShare = finite(source.depotChargingShare, `${path}.depotChargingShare`);
  if (depotChargingShare < 0 || depotChargingShare > 1) fail(`${path}.depotChargingShare`, "must be between 0 and 1.");
  const depotElectricityPricePerKWh = finite(source.depotElectricityPricePerKWh, `${path}.depotElectricityPricePerKWh`);
  const externalElectricityPricePerKWh = finite(source.externalElectricityPricePerKWh, `${path}.externalElectricityPricePerKWh`);
  if (depotElectricityPricePerKWh < 0) fail(`${path}.depotElectricityPricePerKWh`, "must be nonnegative.");
  if (externalElectricityPricePerKWh < 0) fail(`${path}.externalElectricityPricePerKWh`, "must be nonnegative.");
  return {
    chargingStrategy: source.chargingStrategy,
    depotChargingShare,
    depotElectricityPricePerKWh,
    externalElectricityPricePerKWh,
  };
}

export function normalizeScenarioDocument(value: unknown, path = "scenario.document"): M1ScenarioDocument {
  const source = record(value, path);
  if (source.version !== M1_SCENARIO_DOCUMENT_VERSION) fail(`${path}.version`, `unsupported scenario document version “${String(source.version)}”.`);
  const rawPlans = record(source.vehiclePlans, `${path}.vehiclePlans`);
  const vehiclePlans = Object.fromEntries(Object.entries(rawPlans).map(([vehicleId, plan]) => [id(vehicleId, `${path}.vehiclePlans key`), scenarioPlan(plan, `${path}.vehiclePlans.${vehicleId}`)]));
  return { version: M1_SCENARIO_DOCUMENT_VERSION, vehiclePlans, assumptions: scenarioAssumptions(source.assumptions, `${path}.assumptions`) };
}

export function validateScenarioReferences(project: M1ProjectDocument, scenario: M1ScenarioDocument, path = "scenario.document"): void {
  const presetIds = new Set(project.vehiclePresets.map((preset) => preset.id));
  const vehicleIds = new Set(project.fleetVehicles.map((vehicle) => vehicle.id));
  const endYear = analysisEndYear(project.analysis);
  for (const [vehicleId, plan] of Object.entries(scenario.vehiclePlans)) {
    if (!vehicleIds.has(vehicleId)) fail(`${path}.vehiclePlans.${vehicleId}`, "does not resolve to a project fleet vehicle.");
    if (plan.targetPresetId && !presetIds.has(plan.targetPresetId)) fail(`${path}.vehiclePlans.${vehicleId}.targetPresetId`, `does not resolve to preset “${plan.targetPresetId}”.`);
    if (plan.transitionYear !== undefined && plan.transitionYear !== null && (plan.transitionYear < project.analysis.startYear || plan.transitionYear > endYear)) {
      fail(`${path}.vehiclePlans.${vehicleId}.transitionYear`, "must be inside the analysis period.");
    }
  }
}

function normalizeScenarioRecord(scenario: Scenario, project: M1ProjectDocument, projectId: string, index: number): Scenario {
  const path = `scenarios[${index}]`;
  if (scenario.projectId !== projectId) fail(`${path}.projectId`, "must resolve to this project.");
  const document = normalizeScenarioDocument(scenario.document, `${path}.document`);
  validateScenarioReferences(project, document, `${path}.document`);
  return { ...clone(scenario), id: id(scenario.id, `${path}.id`), projectId, name: text(scenario.name, `${path}.name`), position: index, document };
}

export function normalizeWorkspaceSaveInput(input: WorkspaceSaveInput): WorkspaceSaveInput {
  id(input.project.id, "project.id");
  const project = normalizeProjectDocument(input.project.document);
  if (!Array.isArray(input.scenarios) || !input.scenarios.length) fail("scenarios", "must contain at least one scenario.");
  unique(input.scenarios.map((scenario, index) => id(scenario.id, `scenarios[${index}].id`)), "scenarios");
  const scenarios = input.scenarios.map((scenario, index) => {
    const document = normalizeScenarioDocument(scenario.document, `scenarios[${index}].document`);
    validateScenarioReferences(project, document, `scenarios[${index}].document`);
    const expectedRevision = integer(scenario.expectedRevision, `scenarios[${index}].expectedRevision`);
    if (expectedRevision < 0) fail(`scenarios[${index}].expectedRevision`, "must be nonnegative.");
    return { id: id(scenario.id, `scenarios[${index}].id`), name: text(scenario.name, `scenarios[${index}].name`), expectedRevision, document };
  });
  if (input.project.expectedRevision !== undefined && integer(input.project.expectedRevision, "project.expectedRevision") < 0) fail("project.expectedRevision", "must be nonnegative.");
  return {
    project: {
      id: input.project.id,
      name: text(input.project.name, "project.name"),
      ...(input.project.expectedRevision === undefined ? {} : { expectedRevision: input.project.expectedRevision }),
      document: project,
    },
    scenarios,
  };
}

export function normalizeWorkspaceRecord(workspace: WorkspaceRecord): WorkspaceRecord {
  const projectId = id(workspace.project.id, "project.id");
  const projectDocument = normalizeProjectDocument(workspace.project.document);
  if (!Array.isArray(workspace.scenarios) || !workspace.scenarios.length) fail("scenarios", "must contain at least one scenario.");
  unique(workspace.scenarios.map((scenario, index) => id(scenario.id, `scenarios[${index}].id`)), "scenarios");
  return {
    project: { ...clone(workspace.project), id: projectId, name: text(workspace.project.name, "project.name"), document: projectDocument },
    scenarios: [...workspace.scenarios]
      .sort((a, b) => a.position - b.position)
      .map((scenario, index) => normalizeScenarioRecord(scenario, projectDocument, projectId, index)),
  };
}
