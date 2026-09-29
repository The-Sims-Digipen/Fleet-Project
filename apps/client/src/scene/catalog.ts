import type { Group } from "three";

import { createDepotModel } from "../models/depot";
import { createVanModel } from "../models/van";

export type ModelDefinition = {
  name: string;
  vehiclePresetCompatible: boolean;
  createModel: () => Group;
};

export const modelDefinitions = {
  van: {
    name: "Low-poly Van",
    vehiclePresetCompatible: true,
    createModel: createVanModel,
  },

  depot: {
    name: "Depot",
    vehiclePresetCompatible: false,
    createModel: createDepotModel,
  },
} satisfies Record<string, ModelDefinition>;

/** Model options that can render a Vehicle Preset. */
export const vehicleModelEntries = Object.entries(modelDefinitions)
  .filter(([, definition]) => definition.vehiclePresetCompatible)
  .map(([id, definition]) => ({ id, name: definition.name }));

export function getModelDefinition(
  id: string,
): ModelDefinition | undefined {
  return Object.hasOwn(modelDefinitions, id)
    ? modelDefinitions[id as keyof typeof modelDefinitions]
    : undefined;
}
