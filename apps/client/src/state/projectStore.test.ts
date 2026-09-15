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

describe("project/world/scenario store", () => {
  it("creates a new unsaved project with one scenario bound to its world", () => {
    project().newProject("  Depot transition  ");
    expect(project()).toMatchObject({ name: "Depot transition", projectId: null, revision: 0, worldRevision: 0 });
    expect(project().scenarios).toHaveLength(1);
    expect(project().scenarios[0]).toMatchObject({ name: "Plan A", worldId: project().worldId, revision: 0 });
  });

  it("keeps one shared world while switching independent scenarios", () => {
    scene().setLight(20);
    const planA = project().activeScenarioId;
    project().createScenario();
    const planB = project().activeScenarioId;
    expect(planB).not.toBe(planA);
    expect(scene().document.light).toBe(20);
    scene().addObject("van");
    project().selectScenario(planA);
    expect(scene().document.objects).toHaveLength(2);
    project().selectScenario(planB);
    expect(scene().document.objects).toHaveLength(2);
  });

  it("duplicates scenario data without duplicating the world", () => {
    const sourceId = project().activeScenarioId;
    const worldId = project().worldId;
    project().duplicateScenario(sourceId);
    expect(activeName()).toBe("Plan A copy");
    expect(project().scenarios[1]).toMatchObject({ worldId, revision: 0 });
    expect(project().scenarios[1].document).toEqual(project().scenarios[0].document);
    expect(project().scenarios[1].document).not.toBe(project().scenarios[0].document);
  });

  it("never removes the final scenario", () => {
    project().deleteScenario(project().activeScenarioId);
    expect(project().scenarios).toHaveLength(1);
    project().createScenario();
    const active = project().activeScenarioId;
    project().deleteScenario(active);
    expect(project().scenarios).toHaveLength(1);
    expect(project().activeScenarioId).toBe(project().scenarios[0].id);
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

  it("saves and reopens the world and scenarios as separate records", async () => {
    project().renameProject("Depot transition");
    scene().setLight(40);
    project().createScenario();
    await project().saveProject();
    expect(project().projectId).not.toBeNull();
    expect(project().revision).toBe(1);
    expect(project().worldRevision).toBe(1);
    expect(project().scenarios.every((scenario) => scenario.revision === 1)).toBe(true);

    const id = project().projectId!;
    scene().addObject("van");
    await project().saveProject();
    expect(project().revision).toBe(2);
    expect(project().worldRevision).toBe(2);

    project().newProject("Other");
    await project().openProject(id);
    expect(scene().document.light).toBe(40);
    expect(scene().document.objects).toHaveLength(2);
    expect(project().scenarios.map((scenario) => scenario.name)).toEqual(["Plan A", "Plan B"]);
  });

  it("opens the sample workspace without changing the world when scenarios switch", async () => {
    const sample = createSampleProjects()[0];
    await project().openProject(sample.project.id);
    expect(scene().document.objects).toHaveLength(4);
    project().selectScenario(project().scenarios[1].id);
    expect(scene().document.objects).toHaveLength(4);
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
