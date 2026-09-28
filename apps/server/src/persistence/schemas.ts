import { z } from "zod";

const name = z.string().trim().min(1).max(100);
const uuid = z.string().uuid();
const identifier = z.string().trim().min(1).refine((value) => !["__proto__", "constructor", "prototype"].includes(value));
const finite = z.number().finite();
const nonnegative = finite.nonnegative();
const vector3 = z.tuple([finite, finite, finite]);
const transform = z.object({
  position: vector3,
  rotation: vector3,
  scale: vector3.refine((value) => value.every((item) => item > 0), "Scale values must be positive."),
});
const appearance = z.object({
  tint: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  material: z.enum(["matte", "glossy", "metal"]).optional(),
  wireframe: z.boolean().optional(),
});
const sceneObject = z.object({
  id: identifier,
  name,
  definitionId: identifier,
  presetId: identifier.optional(),
  transform,
  appearance,
});

export const sceneDocumentSchema = z.object({
  version: z.literal(3),
  objects: z.array(sceneObject),
  light: finite.min(0).max(100),
}).superRefine((document, context) => {
  if (!document.objects.some((object) => object.id === "default-project-depot" && object.definitionId === "depot")) {
    context.addIssue({ code: "custom", message: "The Project scene must contain the default depot.", path: ["objects"] });
  }
  if (new Set(document.objects.map((object) => object.id)).size !== document.objects.length) {
    context.addIssue({ code: "custom", message: "Scene object ids must be unique.", path: ["objects"] });
  }
});

const ownershipTerms = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("owned"), endResidualValue: nonnegative }),
  z.object({ kind: z.literal("leased"), annualPayment: nonnegative, exitFee: nonnegative }),
]);

const vehiclePreset = z.object({
  id: identifier,
  name,
  category: name,
  propulsion: z.enum(["diesel", "petrol", "electric", "hybrid"]),
  modelId: identifier,
  litresPer100Km: nonnegative,
  kWhPer100Km: nonnegative,
  batteryCapacityKWh: nonnegative,
  chargingPowerKW: nonnegative,
  purchaseCost: nonnegative,
  maintenanceCostPerYear: nonnegative,
  rangeKm: nonnegative.nullable(),
  chargingEfficiency: finite.positive().max(1),
  acquisition: ownershipTerms,
});

const currentHolding = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("owned"), currentValue: nonnegative, endResidualValue: nonnegative }),
  z.object({ kind: z.literal("leased"), annualPayment: nonnegative, exitFee: nonnegative }),
]);

const parkingLotId = z.string().regex(/^parking-lot-(0[1-9]|10)$/);
const fleetVehicle = z.object({
  id: identifier,
  name,
  presetId: identifier.nullable(),
  parkingLotId,
  annualKm: nonnegative,
  typicalDailyKm: nonnegative,
  operatingDays: z.number().int().min(0).max(366),
  utilisation: finite.min(0).max(1),
  routePattern: z.enum(["predictable", "variable"]),
  returnsToDepot: z.boolean(),
  depotDwellHours: finite.min(0).max(24),
  externalChargingAccess: z.boolean(),
  replacementYear: z.number().int().nullable(),
  currentHolding,
});

const analysis = z.object({
  startYear: z.number().int(),
  yearCount: z.number().int().positive(),
  currency: z.string().trim().min(1).max(12),
  fuelPricePerLitre: nonnegative,
  fuelEmissionsKgCo2ePerLitre: nonnegative,
  electricityEmissionsKgCo2ePerKWh: nonnegative,
});

