import { beforeEach, describe, expect, it } from "vitest";
import { createMemoryProjectRepository } from "../project/repository";
import { createSampleProjects } from "../project/sampleProjects";
import { currentFleet, placeVehicleFromPreset, updateFleetVehicle, useFleetStore } from "../state/fleetStore";
import { usePresetStore } from "../state/presetStore";
import { createProjectFields, setProjectRepository, useProjectStore } from "../state/projectStore";
import { createDocument, createEditorState, useSceneStore } from "../state/sceneStore";
import { effectiveVehicleState } from "./effectiveState";
import { currentSimulationInput, deleteFleetVehicle, deleteVehiclePreset, presetDeletionImpact, vehicleDeletionImpact } from "./fleetCommands";
import { createMockAnalysis, createMockPresets } from "./mockProject";

const project = useProjectStore.getState;
const scene = useSceneStore.getState;
const presets = usePresetStore.getState;

const activeScenario = () => project().scenarios.find((scenario) => scenario.id === project().activeScenarioId)!;
const planFor = (scenarioId: string, vehicleId: string) =>
  project().worlds.flatMap((world) => world.scenarios).find((scenario) => scenario.id === scenarioId)!.document.vehiclePlans[vehicleId];
const presetByName = (name: string) => presets().presets.find((preset) => preset.name === name)!;
const place = (name = "Diesel Delivery Van") => placeVehicleFromPreset(presetByName(name))!;

beforeEach(() => {
  setProjectRepository(createMemoryProjectRepository(createSampleProjects()));
  const document = createDocument();
  const inputs = { presets: createMockPresets(), analysis: createMockAnalysis() };
  presets().replacePresets(inputs.presets);
  useFleetStore.getState().updateAnalysis(inputs.analysis);
  useSceneStore.setState({ document, editor: createEditorState(), history: { past: [], future: [], baseline: null } });
  useProjectStore.setState(createProjectFields("Fleet commands test", document, 0, inputs));
});

describe("placing vehicles", () => {
  it("instantiates a preset as a vehicle standing in the depot", () => {
    expect(currentFleet()).toEqual([]);
    const id = place();

    expect(currentFleet()).toHaveLength(1);
    expect(currentFleet()[0]).toMatchObject({ id, currentPresetId: "diesel-van", name: "Diesel Delivery Van" });
    // The vehicle and the 3D object are the same thing, not two records.
    expect(scene().document.objects.some((object) => object.id === id)).toBe(true);
  });

  it("gives each placement its own id and keeps them clear of each other", () => {
    const first = place();
    const second = place("Electric Delivery Van");
    expect(second).not.toBe(first);
    expect(currentFleet()).toHaveLength(2);
    const [a, b] = scene().document.objects;
    expect(a.transform.position[0]).not.toBe(b.transform.position[0]);
  });

  it("does not treat plain scenery as a vehicle", () => {
    scene().addObject("van");
    expect(currentFleet()).toEqual([]);
  });

  it("is undoable, because placing a vehicle is a scene edit", () => {
    place();
    expect(currentFleet()).toHaveLength(1);
    scene().undo();
    expect(currentFleet()).toEqual([]);
    scene().redo();
    expect(currentFleet()).toHaveLength(1);
  });
});

describe("editing a vehicle", () => {
  it("applies valid edits and rejects invalid ones without losing the last good value", () => {
    const id = place();
    updateFleetVehicle(id, { annualKm: 31_000 });
    expect(currentFleet()[0].annualKm).toBe(31_000);

    for (const patch of [{ annualKm: -1 }, { utilisation: 2 }, { operatingDays: 400 }, { depotDwellHours: 25 }]) {
      updateFleetVehicle(id, patch);
    }
    expect(currentFleet()[0].annualKm).toBe(31_000);
  });

  it("repoints the vehicle at another preset, which also changes what is rendered", () => {
    const id = place();
    updateFleetVehicle(id, { currentPresetId: "electric-van" });
    expect(currentFleet()[0].currentPresetId).toBe("electric-van");
    expect(scene().document.objects.find((object) => object.id === id)?.presetId).toBe("electric-van");

    updateFleetVehicle(id, { currentPresetId: "missing-preset" });
    expect(currentFleet()[0].currentPresetId).toBe("electric-van");
  });

  it("refuses a replacement year outside the analysis period", () => {
    const id = place();
    updateFleetVehicle(id, { replacementYear: 2030 });
    expect(currentFleet()[0].replacementYear).toBe(2030);
    updateFleetVehicle(id, { replacementYear: 2099 });
    expect(currentFleet()[0].replacementYear).toBe(2030);
  });
});

