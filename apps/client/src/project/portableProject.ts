import { M1_PROJECT_DOCUMENT_VERSION, M1_SCENARIO_DOCUMENT_VERSION } from "../domain/contracts";
import type { SceneDocument, SceneObject, Transform, Vector3 } from "../scene/types";
import type { ProjectDocument, ScenarioDocument } from "./types";

export const PORTABLE_PROJECT_FORMAT = "fleet-transition-planner-project";
export const PORTABLE_PROJECT_VERSION = 2;

type PortableWorld = {
  name: string;
  document: SceneDocument;
  scenarios: { name: string; document: ScenarioDocument }[];
};

export type PortableProjectFile = {
  format: typeof PORTABLE_PROJECT_FORMAT;
  version: typeof PORTABLE_PROJECT_VERSION;
  exportedAt: string;
  project: { name: string; document: ProjectDocument };
  worlds: PortableWorld[];
  activeWorldIndex: number;
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

// Legacy scenario version 1 and project version 2 documents stay importable;
// T03 upgrades their contents to the M1 shape once they are in the workspace.
const LEGACY_SCENARIO_VERSION = 1;
const LEGACY_PROJECT_VERSION = 2;

function scenarioDocument(value: unknown): value is ScenarioDocument {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const version = (value as Record<string, unknown>).version;
  return version === LEGACY_SCENARIO_VERSION || version === M1_SCENARIO_DOCUMENT_VERSION;
}

function projectDocument(value: unknown): value is ProjectDocument {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (record.version !== LEGACY_PROJECT_VERSION && record.version !== M1_PROJECT_DOCUMENT_VERSION) return false;
  // Individual records are validated by T03 on load, so a single unreadable
  // preset or vehicle does not make the whole file unimportable.
  if (!Array.isArray(record.vehiclePresets)) return false;
  if (record.version === M1_PROJECT_DOCUMENT_VERSION && !Array.isArray(record.fleetVehicles)) return false;
  return true;
}

const nonEmptyName = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0 && value.length <= 100;

function portableWorld(value: unknown): value is PortableWorld {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (!nonEmptyName(record.name) || !sceneDocument(record.document) || !Array.isArray(record.scenarios) || !record.scenarios.length) return false;
  return record.scenarios.every((scenario) => {
    if (typeof scenario !== "object" || scenario === null || Array.isArray(scenario)) return false;
    const item = scenario as Record<string, unknown>;
    return nonEmptyName(item.name) && scenarioDocument(item.document);
  });
}

export function parsePortableProject(value: unknown): PortableProjectFile {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("This file is not a Fleet Transition Planner project.");
  const record = value as Record<string, unknown>;
  if (record.format !== PORTABLE_PROJECT_FORMAT || (record.version !== 1 && record.version !== PORTABLE_PROJECT_VERSION)) throw new Error("This project file uses an unsupported format or version.");

  const project = record.project;
  if (typeof project !== "object" || project === null || Array.isArray(project)) throw new Error("The project file is incomplete.");
  const projectRecord = project as Record<string, unknown>;
  if (!nonEmptyName(projectRecord.name) || !projectDocument(projectRecord.document)) throw new Error("The project data in this file is invalid.");

  // Backward-compatible import of the previous single-world export format.
  if (record.version === 1) {
    const world = record.world;
    const scenarios = record.scenarios;
    if (typeof world !== "object" || world === null || Array.isArray(world) || !Array.isArray(scenarios)) throw new Error("The project file is incomplete.");
    const worldRecord = world as Record<string, unknown>;
    const convertedWorld = { name: worldRecord.name, document: worldRecord.document, scenarios };
    if (!portableWorld(convertedWorld)) throw new Error("The world or scenario data in this file is invalid.");
    const activeScenarioIndex = record.activeScenarioIndex;
    if (typeof activeScenarioIndex !== "number" || !Number.isInteger(activeScenarioIndex) || activeScenarioIndex < 0 || activeScenarioIndex >= scenarios.length) throw new Error("The active scenario in this file is invalid.");
    return {
      format: PORTABLE_PROJECT_FORMAT,
      version: PORTABLE_PROJECT_VERSION,
      exportedAt: typeof record.exportedAt === "string" ? record.exportedAt : new Date().toISOString(),
      project: clone(projectRecord) as PortableProjectFile["project"],
      worlds: [clone(convertedWorld) as PortableWorld],
      activeWorldIndex: 0,
      activeScenarioIndex,
    };
  }

  const worlds = record.worlds;
  if (!Array.isArray(worlds) || !worlds.length || !worlds.every(portableWorld)) throw new Error("The world data in this file is invalid.");
  const activeWorldIndex = record.activeWorldIndex;
  const activeScenarioIndex = record.activeScenarioIndex;
  if (typeof activeWorldIndex !== "number" || !Number.isInteger(activeWorldIndex) || activeWorldIndex < 0 || activeWorldIndex >= worlds.length) throw new Error("The active world in this file is invalid.");
  const activeWorld = worlds[activeWorldIndex] as PortableWorld;
  if (typeof activeScenarioIndex !== "number" || !Number.isInteger(activeScenarioIndex) || activeScenarioIndex < 0 || activeScenarioIndex >= activeWorld.scenarios.length) throw new Error("The active scenario in this file is invalid.");
  return clone(value) as PortableProjectFile;
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export function createPortableProject(input: {
  projectName: string;
  projectDocument: ProjectDocument;
  worlds: PortableWorld[];
  activeWorldIndex: number;
  activeScenarioIndex: number;
}): PortableProjectFile {
  return {
    format: PORTABLE_PROJECT_FORMAT,
    version: PORTABLE_PROJECT_VERSION,
    exportedAt: new Date().toISOString(),
    project: { name: input.projectName, document: clone(input.projectDocument) },
    worlds: clone(input.worlds),
    activeWorldIndex: input.activeWorldIndex,
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
