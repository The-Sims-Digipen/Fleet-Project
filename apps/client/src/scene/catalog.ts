import type { Group } from "three";
import { createVanModel } from "../models/van";
import { copyTransform, identityTransform, type SceneObject, type Transform } from "./types";

export type ObjectDefinition = { kind: "procedural"; name: string; createModel: () => Group; transform: Transform };

export const objectDefinitions = {
  van: { kind: "procedural", name: "Low-poly Van", createModel: createVanModel, transform: identityTransform() },
} satisfies Record<string, ObjectDefinition>;

export function getDefinition(id: string): ObjectDefinition | undefined {
  return Object.hasOwn(objectDefinitions, id) ? objectDefinitions[id as keyof typeof objectDefinitions] : undefined;
}

export function createObject(definitionId: string, id: string, presetId?: string, name?: string): SceneObject | undefined {
  const definition = getDefinition(definitionId);
  if (!definition) return;
  return { id, name: name?.trim() || definition.name, definitionId, ...(presetId ? { presetId } : {}), transform: copyTransform(definition.transform), appearance: {} };
}
