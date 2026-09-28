import { normalizeProjectV5, type ProjectDocumentV5 } from "../domain/projectV5";

export const PORTABLE_PROJECT_FORMAT = "fleet-transition-planner-project";
export const PORTABLE_PROJECT_VERSION = 4;

export type PortableProjectFile = {
  format: typeof PORTABLE_PROJECT_FORMAT;
  version: typeof PORTABLE_PROJECT_VERSION;
  exportedAt: string;
  document: ProjectDocumentV5;
};

export function parsePortableProject(value: unknown): PortableProjectFile {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("This file is not a Fleet Transition Planner project.");
  const source = value as Record<string, unknown>;
  if (source.format !== PORTABLE_PROJECT_FORMAT || source.version !== PORTABLE_PROJECT_VERSION) {
    throw new Error("This project file uses an unsupported format or version.");
  }
  if (typeof source.exportedAt !== "string" || Number.isNaN(Date.parse(source.exportedAt))) throw new Error("The export timestamp in this file is invalid.");
  return {
    format: PORTABLE_PROJECT_FORMAT,
    version: PORTABLE_PROJECT_VERSION,
    exportedAt: source.exportedAt,
    document: normalizeProjectV5(source.document),
  };
}

export function createPortableProject(document: ProjectDocumentV5): PortableProjectFile {
  return parsePortableProject({
    format: PORTABLE_PROJECT_FORMAT,
    version: PORTABLE_PROJECT_VERSION,
    exportedAt: new Date().toISOString(),
    document,
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
  anchor.download = projectFileName(canonical.document.name);
  anchor.click();
  URL.revokeObjectURL(url);
}