export const projectDocumentSchema = z.object({
  version: z.literal(4),
  scene: sceneDocumentSchema,
  vehiclePresets: z.array(vehiclePreset),
  fleetVehicles: z.array(fleetVehicle).max(10),
  analysis,
}).superRefine((project, context) => {
  const presetIds = new Set(project.vehiclePresets.map((preset) => preset.id));
  if (presetIds.size !== project.vehiclePresets.length) context.addIssue({ code: "custom", message: "Vehicle preset ids must be unique.", path: ["vehiclePresets"] });
  const vehicleIds = new Set<string>();
  const occupiedLots = new Set<string>();
  project.fleetVehicles.forEach((vehicle, index) => {
    if (vehicleIds.has(vehicle.id)) context.addIssue({ code: "custom", message: "Vehicle ids must be unique.", path: ["fleetVehicles", index, "id"] });
    vehicleIds.add(vehicle.id);
    if (occupiedLots.has(vehicle.parkingLotId)) context.addIssue({ code: "custom", message: "A parking lot may hold only one vehicle.", path: ["fleetVehicles", index, "parkingLotId"] });
    occupiedLots.add(vehicle.parkingLotId);
    if (vehicle.presetId !== null && !presetIds.has(vehicle.presetId)) context.addIssue({ code: "custom", message: "Vehicle preset must resolve inside this Project.", path: ["fleetVehicles", index, "presetId"] });
  });
});

const scenarioPlan = z.object({
  transitionYear: z.number().int().nullable().optional(),
  targetPresetId: identifier.optional(),
}).superRefine((plan, context) => {
  if (plan.transitionYear !== undefined && plan.transitionYear !== null && !plan.targetPresetId) {
    context.addIssue({ code: "custom", message: "A scheduled transition requires a target preset.", path: ["targetPresetId"] });
  }
});
export const scenarioDocumentSchema = z.object({
  version: z.literal(2),
  vehiclePlans: z.record(identifier, scenarioPlan),
  assumptions: z.object({
    chargingStrategy: z.enum(["depot", "external", "mixed"]),
    depotChargingShare: finite.min(0).max(1),
    depotElectricityPricePerKWh: nonnegative,
    externalElectricityPricePerKWh: nonnegative,
  }),
});

const projectDraft = z.object({ id: uuid, name, document: projectDocumentSchema });
const scenarioDraft = z.object({ id: uuid, name, expectedRevision: z.number().int().nonnegative(), document: scenarioDocumentSchema });
const workspaceBase = z.object({ project: projectDraft, scenarios: z.array(scenarioDraft).min(1) });

function validateReferences(input: z.infer<typeof workspaceBase>, context: z.RefinementCtx) {
  const vehicleIds = new Set(input.project.document.fleetVehicles.map((vehicle) => vehicle.id));
  const presetIds = new Set(input.project.document.vehiclePresets.map((preset) => preset.id));
  const start = input.project.document.analysis.startYear;
  const end = start + input.project.document.analysis.yearCount - 1;
  input.scenarios.forEach((scenario, scenarioIndex) => {
    Object.entries(scenario.document.vehiclePlans).forEach(([vehicleId, plan]) => {
      if (!vehicleIds.has(vehicleId)) context.addIssue({ code: "custom", message: "Scenario vehicle must resolve inside this Project.", path: ["scenarios", scenarioIndex, "document", "vehiclePlans", vehicleId] });
      if (plan.targetPresetId && !presetIds.has(plan.targetPresetId)) context.addIssue({ code: "custom", message: "Scenario target preset must resolve inside this Project.", path: ["scenarios", scenarioIndex, "document", "vehiclePlans", vehicleId, "targetPresetId"] });
      if (plan.transitionYear !== undefined && plan.transitionYear !== null && (plan.transitionYear < start || plan.transitionYear > end)) context.addIssue({ code: "custom", message: "Transition year must be inside the analysis period.", path: ["scenarios", scenarioIndex, "document", "vehiclePlans", vehicleId, "transitionYear"] });
    });
  });
}

export const createWorkspaceSchema = workspaceBase.superRefine(validateReferences);
export const updateWorkspaceSchema = workspaceBase.extend({
  project: projectDraft.extend({ expectedRevision: z.number().int().positive() }),
}).superRefine(validateReferences);

export type ProjectDocument = z.infer<typeof projectDocumentSchema>;
export type ScenarioDocument = z.infer<typeof scenarioDocumentSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