describe("deleting a vehicle", () => {
  it("lists the scenario plans that would be removed with it", () => {
    const id = place();
    const scenarioId = activeScenario().id;
    project().updateScenarioVehiclePlan(scenarioId, id, { transitionYear: 2028, targetPresetId: "electric-van" });
    expect(vehicleDeletionImpact(id)).toEqual([
      { scenarioId, scenarioName: activeScenario().name, plan: { transitionYear: 2028, targetPresetId: "electric-van" } },
    ]);
  });

  it("removes the object, the vehicle and its plans as one edit", () => {
    const id = place();
    const first = activeScenario().id;
    project().createScenario();
    const second = activeScenario().id;
    project().updateScenarioVehiclePlan(first, id, { transitionYear: 2028, targetPresetId: "electric-van" });
    project().updateScenarioVehiclePlan(second, id, { transitionYear: 2031, targetPresetId: "electric-van" });

    deleteFleetVehicle(id);

    expect(currentFleet()).toEqual([]);
    expect(scene().document.objects.some((object) => object.id === id)).toBe(false);
    expect(planFor(first, id)).toBeUndefined();
    expect(planFor(second, id)).toBeUndefined();
  });

  it("restores the vehicle on undo", () => {
    const id = place();
    deleteFleetVehicle(id);
    expect(currentFleet()).toEqual([]);
    scene().undo();
    expect(currentFleet().map((vehicle) => vehicle.id)).toEqual([id]);
  });
});

describe("deleting a vehicle preset", () => {
  it("is blocked while a vehicle in this depot still uses it", () => {
    place();
    const blocked = deleteVehiclePreset("diesel-van");
    expect(blocked.ok).toBe(false);
    expect(presets().presets.some((preset) => preset.id === "diesel-van")).toBe(true);
    if (!blocked.ok) expect(blocked.references.some((reference) => reference.kind === "fleet-current")).toBe(true);
  });

  it("is blocked while a scenario still targets it", () => {
    const id = place();
    project().updateScenarioVehiclePlan(activeScenario().id, id, { targetPresetId: "electric-box-truck" });
    expect(presetDeletionImpact("electric-box-truck").some((reference) => reference.kind === "scenario-target")).toBe(true);
    expect(deleteVehiclePreset("electric-box-truck").ok).toBe(false);
  });

  it("succeeds once nothing references it", () => {
    presets().createPreset();
    const unused = presets().selectedPresetId!;
    expect(presetDeletionImpact(unused)).toEqual([]);
    expect(deleteVehiclePreset(unused)).toEqual({ ok: true });
    expect(presets().presets.some((preset) => preset.id === unused)).toBe(false);
  });
});

describe("depots keep their own vehicles", () => {
  it("shows a vehicle only in the depot it was placed in", async () => {
    const depotA = project().worldId;
    const id = place();
    expect(currentFleet().map((vehicle) => vehicle.id)).toEqual([id]);

    project().newWorld();
    expect(project().worldId).not.toBe(depotA);
    // Presets are shared by every depot; the vehicles are not.
    expect(currentFleet()).toEqual([]);
    expect(presets().presets.length).toBeGreaterThan(0);

    await project().switchWorld(depotA);
    expect(currentFleet().map((vehicle) => vehicle.id)).toEqual([id]);
  });

  it("leaves another depot's scenarios alone when a vehicle is deleted", async () => {
    const depotA = project().worldId;
    const idA = place();
    const scenarioA = activeScenario().id;
    project().updateScenarioVehiclePlan(scenarioA, idA, { transitionYear: 2029, targetPresetId: "electric-van" });

    project().newWorld();
    const idB = place();
    const scenarioB = activeScenario().id;
    project().updateScenarioVehiclePlan(scenarioB, idB, { transitionYear: 2030, targetPresetId: "electric-van" });

    deleteFleetVehicle(idB);

    expect(planFor(scenarioB, idB)).toBeUndefined();
    // Depot A's plan is untouched, which a project-wide fleet could not promise.
    expect(planFor(scenarioA, idA)).toEqual({ transitionYear: 2029, targetPresetId: "electric-van" });
    await project().switchWorld(depotA);
    expect(currentFleet().map((vehicle) => vehicle.id)).toEqual([idA]);
  });
});

