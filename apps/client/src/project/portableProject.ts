import type { FleetVehicle, M1ProjectDocument, M1ScenarioDocument } from "../domain/contracts";
import { fleetFromDocument, placeMigratedFleet } from "../domain/worldFleet";
import type { SceneDocument } from "../scene/types";
import {
  readProjectDocument,
  normalizeScenarioDocument,
  normalizeSceneDocument,
  validateScenarioReferences,
} from "./serialization";
import type { ProjectDocument, ScenarioDocument } from "./types";

export const PORTABLE_PROJECT_FORMAT = "fleet-transition-planner-project";
export const PORTABLE_PROJECT_VERSION = 2;

type PortableWorld = {
  name: string;
  document: SceneDocument;
  scenarios: { name: string; document: M1ScenarioDocument }[];
};

export type PortableProjectFile = {
  format: typeof PORTABLE_PROJECT_FORMAT;
  version: typeof PORTABLE_PROJECT_VERSION;
  exportedAt: string;
  project: { name: string; document: M1ProjectDocument };
  worlds: PortableWorld[];
  activeWorldIndex: number;
  activeScenarioIndex: number;
};

type PortableWorldInput = {
  name: string;
  document: SceneDocument;
  scenarios: { name: string; document: ScenarioDocument }[];
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

function nonEmptyName(value: unknown, path: string): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 100) {
    throw new Error(`${path} must be nonempty text of 100 characters or fewer.`);
  }
  return value.trim();
}

function index(value: unknown, length: number, path: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value >= length) {
    throw new Error(`${path} is invalid.`);
  }
  return value;
}

function exportedAt(value: unknown, legacy = false): string {
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) return value;
  if (legacy) return new Date().toISOString();
  throw new Error("The export timestamp in this file is invalid.");
}

function portableWorld(value: unknown, project: M1ProjectDocument, displacedFleet: readonly FleetVehicle[], path: string): PortableWorld {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error(`${path} must be an object.`);
  const source = value as Record<string, unknown>;
  if (!Array.isArray(source.scenarios) || !source.scenarios.length) throw new Error(`${path} must contain at least one scenario.`);

  const scene = normalizeSceneDocument(source.document, `${path}.document`);
  // A legacy file stored its fleet on the project; those vehicles land in this depot.
  const placed = displacedFleet.length ? placeMigratedFleet(displacedFleet, project.vehiclePresets, scene.objects) : [];
  const document = placed.length ? { ...scene, objects: [...scene.objects, ...placed] } : scene;
  const fleet = fleetFromDocument(document);

  const scenarios = source.scenarios.map((scenario, scenarioIndex) => {
    const scenarioPath = `${path}.scenarios[${scenarioIndex}]`;
    if (typeof scenario !== "object" || scenario === null || Array.isArray(scenario)) throw new Error(`${scenarioPath} must be an object.`);
    const item = scenario as Record<string, unknown>;
    const scenarioDocument = normalizeScenarioDocument(item.document, `${scenarioPath}.document`, fleet);
    validateScenarioReferences(project, fleet, scenarioDocument, `${scenarioPath}.document`);
    return { name: nonEmptyName(item.name, `${scenarioPath}.name`), document: scenarioDocument };
  });
  return {
    name: nonEmptyName(source.name, `${path}.name`),
    document,
    scenarios,
  };
}

export function parsePortableProject(value: unknown): PortableProjectFile {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("This file is not a Fleet Transition Planner project.");
  const source = value as Record<string, unknown>;
  if (source.format !== PORTABLE_PROJECT_FORMAT || (source.version !== 1 && source.version !== PORTABLE_PROJECT_VERSION)) {
    throw new Error("This project file uses an unsupported format or version.");
  }
  if (typeof source.project !== "object" || source.project === null || Array.isArray(source.project)) throw new Error("The project file is incomplete.");
  const projectSource = source.project as Record<string, unknown>;
  const rawProjectDocument = projectSource.document;
  const { document: projectDocument, displacedFleet } = readProjectDocument(rawProjectDocument, "project.document");
  const project = { name: nonEmptyName(projectSource.name, "project.name"), document: projectDocument };

  // Backward-compatible import of the previous single-world export format.
  if (source.version === 1) {
    if (!Array.isArray(source.scenarios)) throw new Error("The project file is incomplete.");
    if (typeof source.world !== "object" || source.world === null || Array.isArray(source.world)) throw new Error("The project file is incomplete.");
    const worldSource = source.world as Record<string, unknown>;
    const world = portableWorld({ ...worldSource, scenarios: source.scenarios }, projectDocument, displacedFleet, "world");
    return {
      format: PORTABLE_PROJECT_FORMAT,
      version: PORTABLE_PROJECT_VERSION,
      exportedAt: exportedAt(source.exportedAt, true),
      project,
      worlds: [world],
      activeWorldIndex: 0,
      activeScenarioIndex: index(source.activeScenarioIndex, world.scenarios.length, "The active scenario in this file"),
    };
  }

  if (!Array.isArray(source.worlds) || !source.worlds.length) throw new Error("The world data in this file is invalid.");
  const worlds = source.worlds.map((world, worldIndex) => portableWorld(world, projectDocument, worldIndex === 0 ? displacedFleet : [], `worlds[${worldIndex}]`));
  const activeWorldIndex = index(source.activeWorldIndex, worlds.length, "The active world in this file");
  const activeScenarioIndex = index(source.activeScenarioIndex, worlds[activeWorldIndex].scenarios.length, "The active scenario in this file");
  return {
    format: PORTABLE_PROJECT_FORMAT,
    version: PORTABLE_PROJECT_VERSION,
    exportedAt: exportedAt(source.exportedAt),
    project,
    worlds,
    activeWorldIndex,
    activeScenarioIndex,
  };
}

export function createPortableProject(input: {
  projectName: string;
  projectDocument: ProjectDocument;
  worlds: PortableWorldInput[];
  activeWorldIndex: number;
  activeScenarioIndex: number;
}): PortableProjectFile {
  const projectDocument = readProjectDocument(input.projectDocument).document;
  const worlds = input.worlds.map((world, worldIndex) => portableWorld(world, projectDocument, [], `worlds[${worldIndex}]`));
  const activeWorldIndex = index(input.activeWorldIndex, worlds.length, "The active world");
  const activeScenarioIndex = index(input.activeScenarioIndex, worlds[activeWorldIndex].scenarios.length, "The active scenario");
  return {
    format: PORTABLE_PROJECT_FORMAT,
    version: PORTABLE_PROJECT_VERSION,
    exportedAt: new Date().toISOString(),
    project: { name: nonEmptyName(input.projectName, "project.name"), document: clone(projectDocument) },
    worlds: clone(worlds),
    activeWorldIndex,
    activeScenarioIndex,
  };
}

export function projectFileName(name: string) {
  const safe = name.trim().replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "fleet-project";
  return `${safe}.fleetproject`;
}

export function downloadPortableProject(file: PortableProjectFile) {
  const canonical = parsePortableProject(file);
  const blob = new Blob([JSON.stringify(canonical, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = projectFileName(canonical.project.name);
  anchor.click();
  URL.revokeObjectURL(url);
}
