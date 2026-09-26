import { beforeEach, describe, expect, it } from "vitest";
import { createMemoryProjectRepository } from "../project/repository";
import { createSampleProjects } from "../project/sampleProjects";
import { useFleetStore } from "../state/fleetStore";
import { usePresetStore } from "../state/presetStore";
import { createProjectFields, setProjectRepository, useProjectStore } from "../state/projectStore";
import { createDocument, createEditorState, useSceneStore } from "../state/sceneStore";
import { effectiveVehicleState } from "./effectiveState";
import { currentSimulationInput, deleteFleetVehicle, deleteVehiclePreset, presetDeletionImpact, vehicleDeletionImpact } from "./fleetCommands";
import { createMockAnalysis, createMockFleet, createMockPresets } from "./mockProject";

const project = useProjectStore.getState;
const fleet = useFleetStore.getState;
const presets = usePresetStore.getState;

const activeScenario = () => project().scenarios.find((scenario) => scenario.id === project().activeScenarioId)!;
const planFor = (scenarioId: string, vehicleId: string) =>
  project().worlds.flatMap((world) => world.scenarios).find((scenario) => scenario.id === scenarioId)!.document.vehiclePlans[vehicleId];

beforeEach(() => {
  setProjectRepository(createMemoryProjectRepository(createSampleProjects()));
  const document = createDocument();
  const inputs = { presets: createMockPresets(), fleet: createMockFleet(), analysis: createMockAnalysis() };
  presets().replacePresets(inputs.presets);
  fleet().updateAnalysis(inputs.analysis);
  fleet().replaceFleet(inputs.fleet);
  useSceneStore.setState({ document, editor: createEditorState(), history: { past: [], future: [], baseline: null } });
  useProjectStore.setState(createProjectFields("Fleet commands test", document, 0, inputs));
});

describe("fleet CRUD", () => {
  it("adds a vehicle with a stable unique id and a resolvable preset", () => {
    const before = fleet().vehicles.length;
    const id = fleet().createVehicle()!;
    expect(id).toBeTruthy();
    expect(fleet().vehicles).toHaveLength(before + 1);
    const created = fleet().vehicles.find((vehicle) => vehicle.id === id)!;
    expect(presets().presets.some((preset) => preset.id === created.currentPresetId)).toBe(true);
    // A second vehicle must not reuse the first one's id or name.
    const other = fleet().createVehicle()!;
    expect(other).not.toBe(id);
    expect(fleet().vehicles.find((vehicle) => vehicle.id === other)!.name).not.toBe(created.name);
  });

  it("duplicates a vehicle as an independent record with its own id and name", () => {
    const source = fleet().vehicles[0];
    const copyId = fleet().duplicateVehicle(source.id)!;
    const copy = fleet().vehicles.find((vehicle) => vehicle.id === copyId)!;
    expect(copyId).not.toBe(source.id);
    expect(copy.name).not.toBe(source.name);
    expect(copy).toMatchObject({ annualKm: source.annualKm, currentPresetId: source.currentPresetId });

    // Editing the copy leaves the original untouched.
    fleet().updateVehicle(copyId, { annualKm: 12_345 });
    expect(fleet().vehicles.find((vehicle) => vehicle.id === source.id)!.annualKm).toBe(source.annualKm);
    expect(fleet().duplicateVehicle("missing")).toBeNull();
  });

  it("applies valid edits and rejects invalid ones without losing the last good value", () => {
    const target = fleet().vehicles[0];
    fleet().updateVehicle(target.id, { annualKm: 31_000, name: "Renamed Van" });
    expect(fleet().vehicles[0]).toMatchObject({ annualKm: 31_000, name: "Renamed Van" });

    for (const patch of [{ annualKm: -1 }, { utilisation: 2 }, { name: "" }, { currentPresetId: "missing" }, { operatingDays: 400 }]) {
      fleet().updateVehicle(target.id, patch);
    }
    expect(fleet().vehicles[0]).toMatchObject({ annualKm: 31_000, name: "Renamed Van" });

    // Ids are immutable: a patch cannot repoint a record.
    fleet().updateVehicle(target.id, { id: "hijacked" });
    expect(fleet().vehicles[0].id).toBe(target.id);
  });

  it("refuses a replacement year outside the analysis period", () => {
    const target = fleet().vehicles[0];
    fleet().updateVehicle(target.id, { replacementYear: 2030 });
    expect(fleet().vehicles[0].replacementYear).toBe(2030);
    fleet().updateVehicle(target.id, { replacementYear: 2099 });
    expect(fleet().vehicles[0].replacementYear).toBe(2030);
  });

  it("restores the baseline on cancel and keeps changes on commit", () => {
    const target = fleet().vehicles[0];
    fleet().beginEdit();
    fleet().updateVehicle(target.id, { annualKm: 999 });
    expect(fleet().vehicles[0].annualKm).toBe(999);
    fleet().cancelEdit();
    expect(fleet().vehicles[0].annualKm).toBe(target.annualKm);

    fleet().beginEdit();
    fleet().updateVehicle(target.id, { annualKm: 777 });
    fleet().commitEdit();
    fleet().cancelEdit();
    expect(fleet().vehicles[0].annualKm).toBe(777);
  });
});

