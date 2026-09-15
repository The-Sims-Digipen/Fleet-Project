import type { SceneDocument, SceneObject, Transform, Vector3 } from "../scene/types";
import { normalizePreset } from "../vehicles/types";
import type { ProjectDocument, ScenarioDocument } from "./types";

export const PORTABLE_PROJECT_FORMAT = "fleet-transition-planner-project";
export const PORTABLE_PROJECT_VERSION = 1;

export type PortableProjectFile = {
  format: typeof PORTABLE_PROJECT_FORMAT;
  version: typeof PORTABLE_PROJECT_VERSION;
  exportedAt: string;
  project: { name: string; document: ProjectDocument };
  world: { name: string; document: SceneDocument };
  scenarios: { name: string; document: ScenarioDocument }[];
  activeScenarioIndex: number;
};

const finiteVector = (value: unknown): value is Vector3 => Array.isArray(value) && value.length === 3 && value.every((item) => typeof item === "number" && Number.isFinite(item));
const transform = (value: unknown): value is Transform => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return finiteVector(record.position) && finiteVector(record.rotation) && finiteVector(record.scale) && record.scale.every((item) => item > 0);
};

function sceneObject(value: unknown): value is SceneObject {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  if (typeof record.id !== "string" || !record.id || typeof record.name !== "string" || !record.name || typeof record.definitionId !== "string" || !record.definitionId) return false;
  if (record.presetId !== undefined && typeof record.presetId !== "string") return false;
  if (!transform(record.transform)) return false;
  if (typeof record.appearance !== "object" || record.appearance === null || Array.isArray(record.appearance)) return false;
  return true;
}

function sceneDocument(value: unknown): value is SceneDocument {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return record.version === 3 && typeof record.light === "number" && Number.isFinite(record.light) && Array.isArray(record.objects) && record.objects.every(sceneObject);
}

function scenarioDocument(value: unknown): value is ScenarioDocument {
  return typeof value === "object" && value !== null && !Array.isArray(value) && (value as Record<string, unknown>).version === 1;
}

function projectDocument(value: unknown): value is ProjectDocument {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (record.version !== 2 || !Array.isArray(record.vehiclePresets)) return false;
  return record.vehiclePresets.every((preset) => normalizePreset(preset) !== undefined);
}

const nonEmptyName = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0 && value.length <= 100;

export function parsePortableProject(value: unknown): PortableProjectFile {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("This file is not a Fleet Transition Planner project.");
  const record = value as Record<string, unknown>;
  if (record.format !== PORTABLE_PROJECT_FORMAT || record.version !== PORTABLE_PROJECT_VERSION) throw new Error("This project file uses an unsupported format or version.");

  const project = record.project;
  const world = record.world;
  const scenarios = record.scenarios;
  if (typeof project !== "object" || project === null || typeof world !== "object" || world === null || !Array.isArray(scenarios)) throw new Error("The project file is incomplete.");
  const projectRecord = project as Record<string, unknown>;
  const worldRecord = world as Record<string, unknown>;
  if (!nonEmptyName(projectRecord.name) || !projectDocument(projectRecord.document)) throw new Error("The project data in this file is invalid.");
  if (!nonEmptyName(worldRecord.name) || !sceneDocument(worldRecord.document)) throw new Error("The 3D world data in this file is invalid.");
  if (!scenarios.length || !scenarios.every((scenario) => {
    if (typeof scenario !== "object" || scenario === null) return false;
    const scenarioRecord = scenario as Record<string, unknown>;
    return nonEmptyName(scenarioRecord.name) && scenarioDocument(scenarioRecord.document);
  })) throw new Error("The scenario data in this file is invalid.");

  const activeScenarioIndex = record.activeScenarioIndex;
  if (typeof activeScenarioIndex !== "number" || !Number.isInteger(activeScenarioIndex) || activeScenarioIndex < 0 || activeScenarioIndex >= scenarios.length) throw new Error("The active scenario in this file is invalid.");

  return JSON.parse(JSON.stringify(value)) as PortableProjectFile;
}

export function createPortableProject(input: {
  projectName: string;
  projectDocument: ProjectDocument;
  worldName: string;
  worldDocument: SceneDocument;
  scenarios: { name: string; document: ScenarioDocument }[];
  activeScenarioIndex: number;
}): PortableProjectFile {
  return {
    format: PORTABLE_PROJECT_FORMAT,
    version: PORTABLE_PROJECT_VERSION,
    exportedAt: new Date().toISOString(),
    project: { name: input.projectName, document: JSON.parse(JSON.stringify(input.projectDocument)) as ProjectDocument },
    world: { name: input.worldName, document: JSON.parse(JSON.stringify(input.worldDocument)) as SceneDocument },
    scenarios: JSON.parse(JSON.stringify(input.scenarios)) as { name: string; document: ScenarioDocument }[],
    activeScenarioIndex: input.activeScenarioIndex,
  };
}

export function projectFileName(name: string) {
  const safe = name.trim().replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "fleet-project";
  return `${safe}.fleetproject`;
}

export function downloadPortableProject(file: PortableProjectFile) {
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = projectFileName(file.project.name);
  anchor.click();
  URL.revokeObjectURL(url);
}
