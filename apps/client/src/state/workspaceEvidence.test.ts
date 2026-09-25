import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { createMemoryProjectRepository } from "../project/repository";
import { loadDefaultPresets } from "../vehicles/defaults";
import { usePresetStore } from "./presetStore";
import { createProjectFields, setProjectRepository, useProjectDirty, useProjectStore } from "./projectStore";
import { createDocument, createEditorState, useSceneStore } from "./sceneStore";

// T06 evidence flow: create and switch Projects/Worlds/Scenarios, duplicate and remove a Scenario
// while the workspace stays valid, make unsaved changes, then save and reopen through T01 and
// check the same active workspace comes back.

const project = useProjectStore.getState;
const scene = useSceneStore.getState;

/** Reads the dirty flag from a fresh render so no store subscription outlives the assertion. */
const isDirty = () => renderHook(() => useProjectDirty()).result.current;
const worldNamed = (name: string) => project().worlds.find((world) => world.name === name)!;
const scenarioNames = (worldName: string) => worldNamed(worldName).scenarios.map((scenario) => scenario.name);
const activeScenario = () => project().scenarios.find((scenario) => scenario.id === project().activeScenarioId);

beforeEach(() => {
  setProjectRepository(createMemoryProjectRepository());
  const document = createDocument();
  const presets = loadDefaultPresets();
  usePresetStore.getState().replacePresets(presets);
  useSceneStore.setState({ document, editor: createEditorState(), history: { past: [], future: [], baseline: null } });
  useProjectStore.setState(createProjectFields("Untitled project", document, 0, presets));
});