describe("deleting a fleet vehicle", () => {
  it("lists the scenario plans that would be removed with it", () => {
    const scenarioId = activeScenario().id;
    project().updateScenarioVehiclePlan(scenarioId, "UNIT-01", { transitionYear: 2028, targetPresetId: "electric-van" });
    expect(vehicleDeletionImpact("UNIT-01")).toEqual([
      { scenarioId, scenarioName: activeScenario().name, plan: { transitionYear: 2028, targetPresetId: "electric-van" } },
    ]);
    expect(vehicleDeletionImpact("UNIT-02")).toEqual([]);
  });

  it("removes the vehicle and every scenario plan keyed by it as one edit", () => {
    const first = activeScenario().id;
    project().createScenario();
    const second = activeScenario().id;
    project().updateScenarioVehiclePlan(first, "UNIT-01", { transitionYear: 2028, targetPresetId: "electric-van" });
    project().updateScenarioVehiclePlan(second, "UNIT-01", { transitionYear: 2031, targetPresetId: "electric-van" });
    project().updateScenarioVehiclePlan(second, "UNIT-02", { transitionYear: 2030, targetPresetId: "electric-box-truck" });

    deleteFleetVehicle("UNIT-01");

    expect(fleet().vehicles.some((vehicle) => vehicle.id === "UNIT-01")).toBe(false);
    expect(planFor(first, "UNIT-01")).toBeUndefined();
    expect(planFor(second, "UNIT-01")).toBeUndefined();
    // Plans for other vehicles are untouched.
    expect(planFor(second, "UNIT-02")).toEqual({ transitionYear: 2030, targetPresetId: "electric-box-truck" });
  });
});

