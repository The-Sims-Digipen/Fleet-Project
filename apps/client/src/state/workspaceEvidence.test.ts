import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { createMockAnalysis, createMockFleet, createMockPresets } from "../domain/mockProject";
import { createMemoryProjectRepository } from "../project/repository";
import { createSampleProjects } from "../project/sampleProjects";
import { useFleetStore } from "./fleetStore";
import { usePresetStore } from "./presetStore";
import { createProjectFields, setProjectRepository, useProjectDirty, useProjectStore } from "./projectStore";
import { createDocument, createEditorState, useSceneStore } from "./sceneStore";

// T06 evidence: Project owns one environment and one fleet while Scenarios are
// independent plan overlays. The active Scenario is part of the saved workspace.

const project = useProjectStore.getState;
const activeScenario = () => project().scenarios.find((scenario) => scenario.id === project().activeScenarioId);

beforeEach(() => {
  setProjectRepository(createMemoryProjectRepository());
  const scene = createDocument();
  const inputs = { presets: createMockPresets(), fleet: createMockFleet(), analysis: createMockAnalysis() };
  usePresetStore.getState().replacePresets(inputs.presets);
  useFleetStore.getState().updateAnalysis(inputs.analysis);
  useFleetStore.getState().replaceFleet(inputs.fleet);
  useSceneStore.setState({ document: scene, editor: createEditorState(), history: { past: [], future: [], baseline: null } });
  useProjectStore.setState(createProjectFields("Untitled project", scene, 0, inputs));
});

describe("single-environment workspace evidence", () => {
  it("duplicates, switches, and removes independent Scenario overlays", () => {
    project().newProject("Depot transition");
    const sourceId = project().activeScenarioId;
    project().updateScenarioVehiclePlan(sourceId, "UNIT-01", { transitionYear: 2029, targetPresetId: "electric-van" });

    project().duplicateScenario(sourceId);
    const copyId = project().activeScenarioId;
    project().updateScenarioVehiclePlan(copyId, "UNIT-01", { transitionYear: 2031 });

    expect(copyId).not.toBe(sourceId);
    expect(project().scenarios.find((scenario) => scenario.id === sourceId)?.document.vehiclePlans["UNIT-01"]).toEqual({
      transitionYear: 2029,
      targetPresetId: "electric-van",
    });
    expect(activeScenario()?.document.vehiclePlans["UNIT-01"]).toEqual({
      transitionYear: 2031,
      targetPresetId: "electric-van",
    });

    project().deleteScenario(copyId);
    expect(project().activeScenarioId).toBe(sourceId);
    project().deleteScenario(sourceId);
    expect(project().scenarios).toHaveLength(1);
  });

  it("reopens the Scenario that was active when the Project was saved", async () => {
    project().newProject("Depot transition");
    project().createScenario();
    project().renameScenario(project().activeScenarioId, "Fast plan");
    const fastPlanId = project().activeScenarioId;

    await project().saveProject();
    const projectId = project().projectId!;
    project().newProject("Scratch");
    await project().openProject(projectId);

    expect(project().activeScenarioId).toBe(fastPlanId);
    expect(activeScenario()?.name).toBe("Fast plan");
  });

  it("falls back to the first Scenario when a stored selection no longer resolves", async () => {
    const [sample] = createSampleProjects();
    setProjectRepository(createMemoryProjectRepository([{
      ...sample,
      project: { ...sample.project, activeScenarioId: "deleted-scenario" },
    }]));

    await project().openProject(sample.project.id);

    expect(project().activeScenarioId).toBe(project().scenarios[0].id);
  });

  it("marks a Scenario switch dirty because the selection is persisted", async () => {
    project().newProject("Depot transition");
    const planAId = project().activeScenarioId;
    project().createScenario();
    const { result } = renderHook(() => useProjectDirty());

    await act(async () => project().saveProject());
    expect(result.current).toBe(false);

    act(() => project().selectScenario(planAId));
    expect(result.current).toBe(true);

    await act(async () => project().saveProject());
    expect(result.current).toBe(false);
  });

  it("preserves the active Scenario through export, import, save, and reopen", async () => {
    project().newProject("Depot transition");
    project().createScenario();
    project().renameScenario(project().activeScenarioId, "Fast plan");
    const exported = project().exportProject();
    expect(exported.activeScenarioIndex).toBe(1);

    await project().importProject(exported);
    const importedScenarioId = project().activeScenarioId;
    const importedProjectId = project().projectId!;
    expect(activeScenario()?.name).toBe("Fast plan");

    project().newProject("Scratch");
    await project().openProject(importedProjectId);
    expect(project().activeScenarioId).toBe(importedScenarioId);
    expect(activeScenario()?.name).toBe("Fast plan");
  });
});
