import { copyTransform, identityTransform, type ModelAsset, type ObjectDefinition, type SceneObject } from "./types";

export const modelAssets: Readonly<Record<string, ModelAsset>> = {
  "sample-bollard": { url: `${import.meta.env.BASE_URL}models/sample-bollard.glb`, correction: identityTransform() },
};

export const objectDefinitions = {
  bollard: { kind: "model", name: "Bollard", assetId: "sample-bollard", transform: identityTransform() },
} satisfies Record<string, ObjectDefinition>;

export function getDefinition(id: string): ObjectDefinition | undefined {
  return Object.hasOwn(objectDefinitions, id) ? objectDefinitions[id as keyof typeof objectDefinitions] : undefined;
}

export function getAsset(id: string): ModelAsset | undefined {
  return Object.hasOwn(modelAssets, id) ? modelAssets[id] : undefined;
}

export function createObject(definitionId: string, id: string): SceneObject | undefined {
  const definition = getDefinition(definitionId);
  if (!definition || !getAsset(definition.assetId)) return;
  return { id, name: definition.name, definitionId, transform: copyTransform(definition.transform), appearance: {} };
}