describe("workspace lifecycle evidence", () => {
  it("keeps the workspace valid through create, switch, duplicate and remove", () => {
    project().newProject("Depot transition");
    expect(project().worlds).toHaveLength(1);
    expect(scenarioNames("Depot transition world")).toEqual(["Plan A"]);
    expect(activeScenario()?.name).toBe("Plan A");

    // A duplicate is an independent copy: editing it must not reach the source.
    const sourceId = project().activeScenarioId;
    project().updateScenarioVehiclePlan(sourceId, "UNIT-01", { transitionYear: 2029 });
    project().duplicateScenario(sourceId);
    const copyId = project().activeScenarioId;
    expect(copyId).not.toBe(sourceId);
    expect(activeScenario()?.name).toBe("Plan A copy");
    project().updateScenarioVehiclePlan(copyId, "UNIT-01", { transitionYear: 2031 });
    expect(project().scenarios.find((scenario) => scenario.id === sourceId)?.document.vehiclePlans?.["UNIT-01"]).toEqual({ transitionYear: 2029 });

    // Removing the active scenario has to leave a different, still-present scenario active.
    project().deleteScenario(copyId);
    expect(project().scenarios.some((scenario) => scenario.id === copyId)).toBe(false);
    expect(activeScenario()?.id).toBe(sourceId);

    // A world always keeps at least one scenario.
    project().deleteScenario(sourceId);
    expect(project().scenarios).toHaveLength(1);
    expect(activeScenario()?.id).toBe(sourceId);

    // Each world keeps its own scene and its own scenarios.
    scene().setLight(33);
    project().newWorld();
    project().renameWorld("North depot");
    scene().setLight(66);
    project().createScenario();
    project().renameScenario(project().activeScenarioId, "North plan");
    expect(scenarioNames("North depot")).toEqual(["Plan A", "North plan"]);
    expect(scenarioNames("Depot transition world")).toEqual(["Plan A"]);
  });

  it("saves unsaved workspace changes and reopens the same workspace", async () => {
    project().newProject("Depot transition");
    const firstWorldId = project().worldId;
    expect(isDirty()).toBe(false);

    scene().setLight(33);
    scene().addObject("van");
    project().createScenario();
    project().renameScenario(project().activeScenarioId, "Fast plan");
    const fastPlanId = project().activeScenarioId;
    project().updateScenarioVehiclePlan(fastPlanId, "UNIT-07", { transitionYear: 2030, targetPresetId: "electric-van" });

    project().newWorld();
    const secondWorldId = project().worldId;
    project().renameWorld("North depot");
    scene().setLight(66);

    await project().switchWorld(firstWorldId);
    project().selectScenario(fastPlanId);
    expect(isDirty()).toBe(true);

    await project().saveProject();
    expect(project().saveStatus).toEqual({ state: "idle" });
    expect(project().projectId).not.toBeNull();
    expect(isDirty()).toBe(false);

    // Reopen from a clean workspace so nothing can be left over in memory.
    const projectId = project().projectId!;
    project().newProject("Scratch");
    await project().openProject(projectId);

    expect(project().name).toBe("Depot transition");
    expect(project().worlds.map((world) => world.id)).toEqual([firstWorldId, secondWorldId]);
    expect(project().worlds.map((world) => world.name)).toEqual(["Depot transition world", "North depot"]);
    expect(scenarioNames("Depot transition world")).toEqual(["Plan A", "Fast plan"]);
    expect(scenarioNames("North depot")).toEqual(["Plan A"]);

    // The active world, its scene and its scenario data all come back.
    expect(project().worldId).toBe(firstWorldId);
    expect(scene().document.light).toBe(33);
    expect(scene().document.objects).toHaveLength(2);
    expect(project().scenarios.find((scenario) => scenario.id === fastPlanId)?.document.vehiclePlans?.["UNIT-07"])
      .toEqual({ transitionYear: 2030, targetPresetId: "electric-van" });

    // The same scenario is active again, and it belongs to the active world.
    expect(project().activeScenarioId).toBe(fastPlanId);
    expect(activeScenario()?.worldId).toBe(firstWorldId);
    expect(isDirty()).toBe(false);
  });

  it("restores the active scenario that was in use when the project was saved", async () => {
    project().newProject("Depot transition");
    project().createScenario();
    project().renameScenario(project().activeScenarioId, "Fast plan");
    const fastPlanId = project().activeScenarioId;
    expect(project().scenarios[0].id).not.toBe(fastPlanId);

    await project().saveProject();
    const projectId = project().projectId!;
    project().newProject("Scratch");
    await project().openProject(projectId);

    expect(project().activeScenarioId).toBe(fastPlanId);
    expect(activeScenario()?.name).toBe("Fast plan");
  });

  it("falls back to the first scenario when the saved active scenario is gone", async () => {
    project().newProject("Depot transition");
    project().createScenario();
    const removedId = project().activeScenarioId;
    await project().saveProject();
    const projectId = project().projectId!;

    // Remove the scenario that was active at the last save, then save and reopen.
    project().deleteScenario(removedId);
    await project().saveProject();
    project().newProject("Scratch");
    await project().openProject(projectId);

    expect(project().scenarios.some((scenario) => scenario.id === removedId)).toBe(false);
    expect(project().activeScenarioId).toBe(project().scenarios[0].id);
  });

  it("counts a scenario switch as an unsaved change, because the selection is saved", async () => {
    project().newProject("Depot transition");
    const planAId = project().activeScenarioId;
    project().createScenario();
    await project().saveProject();
    expect(isDirty()).toBe(false);

    // The selection is persisted, so moving it has to be reported as unsaved work.
    project().selectScenario(planAId);
    expect(isDirty()).toBe(true);

    await project().saveProject();
    expect(isDirty()).toBe(false);
  });

  it("keeps the active scenario of an imported project after it is reopened", async () => {
    project().newProject("Depot transition");
    project().createScenario();
    project().renameScenario(project().activeScenarioId, "Fast plan");
    const exported = project().exportProject();
    expect(exported.activeScenarioIndex).toBe(1);

    await project().importProject(exported);
    const importedId = project().activeScenarioId;
    expect(activeScenario()?.name).toBe("Fast plan");

    const projectId = project().projectId!;
    project().newProject("Scratch");
    await project().openProject(projectId);
    expect(project().activeScenarioId).toBe(importedId);
    expect(activeScenario()?.name).toBe("Fast plan");
  });

  it("switches the active scenario without leaking data between scenarios", () => {
    project().newProject("Depot transition");
    const planAId = project().activeScenarioId;
    project().updateScenarioVehiclePlan(planAId, "UNIT-01", { transitionYear: 2031, targetPresetId: "electric-van" });

    project().createScenario();
    const planBId = project().activeScenarioId;
    expect(planBId).not.toBe(planAId);
    project().updateScenarioVehiclePlan(planBId, "UNIT-01", { transitionYear: 2026 });

    // Switching back has to show the first scenario's own plan, not the one just edited.
    project().selectScenario(planAId);
    expect(project().activeScenarioId).toBe(planAId);
    expect(activeScenario()?.document.vehiclePlans?.["UNIT-01"]).toEqual({ transitionYear: 2031, targetPresetId: "electric-van" });

    project().selectScenario(planBId);
    expect(activeScenario()?.document.vehiclePlans?.["UNIT-01"]).toEqual({ transitionYear: 2026 });

    // Selecting something that is not in this world must leave the selection untouched.
    project().selectScenario("not-a-scenario-id");
    expect(project().activeScenarioId).toBe(planBId);
  });
});
