import type { SceneDocument } from "../scene/types";
import type { VehiclePreset } from "../vehicles/types";

export const NAME_MAX_LENGTH = 100;

export type ScenarioDocument = { version: 1 } & Record<string, unknown>;
export type ProjectDocument = { version: 2; vehiclePresets: VehiclePreset[] };

export type WorldRecord = {
  id: string;
  name: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  document: SceneDocument;
};

export type Scenario = {
  id: string;
  worldId: string;
  name: string;
  revision: number;
  worldRevision: number;
  createdAt?: string;
  updatedAt?: string;
  document: ScenarioDocument;
};

export type ProjectRecord = {
  id: string;
  worldId: string;
  name: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  document: ProjectDocument;
};

export type WorkspaceRecord = { project: ProjectRecord; world: WorldRecord; scenarios: Scenario[] };
export type ProjectSummary = Pick<ProjectRecord, "id" | "worldId" | "name" | "revision" | "updatedAt"> & { scenarioCount: number };
export type WorldSummary = Pick<WorldRecord, "id" | "name" | "revision" | "updatedAt">;

export type WorkspaceSaveInput = {
  project: { id: string; name: string; expectedRevision?: number; document: ProjectDocument };
  world: { id: string; name: string; expectedRevision: number; document: SceneDocument };
  scenarios: { id: string; name: string; expectedRevision: number; document: ScenarioDocument }[];
};

export function validateName(value: string): string | null {
  const name = value.trim();
  if (!name) return "Name is required.";
  if (name.length > NAME_MAX_LENGTH) return `Name must be ${NAME_MAX_LENGTH} characters or fewer.`;
  return null;
}