describe("M1 evidence: two scenarios over one depot", () => {
  it("changes effective state by scenario and year without mutating the vehicle or the other plan", () => {
    const id = place();
    const gradual = activeScenario().id;
    project().createScenario();
    const fast = activeScenario().id;

    project().updateScenarioVehiclePlan(gradual, id, { transitionYear: 2031, targetPresetId: "electric-van" });
    project().updateScenarioVehiclePlan(fast, id, { transitionYear: 2027, targetPresetId: "electric-box-truck" });

    const presetIds = new Set(presets().presets.map((preset) => preset.id));
    const vehicle = currentFleet()[0];
    const stateIn = (scenarioId: string, year: number) => effectiveVehicleState(vehicle, planFor(scenarioId, id), presetIds, year);

    expect(stateIn(gradual, 2028).presetId).toBe("diesel-van");
    expect(stateIn(fast, 2028).presetId).toBe("electric-box-truck");
    expect(stateIn(gradual, 2031)).toMatchObject({ presetId: "electric-van", transitioned: true });

    expect(currentFleet()[0].currentPresetId).toBe("diesel-van");
    expect(planFor(gradual, id)).toEqual({ transitionYear: 2031, targetPresetId: "electric-van" });
    expect(planFor(fast, id)).toEqual({ transitionYear: 2027, targetPresetId: "electric-box-truck" });
  });

  it("duplicating a scenario deep-copies its plans so edits stay isolated", () => {
    const id = place();
    const original = activeScenario().id;
    project().updateScenarioVehiclePlan(original, id, { transitionYear: 2030, targetPresetId: "electric-van" });
    project().duplicateScenario(original);
    const copy = activeScenario().id;

    project().updateScenarioVehiclePlan(copy, id, { transitionYear: 2026 });
    expect(planFor(copy, id)).toEqual({ transitionYear: 2026, targetPresetId: "electric-van" });
    expect(planFor(original, id)).toEqual({ transitionYear: 2030, targetPresetId: "electric-van" });
  });

  it("refuses a plan naming an unknown vehicle, preset or out-of-period year", () => {
    const id = place();
    const scenarioId = activeScenario().id;
    project().updateScenarioVehiclePlan(scenarioId, "GHOST", { transitionYear: 2030 });
    expect(planFor(scenarioId, "GHOST")).toBeUndefined();

    project().updateScenarioVehiclePlan(scenarioId, id, { targetPresetId: "missing-preset" });
    expect(planFor(scenarioId, id)).toBeUndefined();

    project().updateScenarioVehiclePlan(scenarioId, id, { transitionYear: 2099 });
    expect(planFor(scenarioId, id)).toBeUndefined();
  });
});

describe("save and reopen", () => {
  it("restores a depot's vehicles and plans with stable references", async () => {
    const id = place();
    updateFleetVehicle(id, { annualKm: 33_000 });
    const scenarioId = activeScenario().id;
    project().updateScenarioVehiclePlan(scenarioId, id, { transitionYear: 2029, targetPresetId: "electric-van" });

    await project().saveProject();
    const projectId = project().projectId!;
    useSceneStore.setState({ document: createDocument() });
    await project().openProject(projectId);

    expect(currentFleet()).toHaveLength(1);
    expect(currentFleet()[0]).toMatchObject({ id, annualKm: 33_000, currentPresetId: "diesel-van" });
    const restored = project().scenarios.find((scenario) => scenario.id === scenarioId)!;
    expect(restored.document.vehiclePlans[id]).toEqual({ transitionYear: 2029, targetPresetId: "electric-van" });
  });

  it("drops a deleted vehicle and its plans permanently, not just in memory", async () => {
    const id = place();
    const scenarioId = activeScenario().id;
    project().updateScenarioVehiclePlan(scenarioId, id, { transitionYear: 2030, targetPresetId: "electric-van" });
    deleteFleetVehicle(id);

    await project().saveProject();
    await project().openProject(project().projectId!);

    expect(currentFleet()).toEqual([]);
    expect(project().scenarios.find((scenario) => scenario.id === scenarioId)!.document.vehiclePlans[id]).toBeUndefined();
  });
});

describe("authoritative simulation input", () => {
  it("pairs the project's shared inputs with the active depot's vehicles", () => {
    const id = place();
    const input = currentSimulationInput()!;
    expect(input.project.version).toBe(4);
    expect(input.scenario.version).toBe(2);
    expect(input.fleetVehicles.map((vehicle) => vehicle.id)).toEqual([id]);
    expect(input.project.analysis).toEqual(useFleetStore.getState().analysis);
    // The snapshot is a copy: mutating it cannot reach the stores.
    input.fleetVehicles[0].annualKm = 1;
    expect(currentFleet()[0].annualKm).not.toBe(1);
  });
});
