import { z } from "zod";

const name = z.string().trim().min(1).max(100);
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

export const createProjectSchema = z.object({ document: projectDocumentSchema });
export const updateProjectSchema = z.object({ document: projectDocumentSchema, expectedRevision: z.number().int().positive() });
export const projectIdParamsSchema = z.object({ id: identifier });

export type ProjectDocument = z.infer<typeof projectDocumentSchema>;
