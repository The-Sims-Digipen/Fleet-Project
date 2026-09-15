import { beforeEach, describe, expect, it } from "vitest";
import { createMemoryProjectRepository, ProjectConflictError } from "../project/repository";
import { createSampleProjects } from "../project/sampleProjects";
import { validateName } from "../project/types";
import { loadDefaultPresets } from "../vehicles/defaults";
import { usePresetStore } from "./presetStore";
import { createProjectFields, setProjectRepository, useProjectStore } from "./projectStore";
import { createDocument, createEditorState, useSceneStore } from "./sceneStore";

const project = useProjectStore.getState;
const scene = useSceneStore.getState;
const activeName = () => project().scenarios.find((scenario) => scenario.id === project().activeScenarioId)!.name;

beforeEach(() => {
  setProjectRepository(createMemoryProjectRepository(createSampleProjects()));
  const document = createDocument();
  const presets = loadDefaultPresets();
  usePresetStore.getState().replacePresets(presets);
  useSceneStore.setState({ document, editor: createEditorState(), history: { past: [], future: [], baseline: null } });
  useProjectStore.setState(createProjectFields("Untitled project", document, 0, presets));
});

describe("project/world/scenario workspace", () => {
  it("creates a new project with one in-memory world and scenario", () => {
    project().newProject(" Depot transition ");
    expect(project()).toMatchObject({ name: "Depot transition", projectId: null, revision: 0, worldRevision: 0 });
    expect(project().worlds).toHaveLength(1);
    expect(project().scenarios).toHaveLength(1);
    expect(project().scenarios[0]).toMatchObject({ name: "Plan A", worldId: project().worldId, revision: 0 });
  });

  it("keeps world scene edits in memory while switching worlds", async () => {
    const firstWorldId = project().worldId;
    scene().setLight(22);
    scene().addObject("van");
    expect(project().worlds.find((world) => world.id === firstWorldId)?.document.light).toBe(22);
    expect(project().worlds.find((world) => world.id === firstWorldId)?.document.objects).toHaveLength(2);

    project().newWorld();
    const secondWorldId = project().worldId;
    expect(secondWorldId).not.toBe(firstWorldId);
    scene().setLight(77);

    await project().switchWorld(firstWorldId);
    expect(scene().document.light).toBe(22);
    expect(scene().document.objects).toHaveLength(2);

    await project().switchWorld(secondWorldId);
    expect(scene().document.light).toBe(77);
    expect(project().worlds).toHaveLength(2);
  });

  it("keeps scenarios with their world when switching away and back", async () => {
    const firstWorldId = project().worldId;
    project().createScenario();
    project().renameScenario(project().activeScenarioId, "Fast plan");
    expect(project().scenarios.map((scenario) => scenario.name)).toEqual(["Plan A", "Fast plan"]);

    project().newWorld();
    expect(project().scenarios.map((scenario) => scenario.name)).toEqual(["Plan A"]);

    await project().switchWorld(firstWorldId);
    expect(project().scenarios.map((scenario) => scenario.name)).toEqual(["Plan A", "Fast plan"]);
  });

  it("removes a scenario from memory immediately and persists the removal on save", async () => {
    project().createScenario();
    const removedId = project().activeScenarioId;
    project().deleteScenario(removedId);
    expect(project().scenarios.some((scenario) => scenario.id === removedId)).toBe(false);

    await project().saveProject();
    const projectId = project().projectId!;
    project().newProject("Other");
    await project().openProject(projectId);
    expect(project().scenarios.some((scenario) => scenario.id === removedId)).toBe(false);
  });

  it("saves every in-memory world and its scenarios in one Save Project", async () => {
    const firstWorldId = project().worldId;
    scene().setLight(40);
    project().createScenario();
    project().renameScenario(project().activeScenarioId, "World A plan");

    project().newWorld();
    const secondWorldId = project().worldId;
    project().renameWorld("Second depot");
    scene().setLight(80);
    project().createScenario();
    project().renameScenario(project().activeScenarioId, "World B plan");

    await project().saveProject();
    expect(project().projectId).not.toBeNull();
    expect(project().worlds).toHaveLength(2);
    expect(project().worlds.every((world) => world.revision === 1)).toBe(true);

    const id = project().projectId!;
    project().newProject("Other");
    await project().openProject(id);
    expect(project().worlds.map((world) => world.id)).toEqual([firstWorldId, secondWorldId]);
    expect(project().worlds[0].scenarios.map((scenario) => scenario.name)).toEqual(["Plan A", "World A plan"]);
    expect(project().worlds[1].scenarios.map((scenario) => scenario.name)).toEqual(["Plan A", "World B plan"]);
    expect(project().worldId).toBe(secondWorldId);
    expect(scene().document.light).toBe(80);
  });

  it("duplicates a world without copying its scenarios", () => {
    scene().setLight(42);
    project().createScenario();
    const sourceId = project().worldId;
    const sourceDocument = scene().document;
    project().duplicateWorld();

    expect(project().worldId).not.toBe(sourceId);
    expect(project().worldName).toBe("Untitled project world copy");
    expect(scene().document).toEqual(sourceDocument);
    expect(project().scenarios).toHaveLength(1);
    expect(project().scenarios[0].name).toBe("Plan A");
    expect(project().worlds).toHaveLength(2);
  });

  it("never removes the final scenario in a world", () => {
    project().deleteScenario(project().activeScenarioId);
    expect(project().scenarios).toHaveLength(1);
    project().createScenario();
    project().deleteScenario(project().activeScenarioId);
    expect(project().scenarios).toHaveLength(1);
  });

  it("validates project and scenario names", () => {
    expect(validateName("")).not.toBeNull();
    expect(validateName("x".repeat(101))).not.toBeNull();
    project().renameProject("");
    project().renameScenario(project().activeScenarioId, "x".repeat(101));
    expect(project().name).toBe("Untitled project");
    project().renameScenario(project().activeScenarioId, " Fast plan ");
    expect(activeName()).toBe("Fast plan");
  });

  it("opens the sample workspace", async () => {
    const sample = createSampleProjects()[0];
    await project().openProject(sample.project.id);
    expect(project().worldId).toBe(sample.worlds[0].id);
    expect(scene().document.objects).toHaveLength(4);
    expect(project().scenarios.map((scenario) => scenario.name)).toEqual(["Plan A · gradual", "Plan B · fast"]);
  });

  it("exports and imports all in-memory worlds", async () => {
    project().newWorld();
    project().renameWorld("Second world");
    const exported = project().exportProject();
    expect(exported.worlds).toHaveLength(2);

    await project().importProject(exported);
    expect(project().projectId).not.toBeNull();
    expect(project().worlds).toHaveLength(2);
    expect(project().worldName).toBe("Second world");
  });

  it("keeps edits and reports revision conflicts", async () => {
    await project().saveProject();
    const id = project().projectId!;
    const base = createMemoryProjectRepository();
    setProjectRepository({ ...base, updateWorkspace: async () => { throw new ProjectConflictError(); } });
    scene().setLight(12);
    await project().saveProject();
    expect(project().saveStatus.state).toBe("error");
    expect(project().projectId).toBe(id);
    expect(scene().document.light).toBe(12);
  });
});
