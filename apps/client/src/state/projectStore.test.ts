import { beforeEach, describe, expect, it } from "vitest";
import { createMockAnalysis, createMockFleet, createMockPresets } from "../domain/mockProject";
import { normalizeProjectV5 } from "../domain/projectV5";
import { createProjectV5Fixture } from "../domain/projectV5Fixture";
import { createMemoryProjectRepository } from "../project/repository";
import { createSampleProjects } from "../project/sampleProjects";
import { DEFAULT_DEPOT_OBJECT_ID } from "../scene/defaultProjectScene";
import { useFleetStore } from "./fleetStore";
import { usePresetStore } from "./presetStore";
import { createProjectFields, setProjectRepository, useProjectStore } from "./projectStore";
import { isProjectDirty } from "./projectRuntime";
import { createDocument, createEditorState, useSceneStore } from "./sceneStore";
import { useAppStore } from "./appStore";

const project = useProjectStore.getState;

beforeEach(() => {
  setProjectRepository(createMemoryProjectRepository(createSampleProjects()));
  const scene = createDocument();
  const inputs = { presets: createMockPresets(), fleet: createMockFleet(), analysis: createMockAnalysis() };
  usePresetStore.getState().replacePresets(inputs.presets);
  useFleetStore.getState().updateAnalysis(inputs.analysis);
  useFleetStore.getState().replaceFleet(inputs.fleet);
  useSceneStore.setState({ document: scene, editor: createEditorState(), history: { past: [], future: [], baseline: null } });
  useProjectStore.setState(createProjectFields("Project test", scene, 0, inputs));
});
describe("single-environment project state", () => {
  it("starts with one default depot and one scenario", () => {
    expect(useSceneStore.getState().document.objects.some((object) => object.id === DEFAULT_DEPOT_OBJECT_ID)).toBe(true);
    expect(project().scenarios).toHaveLength(1);
    expect(project()).not.toHaveProperty("worlds");
  });

  it("keeps scenario plans isolated over the same fleet", () => {
    const first = project().activeScenarioId;
    project().updateScenarioVehiclePlan(first, "UNIT-01", { transitionYear: 2030, targetPresetId: "electric-van" });
    project().createScenario();
    const second = project().activeScenarioId;
    project().updateScenarioVehiclePlan(second, "UNIT-01", { transitionYear: 2027, targetPresetId: "electric-box-truck" });
    expect(project().scenarios.find((scenario) => scenario.id === first)?.document.vehiclePlans["UNIT-01"]).toEqual({
      transitionYear: 2030,
      targetPresetId: "electric-van",
    });
    expect(project().scenarios.find((scenario) => scenario.id === second)?.document.vehiclePlans["UNIT-01"]).toEqual({
      transitionYear: 2027,
      targetPresetId: "electric-box-truck",
    });
  });

  it("keeps an incomplete compatibility transition as editor-only draft state", () => {
    const scenarioId = project().activeScenarioId;
    project().updateScenarioVehiclePlan(scenarioId, "UNIT-01", { transitionYear: 2030, targetPresetId: "electric-van" });
    project().updateScenarioVehiclePlan(scenarioId, "UNIT-01", { targetPresetId: undefined });

    expect(project().scenarios[0].document.vehiclePlans["UNIT-01"]).toEqual({ transitionYear: 2030, targetPresetId: undefined });
    expect(project().runtime.document.scenarios[0].vehiclePlans["UNIT-01"]).toBeUndefined();
  });

  it("saves and reopens the Project aggregate atomically", async () => {
    project().createScenario();
    useFleetStore.getState().updateVehicle("UNIT-01", { annualKm: 42_000 });
    await project().saveProject();
    const id = project().projectId!;
    useFleetStore.getState().updateVehicle("UNIT-01", { annualKm: 1 });
    await project().openProject(id);
    expect(project().revision).toBe(1);
    expect(project().scenarios).toHaveLength(2);
    expect(useFleetStore.getState().vehicles.find((vehicle) => vehicle.id === "UNIT-01")?.annualKm).toBe(42_000);
  });

  it("exports and imports one project environment with its scenarios", async () => {
    project().createScenario();
    const exported = project().exportProject();
    expect(exported.version).toBe(4);
    expect(exported).not.toHaveProperty("worlds");
    await project().importProject(exported);
    expect(project().projectId).not.toBeNull();
    expect(project().scenarios).toHaveLength(2);
    expect(useSceneStore.getState().document.objects.some((object) => object.id === DEFAULT_DEPOT_OBJECT_ID)).toBe(true);
  });

  it("creates a new Project with a fresh default depot", () => {
    project().newProject("Another depot");
    expect(project().name).toBe("Another depot");
    expect(project().projectId).toBeNull();
    expect(project().scenarios).toHaveLength(1);
    expect(useSceneStore.getState().document.objects.some((object) => object.id === DEFAULT_DEPOT_OBJECT_ID)).toBe(true);
  });

  it("keeps Project history after save and makes an Undo dirty again", async () => {
    const repository = createMemoryProjectRepository();
    setProjectRepository(repository);
    project().newProject("History test");
    project().renameProject("Saved name");
    expect(project().runtime.history.past).toHaveLength(1);

    await project().saveProject();
    expect(project().runtime.history.past).toHaveLength(1);
    expect(isProjectDirty(project().runtime)).toBe(false);

    project().undo();
    expect(project().name).toBe("History test");
    expect(isProjectDirty(project().runtime)).toBe(true);
  });

  it("preserves working state, baseline, history, and stored data after a stale save", async () => {
    const repository = createMemoryProjectRepository();
    setProjectRepository(repository);
    project().newProject("Conflict test");
    await project().saveProject();
    const stored = await repository.getProject(project().runtime.document.id);
    await repository.updateProject({ ...stored.document, name: "External name" }, stored.revision);

    project().renameProject("Working name");
    const baseline = project().runtime.savedDocument;
    const historyLength = project().runtime.history.past.length;
    await project().saveProject();

    expect(project().name).toBe("Working name");
    expect(project().runtime.savedDocument).toEqual(baseline);
    expect(project().runtime.history.past).toHaveLength(historyLength);
    expect((await repository.getProject(stored.document.id)).document.name).toBe("External name");
    expect(useAppStore.getState().saveStatus.state).toBe("error");
  });

  it("does not rewrite untouched version 5 transforms or shared settings on export and save", async () => {
    const document = normalizeProjectV5({
      ...createProjectV5Fixture("round-trip"),
      environment: {
        ...createProjectV5Fixture("round-trip").environment,
        vehicles: createProjectV5Fixture("round-trip").environment.vehicles.map((vehicle) => ({
          ...vehicle,
          transform: { position: [12, 3, -7], rotation: [0, 0.5, 0], scale: [1.4, 1.4, 1.4] },
        })),
      },
      analysis: { ...createProjectV5Fixture("round-trip").analysis, electricityPricePerKWh: 0.57, discountRate: 0.08 },
    });
    const timestamp = "2026-01-01T00:00:00.000Z";
    const repository = createMemoryProjectRepository([{ document, revision: 1, createdAt: timestamp, updatedAt: timestamp }]);
    setProjectRepository(repository);

    await project().openProject(document.id);
    expect(project().exportProject().document).toEqual(document);
    await project().saveProject();
    expect((await repository.getProject(document.id)).document).toEqual(document);
  });
});
