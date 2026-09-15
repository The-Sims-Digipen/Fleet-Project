import type { SceneDocument } from "../scene/types";

export const NAME_MAX_LENGTH = 100;

/** An independent transition plan. Schedules and charging settings will be added here. */
export type Scenario = { id: string; name: string; scene: SceneDocument };

/** Saved project inputs. Camera, selection, undo history, and derived results are never stored. */
export type ProjectDocument = { version: 1; scenarios: Scenario[] };

/** Mirrors the planned `/api/v1/projects` record so the backend can replace the in-memory repository. */
export type ProjectRecord = {
  id: string;
  name: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  document: ProjectDocument;
};

export type ProjectSummary = Pick<ProjectRecord, "id" | "name" | "revision" | "updatedAt"> & { scenarioCount: number };

/** Returns a readable error, or null when the trimmed name is valid. */
export function validateName(value: string): string | null {
  const name = value.trim();
  if (!name) return "Name is required.";
  if (name.length > NAME_MAX_LENGTH) return `Name must be ${NAME_MAX_LENGTH} characters or fewer.`;
  return null;
}
