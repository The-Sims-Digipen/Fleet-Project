import type { Group } from "three";

import { createDepotModel } from "../models/depot";
import { createVanModel } from "../models/van";

import {
  copyTransform,
  identityTransform,
  type SceneObject,
  type Transform,
} from "./types";

export type ObjectDefinition = {
  kind: "procedural";
  name: string;
  createModel: () => Group;
  transform: Transform;
};

export const objectDefinitions = {
  van: {
    kind: "procedural",
    name: "Low-poly Van",
    createModel: createVanModel,
    transform: identityTransform(),
  },

  depot: {
    kind: "procedural",
    name: "Depot",
    createModel: createDepotModel,
    transform: identityTransform(),
  },
} satisfies Record<string, ObjectDefinition>;

export function getDefinition(
  id: string,
): ObjectDefinition | undefined {
  return Object.hasOwn(objectDefinitions, id)
    ? objectDefinitions[id as keyof typeof objectDefinitions]
    : undefined;
}

export function createObject(
  definitionId: string,
  id: string,
): SceneObject | undefined {
  const definition = getDefinition(definitionId);

  if (!definition) return;

  return {
    id,
    name: definition.name,
    definitionId,
    transform: copyTransform(definition.transform),
    appearance: {},
  };
}
