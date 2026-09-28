import type { M1ProjectDocument, M1ScenarioDocument, ScenarioVehiclePlan as DomainScenarioVehiclePlan } from "../domain/contracts";

export const NAME_MAX_LENGTH = 100;

export type ScenarioVehiclePlan = DomainScenarioVehiclePlan;
export type ProjectDocument = M1ProjectDocument;
export type ScenarioDocument = M1ScenarioDocument;

export type Scenario = {
  id: string;
  projectId: string;
  name: string;
  position: number;
  revision: number;
  createdAt?: string;
  updatedAt?: string;
  document: ScenarioDocument;
};

export type WorkspaceScenario = Scenario;

export type ProjectRecord = {
  id: string;
  name: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  document: ProjectDocument;
};

export type WorkspaceRecord = { project: ProjectRecord; scenarios: Scenario[] };
export type ProjectSummary = Pick<ProjectRecord, "id" | "name" | "revision" | "updatedAt"> & { scenarioCount: number };

export type WorkspaceSaveInput = {
  project: { id: string; name: string; expectedRevision?: number; document: ProjectDocument };
  scenarios: { id: string; name: string; expectedRevision: number; document: ScenarioDocument }[];
};

export function validateName(value: string): string | null {
  const name = value.trim();
  if (!name) return "Name is required.";
  if (name.length > NAME_MAX_LENGTH) return `Name must be ${NAME_MAX_LENGTH} characters or fewer.`;
  return null;
}