describe("deleting a vehicle preset", () => {
  it("is blocked while the fleet or a scenario still points at it", () => {
    const blocked = deleteVehiclePreset("diesel-van");
    expect(blocked.ok).toBe(false);
    expect(presets().presets.some((preset) => preset.id === "diesel-van")).toBe(true);
    if (!blocked.ok) expect(blocked.references.some((reference) => reference.kind === "fleet-current")).toBe(true);

    project().updateScenarioVehiclePlan(activeScenario().id, "UNIT-01", { targetPresetId: "electric-box-truck" });
    const targeted = presetDeletionImpact("electric-box-truck");
    expect(targeted.some((reference) => reference.kind === "scenario-target")).toBe(true);
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

describe("M1 evidence: two scenarios over one fleet", () => {
  it("changes effective state by scenario and year without mutating the fleet or the other plan", () => {
    const gradual = activeScenario().id;
    project().createScenario();
    const fast = activeScenario().id;
    expect(fast).not.toBe(gradual);

    project().updateScenarioVehiclePlan(gradual, "UNIT-01", { transitionYear: 2031, targetPresetId: "electric-van" });
    project().updateScenarioVehiclePlan(fast, "UNIT-01", { transitionYear: 2027, targetPresetId: "electric-box-truck" });

    const presetIds = new Set(presets().presets.map((preset) => preset.id));
    const vehicle = fleet().vehicles.find((item) => item.id === "UNIT-01")!;
    const stateIn = (scenarioId: string, year: number) =>
      effectiveVehicleState(vehicle, planFor(scenarioId, "UNIT-01"), presetIds, year);

    // Same vehicle, same year, different scenario: different effective preset.
    expect(stateIn(gradual, 2028).presetId).toBe("diesel-van");
    expect(stateIn(fast, 2028).presetId).toBe("electric-box-truck");
    // Same scenario, later year: the planned change has taken effect.
    expect(stateIn(gradual, 2031)).toMatchObject({ presetId: "electric-van", transitioned: true });

    // Neither plan touched the shared fleet record or the other scenario.
    expect(fleet().vehicles.find((item) => item.id === "UNIT-01")!.currentPresetId).toBe("diesel-van");
    expect(planFor(gradual, "UNIT-01")).toEqual({ transitionYear: 2031, targetPresetId: "electric-van" });
    expect(planFor(fast, "UNIT-01")).toEqual({ transitionYear: 2027, targetPresetId: "electric-box-truck" });
  });

  it("duplicating a scenario deep-copies its plans so edits stay isolated", () => {
    const original = activeScenario().id;
    project().updateScenarioVehiclePlan(original, "UNIT-01", { transitionYear: 2030, targetPresetId: "electric-van" });
    project().duplicateScenario(original);
    const copy = activeScenario().id;

    project().updateScenarioVehiclePlan(copy, "UNIT-01", { transitionYear: 2026 });
    expect(planFor(copy, "UNIT-01")).toEqual({ transitionYear: 2026, targetPresetId: "electric-van" });
    expect(planFor(original, "UNIT-01")).toEqual({ transitionYear: 2030, targetPresetId: "electric-van" });
  });

  it("refuses a plan naming an unknown vehicle, preset or out-of-period year", () => {
    const scenarioId = activeScenario().id;
    project().updateScenarioVehiclePlan(scenarioId, "GHOST", { transitionYear: 2030 });
    expect(planFor(scenarioId, "GHOST")).toBeUndefined();

    project().updateScenarioVehiclePlan(scenarioId, "UNIT-01", { targetPresetId: "missing-preset" });
    expect(planFor(scenarioId, "UNIT-01")).toBeUndefined();

    project().updateScenarioVehiclePlan(scenarioId, "UNIT-01", { transitionYear: 2099 });
    expect(planFor(scenarioId, "UNIT-01")).toBeUndefined();
  });
});

describe("save and reopen", () => {
  it("restores fleet edits, new vehicles and scenario plans with stable references", async () => {
    const scenarioId = activeScenario().id;
    fleet().updateVehicle("UNIT-01", { annualKm: 33_000, name: "Renamed Van" });
    const addedId = fleet().createVehicle()!;
    fleet().updateVehicle(addedId, { annualKm: 12_000, currentPresetId: "electric-van" });
    project().updateScenarioVehiclePlan(scenarioId, "UNIT-01", { transitionYear: 2029, targetPresetId: "electric-van" });

    await project().saveProject();
    const projectId = project().projectId!;
    // Clear the stores so anything restored has to have come from storage.
    fleet().replaceFleet([]);
    await project().openProject(projectId);

    expect(fleet().vehicles.find((vehicle) => vehicle.id === "UNIT-01")).toMatchObject({ annualKm: 33_000, name: "Renamed Van" });
    expect(fleet().vehicles.find((vehicle) => vehicle.id === addedId)).toMatchObject({ annualKm: 12_000, currentPresetId: "electric-van" });
    expect(fleet().analysis).toEqual(createMockAnalysis());

    // Every restored reference still resolves inside the reopened project.
    const presetIds = new Set(presets().presets.map((preset) => preset.id));
    for (const vehicle of fleet().vehicles) expect(presetIds.has(vehicle.currentPresetId)).toBe(true);
    const restoredPlan = project().scenarios.find((scenario) => scenario.id === scenarioId)!.document.vehiclePlans["UNIT-01"];
    expect(restoredPlan).toEqual({ transitionYear: 2029, targetPresetId: "electric-van" });
  });

  it("drops a deleted vehicle and its plans permanently, not just in memory", async () => {
    const scenarioId = activeScenario().id;
    project().updateScenarioVehiclePlan(scenarioId, "UNIT-02", { transitionYear: 2030, targetPresetId: "electric-box-truck" });
    deleteFleetVehicle("UNIT-02");

    await project().saveProject();
    await project().openProject(project().projectId!);

    expect(fleet().vehicles.some((vehicle) => vehicle.id === "UNIT-02")).toBe(false);
    expect(project().scenarios.find((scenario) => scenario.id === scenarioId)!.document.vehiclePlans["UNIT-02"]).toBeUndefined();
  });
});

describe("authoritative simulation input", () => {
  it("assembles the project and active scenario T05 consumes", () => {
    const input = currentSimulationInput()!;
    expect(input.project.version).toBe(3);
    expect(input.scenario.version).toBe(2);
    expect(input.project.fleetVehicles).toHaveLength(fleet().vehicles.length);
    expect(input.project.analysis).toEqual(fleet().analysis);
    // The snapshot is a copy: mutating it cannot reach the stores.
    input.project.fleetVehicles[0].annualKm = 1;
    expect(fleet().vehicles[0].annualKm).not.toBe(1);
  });
});
