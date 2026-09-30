import type { ProjectDocument } from "../domain/project";

export const NAME_MAX_LENGTH = 100;

/** Persistence metadata is deliberately outside the undoable Project document. */
export type ProjectRecord = {
  document: ProjectDocument;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectSummary = {
  id: string;
  name: string;
  revision: number;
  updatedAt: string;
  scenarioCount: number;
};

export function validateName(value: string): string | null {
  const name = value.trim();
  if (!name) return "Name is required.";
  if (name.length > NAME_MAX_LENGTH) return `Name must be ${NAME_MAX_LENGTH} characters or fewer.`;
  return null;
}
