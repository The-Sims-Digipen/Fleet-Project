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
  vehiclePresetCompatible: boolean;
  createModel: () => Group;
  transform: Transform;
};

export const objectDefinitions = {
  van: {
    kind: "procedural",
    name: "Low-poly Van",
    vehiclePresetCompatible: true,
    createModel: createVanModel,
    transform: identityTransform(),
  },

  depot: {
    kind: "procedural",
    name: "Depot",
    vehiclePresetCompatible: false,
    createModel: createDepotModel,
    transform: identityTransform(),
  },
} satisfies Record<string, ObjectDefinition>;

/** Catalog entries that vehicle presets may use as their rendered geometry. */
export const vehicleModelEntries = Object.entries(objectDefinitions)
  .filter(([, definition]) => definition.vehiclePresetCompatible);

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
  presetId?: string,
  name?: string,
): SceneObject | undefined {
  const definition = getDefinition(definitionId);

  if (!definition) return;

  return {
    id,
    name: name?.trim() || definition.name,
    definitionId,
    ...(presetId ? { presetId } : {}),
    transform: copyTransform(definition.transform),
    appearance: {},
  };
}
