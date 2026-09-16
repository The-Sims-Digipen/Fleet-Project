import { z } from "zod";

const name = z.string().trim().min(1).max(100);
const uuid = z.string().uuid();
const finite = z.number().finite();
const nonnegative = finite.nonnegative();
const vector3 = z.tuple([finite, finite, finite]);
const transform = z.object({ position: vector3, rotation: vector3, scale: vector3 });
const appearance = z.object({
  tint: z.string().optional(),
  material: z.enum(["matte", "glossy", "metal"]).optional(),
  wireframe: z.boolean().optional(),
});
const sceneObject = z.object({
  id: z.string().min(1),
  name,
  definitionId: z.string().min(1),
  presetId: z.string().min(1).optional(),
  transform,
  appearance,
});

export const worldDocumentSchema = z.object({
  version: z.literal(3),
  objects: z.array(sceneObject),
  light: finite.min(0).max(100),
});

const vehiclePreset = z.object({
  id: z.string().min(1),
  name,
  category: name,
  propulsion: z.enum(["diesel", "petrol", "electric", "hybrid"]),
  modelId: z.string().min(1),
  litresPer100Km: nonnegative,
  kWhPer100Km: nonnegative,
  batteryCapacityKWh: nonnegative,
  chargingPowerKW: nonnegative,
  purchaseCost: nonnegative,
});

export const projectDocumentSchema = z.object({
  version: z.literal(2),
  vehiclePresets: z.array(vehiclePreset),
});

export const scenarioDocumentSchema = z.object({
  version: z.literal(1),
}).passthrough();

export const createWorkspaceSchema = z.object({
  project: z.object({ id: uuid, name, document: projectDocumentSchema }),
  world: z.object({ id: uuid, name, expectedRevision: z.number().int().nonnegative(), document: worldDocumentSchema }),
  scenarios: z.array(z.object({ id: uuid, name, expectedRevision: z.number().int().nonnegative(), document: scenarioDocumentSchema })).min(1),
});

export const updateWorkspaceSchema = createWorkspaceSchema.extend({
  project: createWorkspaceSchema.shape.project.extend({ expectedRevision: z.number().int().positive() }),
});

export const createWorldSchema = z.object({ id: uuid, name, document: worldDocumentSchema });
export const updateWorldSchema = createWorldSchema.omit({ id: true }).extend({ expectedRevision: z.number().int().positive() });
export const createScenarioSchema = z.object({ id: uuid, worldId: uuid, name, document: scenarioDocumentSchema });
export const updateScenarioSchema = z.object({ expectedRevision: z.number().int().positive(), name, document: scenarioDocumentSchema });

export type WorldDocument = z.infer<typeof worldDocumentSchema>;
export type ProjectDocument = z.infer<typeof projectDocumentSchema>;
export type ScenarioDocument = z.infer<typeof scenarioDocumentSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
