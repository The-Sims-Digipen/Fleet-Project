import type { SceneDocument } from "../scene/types";
import type {
  M1ProjectDocument,
  M1ScenarioDocument,
  ScenarioVehiclePlan as DomainScenarioVehiclePlan,
} from "../domain/contracts";

export const NAME_MAX_LENGTH = 100;

export type ScenarioVehiclePlan = DomainScenarioVehiclePlan;

export type LegacyScenarioDocument = {
  version: 1;
  /** Scenario-specific transition decisions keyed by shared fleet vehicle id. */
  vehiclePlans?: Record<string, ScenarioVehiclePlan>;
} & Record<string, unknown>;
export type ScenarioDocument = LegacyScenarioDocument | M1ScenarioDocument;

/** Version 2 presets predate the M1 preset fields, so their records are untrusted here. */
export type LegacyProjectDocument = { version: 2; vehiclePresets: unknown[] };
export type ProjectDocument = LegacyProjectDocument | M1ProjectDocument;

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
  scenarios: WorkspaceScenario[];
};

/**
 * A scenario held in the in-memory workspace. Stored documents may still be
 * legacy version 1, but T03 upgrades them at the persistence boundary, so every
 * scenario a feature reads is the authoritative M1 shape.
 */
export type WorkspaceScenario = Omit<Scenario, "document"> & { document: M1ScenarioDocument };

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
  project: { id: string; name: string; expectedRevision?: number; activeWorldId: string; document: ProjectDocument };
  worlds: { id: string; name: string; expectedRevision: number; document: SceneDocument }[];
  scenarios: { id: string; worldId: string; name: string; expectedRevision: number; document: ScenarioDocument }[];
};

export function validateName(value: string): string | null {
  const name = value.trim();
  if (!name) return "Name is required.";
  if (name.length > NAME_MAX_LENGTH) return `Name must be ${NAME_MAX_LENGTH} characters or fewer.`;
  return null;
}
