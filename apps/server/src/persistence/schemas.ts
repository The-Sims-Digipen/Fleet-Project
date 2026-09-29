import { z } from "zod";

const name = z.string().trim().min(1).max(100);
const uuid = z.string().uuid();
const reservedIdentifiers = new Set(["__proto__", "constructor", "prototype"]);
const identifier = z.string().min(1).refine((value) => value.trim().length > 0 && !reservedIdentifiers.has(value));
const presetIdentifier = z.string().min(1).max(100).refine((value) => value.trim().length > 0 && !reservedIdentifiers.has(value));
const presetText = z.string().min(1).max(100).refine((value) => value.trim().length > 0).transform((value) => value.trim());
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
  id: presetIdentifier,
  name: presetText,
  category: presetText,
  propulsion: z.enum(["diesel", "petrol", "electric", "hybrid"]),
  modelId: presetIdentifier,
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

const projectVehicle = z.object({
  id: identifier,
  name,
  baselinePresetId: identifier.nullable(),
  transform,
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

const projectAnalysis = z.object({
  startYear: z.number().int(),
  yearCount: z.number().int().positive(),
  currency: z.string().trim().min(1).max(8),
  fuelPricePerLitre: nonnegative,
  electricityPricePerKWh: nonnegative,
  fuelEmissionsKgCo2ePerLitre: nonnegative,
  electricityEmissionsKgCo2ePerKWh: nonnegative,
  discountRate: finite.min(0).max(1),
});

const projectScenario = z.object({
  id: identifier,
  name,
  vehiclePlans: z.record(identifier, z.object({
    transitions: z.array(z.object({ year: z.number().int(), targetPresetId: identifier })),
  })),
});

function uniqueValues(values: readonly string[], context: z.RefinementCtx, path: (string | number)[], message: string) {
  if (new Set(values).size !== values.length) context.addIssue({ code: "custom", message, path });
}

export const projectDocumentSchema = z.object({
  version: z.literal(5),
  id: identifier,
  name,
  activeScenarioId: identifier,
  environment: z.object({
    depot: z.object({ id: identifier, name, transform }),
    vehicles: z.array(projectVehicle).max(10),
  }),
  vehiclePresets: z.array(vehiclePreset),
  scenarios: z.array(projectScenario).min(1),
  analysis: projectAnalysis,
}).superRefine((project, context) => {
  const presetIds = new Set(project.vehiclePresets.map((preset) => preset.id));
  const vehicleIds = new Set(project.environment.vehicles.map((vehicle) => vehicle.id));
  const scenarioIds = new Set(project.scenarios.map((scenario) => scenario.id));
  uniqueValues(project.vehiclePresets.map((preset) => preset.id), context, ["vehiclePresets"], "Vehicle Preset ids must be unique.");
  uniqueValues(project.environment.vehicles.map((vehicle) => vehicle.id), context, ["environment", "vehicles"], "Vehicle ids must be unique.");
  uniqueValues(project.scenarios.map((scenario) => scenario.id), context, ["scenarios"], "Scenario ids must be unique.");
  if (!scenarioIds.has(project.activeScenarioId)) {
    context.addIssue({ code: "custom", message: "The active Scenario must resolve inside this Project.", path: ["activeScenarioId"] });
  }

  project.environment.vehicles.forEach((vehicle, vehicleIndex) => {
    if (vehicle.baselinePresetId !== null && !presetIds.has(vehicle.baselinePresetId)) {
      context.addIssue({ code: "custom", message: "Vehicle baseline Preset must resolve inside this Project.", path: ["environment", "vehicles", vehicleIndex, "baselinePresetId"] });
    }
  });
  project.scenarios.forEach((scenario, scenarioIndex) => {
    for (const [vehicleId, plan] of Object.entries(scenario.vehiclePlans)) {
      const planPath = ["scenarios", scenarioIndex, "vehiclePlans", vehicleId];
      if (!vehicleIds.has(vehicleId)) {
        context.addIssue({ code: "custom", message: "Scenario Vehicle must resolve inside this Project.", path: planPath });
      }
      const years = new Set<number>();
      plan.transitions.forEach((transition, transitionIndex) => {
        if (!presetIds.has(transition.targetPresetId)) {
          context.addIssue({ code: "custom", message: "Scenario target Preset must resolve inside this Project.", path: [...planPath, "transitions", transitionIndex, "targetPresetId"] });
        }
        if (years.has(transition.year)) {
          context.addIssue({ code: "custom", message: "Transition years must be unique for each Vehicle.", path: [...planPath, "transitions", transitionIndex, "year"] });
        }
        years.add(transition.year);
        if (transitionIndex > 0 && plan.transitions[transitionIndex - 1].year >= transition.year) {
          context.addIssue({ code: "custom", message: "Transitions must be ordered by ascending year.", path: [...planPath, "transitions", transitionIndex, "year"] });
        }
      });
    }
  });
});

const legacyProjectDocumentSchema = z.object({
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

const projectDraft = z.object({ id: uuid, name, activeScenarioId: uuid.optional(), document: legacyProjectDocumentSchema });
const scenarioDraft = z.object({ id: uuid, name, expectedRevision: z.number().int().nonnegative(), document: scenarioDocumentSchema });
const workspaceBase = z.object({ project: projectDraft, scenarios: z.array(scenarioDraft).min(1) });

function validateReferences(input: z.infer<typeof workspaceBase>, context: z.RefinementCtx) {
  const vehicleIds = new Set(input.project.document.fleetVehicles.map((vehicle) => vehicle.id));
  const presetIds = new Set(input.project.document.vehiclePresets.map((preset) => preset.id));
  const start = input.project.document.analysis.startYear;
  const end = start + input.project.document.analysis.yearCount - 1;
  if (input.project.activeScenarioId && !input.scenarios.some((scenario) => scenario.id === input.project.activeScenarioId)) {
    context.addIssue({ code: "custom", message: "The active Scenario must resolve inside this Project.", path: ["project", "activeScenarioId"] });
  }
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

export const createProjectSchema = z.object({ document: projectDocumentSchema });
export const updateProjectSchema = z.object({ document: projectDocumentSchema, expectedRevision: z.number().int().positive() });
export const projectIdParamsSchema = z.object({ id: identifier });

export type ProjectDocument = z.infer<typeof projectDocumentSchema>;
export type LegacyProjectDocument = z.infer<typeof legacyProjectDocumentSchema>;
export type ScenarioDocument = z.infer<typeof scenarioDocumentSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
