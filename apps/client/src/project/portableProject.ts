import type { M1ProjectDocument, M1ScenarioDocument } from "../domain/contracts";
import { normalizeProjectDocument, normalizeScenarioDocument, validateScenarioReferences } from "./serialization";
import type { ProjectDocument, ScenarioDocument } from "./types";

export const PORTABLE_PROJECT_FORMAT = "fleet-transition-planner-project";
export const PORTABLE_PROJECT_VERSION = 3;

export type PortableProjectFile = {
  format: typeof PORTABLE_PROJECT_FORMAT;
  version: typeof PORTABLE_PROJECT_VERSION;
  exportedAt: string;
  project: { name: string; document: M1ProjectDocument };
  scenarios: { name: string; document: M1ScenarioDocument }[];
  activeScenarioIndex: number;
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

function nonEmptyName(value: unknown, path: string): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 100) throw new Error(`${path} must be nonempty text of 100 characters or fewer.`);
  return value.trim();
}

function index(value: unknown, length: number, path: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value >= length) throw new Error(`${path} is invalid.`);
  return value;
}

export function parsePortableProject(value: unknown): PortableProjectFile {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("This file is not a Fleet Transition Planner project.");
  const source = value as Record<string, unknown>;
  if (source.format !== PORTABLE_PROJECT_FORMAT || source.version !== PORTABLE_PROJECT_VERSION) {
    throw new Error("This project file uses an unsupported format or version.");
  }
  if (typeof source.exportedAt !== "string" || Number.isNaN(Date.parse(source.exportedAt))) throw new Error("The export timestamp in this file is invalid.");
  if (typeof source.project !== "object" || source.project === null || Array.isArray(source.project)) throw new Error("The project file is incomplete.");
  const rawProject = source.project as Record<string, unknown>;
  const project = { name: nonEmptyName(rawProject.name, "project.name"), document: normalizeProjectDocument(rawProject.document, "project.document") };
  if (!Array.isArray(source.scenarios) || !source.scenarios.length) throw new Error("The project must contain at least one scenario.");
  const scenarios = source.scenarios.map((scenario, scenarioIndex) => {
    if (typeof scenario !== "object" || scenario === null || Array.isArray(scenario)) throw new Error(`scenarios[${scenarioIndex}] must be an object.`);
    const item = scenario as Record<string, unknown>;
    const document = normalizeScenarioDocument(item.document, `scenarios[${scenarioIndex}].document`);
    validateScenarioReferences(project.document, document, `scenarios[${scenarioIndex}].document`);
    return { name: nonEmptyName(item.name, `scenarios[${scenarioIndex}].name`), document };
  });
  return {
    format: PORTABLE_PROJECT_FORMAT,
    version: PORTABLE_PROJECT_VERSION,
    exportedAt: source.exportedAt,
    project,
    scenarios,
    activeScenarioIndex: index(source.activeScenarioIndex, scenarios.length, "The active scenario in this file"),
  };
}

export function createPortableProject(input: {
  projectName: string;
  projectDocument: ProjectDocument;
  scenarios: { name: string; document: ScenarioDocument }[];
  activeScenarioIndex: number;
}): PortableProjectFile {
  return parsePortableProject({
    format: PORTABLE_PROJECT_FORMAT,
    version: PORTABLE_PROJECT_VERSION,
    exportedAt: new Date().toISOString(),
    project: { name: input.projectName, document: clone(input.projectDocument) },
    scenarios: clone(input.scenarios),
    activeScenarioIndex: input.activeScenarioIndex,
  });
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
