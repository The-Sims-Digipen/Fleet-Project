import type { SceneDocument } from "../scene/types";
import type { VehiclePreset } from "../vehicles/types";

export const NAME_MAX_LENGTH = 100;

export type ScenarioVehiclePlan = {
  transitionYear?: number | null;
  targetPresetId?: string;
};

export type ScenarioDocument = {
  version: 1;
  /** Scenario-specific transition decisions keyed by shared fleet vehicle id. */
  vehiclePlans?: Record<string, ScenarioVehiclePlan>;
} & Record<string, unknown>;
export type ProjectDocument = { version: 2; vehiclePresets: VehiclePreset[] };

export type WorldRecord = {
  id: string;
  name: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  document: SceneDocument;
};

export type WorkspaceWorld = Omit<WorldRecord, "createdAt" | "updatedAt"> & {
  createdAt?: string;
  updatedAt?: string;
  scenarios: Scenario[];
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
  /** The world that was active when the project was last saved. */
  worldId: string;
  /**
   * The scenario that was active when the project was last saved. Optional so records written
   * before this field existed still load; reopening falls back to the world's first scenario.
   */
  activeScenarioId?: string;
  name: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  document: ProjectDocument;
};

export type WorkspaceRecord = { project: ProjectRecord; worlds: WorldRecord[]; scenarios: Scenario[] };
export type ProjectSummary = Pick<ProjectRecord, "id" | "worldId" | "name" | "revision" | "updatedAt"> & { scenarioCount: number; worldCount?: number };
export type WorldSummary = Pick<WorldRecord, "id" | "name" | "revision" | "updatedAt">;

export type WorkspaceSaveInput = {
  project: { id: string; name: string; expectedRevision?: number; activeWorldId: string; activeScenarioId?: string; document: ProjectDocument };
  worlds: { id: string; name: string; expectedRevision: number; document: SceneDocument }[];
  scenarios: { id: string; worldId: string; name: string; expectedRevision: number; document: ScenarioDocument }[];
};

export function validateName(value: string): string | null {
  const name = value.trim();
  if (!name) return "Name is required.";
  if (name.length > NAME_MAX_LENGTH) return `Name must be ${NAME_MAX_LENGTH} characters or fewer.`;
  return null;
}
