import { beforeEach, describe, expect, it } from "vitest";
import { createMockAnalysis, createMockFleet, createMockPresets } from "../domain/mockProject";
import { createMemoryProjectRepository } from "../project/repository";
import { createSampleProjects } from "../project/sampleProjects";
import { DEFAULT_DEPOT_OBJECT_ID } from "../scene/defaultProjectScene";
import { useFleetStore } from "./fleetStore";
import { usePresetStore } from "./presetStore";
import { createProjectFields, setProjectRepository, useProjectStore } from "./projectStore";
import { createDocument, createEditorState, useSceneStore } from "./sceneStore";

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
    expect(exported.version).toBe(3);
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
});
