import { beforeEach, describe, expect, it } from "vitest";
import { createMemoryProjectRepository, ProjectConflictError } from "../project/repository";
import { createSampleProjects } from "../project/sampleProjects";
import { validateName } from "../project/types";
import { createProjectFields, setProjectRepository, useProjectStore } from "./projectStore";
import { createDocument, createEditorState, useSceneStore } from "./sceneStore";

const project = useProjectStore.getState;
const scene = useSceneStore.getState;
const activeName = () => project().scenarios.find((scenario) => scenario.id === project().activeScenarioId)!.name;
const saved = () => project().projectId !== null;

beforeEach(() => {
  setProjectRepository(createMemoryProjectRepository(createSampleProjects()));
  const document = createDocument();
  useSceneStore.setState({ document, editor: createEditorState(), history: { past: [], future: [], baseline: null } });
  useProjectStore.setState(createProjectFields("Untitled project", document));
});

describe("project and scenario store", () => {
  it("creates a new unsaved project with one Plan A scenario and a fresh scene", () => {
    scene().setLight(10);
    project().newProject("  Depot transition  ");
    expect(project()).toMatchObject({ name: "Depot transition", projectId: null, revision: 0 });
    expect(project().scenarios.map((scenario) => scenario.name)).toEqual(["Plan A"]);
    expect(scene().document).toEqual(createDocument());
    expect(scene().history.past).toHaveLength(0);
    expect(scene().editor.selectedObjectId).toBeNull();
    project().newProject("   ");
    expect(project().name).toBe("Depot transition");
  });

  it("keeps an independent scene per scenario and resets history when switching", () => {
    const planA = project().activeScenarioId;
    scene().setLight(20);
    project().createScenario();
    expect(activeName()).toBe("Plan B");
    expect(scene().document.light).toBe(65);
    expect(scene().history.past).toHaveLength(0);
    scene().addObject("van");
    project().selectScenario(planA);
    expect(scene().document.light).toBe(20);
    expect(scene().document.objects).toHaveLength(1);
    project().selectScenario(project().scenarios[1].id);
    expect(scene().document.objects).toHaveLength(2);
  });

  it("commits an in-progress edit into the scenario being left", () => {
    const planA = project().activeScenarioId;
    scene().beginEdit();
    scene().setLight(33);
    project().createScenario();
    project().selectScenario(planA);
    expect(scene().document.light).toBe(33);
  });

  it("duplicates a scenario as a deep copy and names new scenarios uniquely", () => {
    scene().updateTransform("sample", "position", [4, 0, 0]);
    project().duplicateScenario(project().activeScenarioId);
    expect(activeName()).toBe("Plan A copy");
    scene().updateTransform("sample", "position", [9, 0, 0]);
    project().selectScenario(project().scenarios[0].id);
    expect(scene().document.objects[0].transform.position).toEqual([4, 0, 0]);
    project().createScenario();
    expect(activeName()).toBe("Plan B");
  });

  it("never deletes the final scenario and activates a neighbour when deleting the active one", () => {
    project().deleteScenario(project().activeScenarioId);
    expect(project().scenarios).toHaveLength(1);
    const planA = project().activeScenarioId;
    project().createScenario();
    scene().setLight(5);
    project().createScenario();
    const planB = project().scenarios[1].id;
    project().selectScenario(planB);
    project().deleteScenario(planB);
    expect(project().scenarios.map((scenario) => scenario.name)).toEqual(["Plan A", "Plan C"]);
    expect(activeName()).toBe("Plan C");
    project().deleteScenario(planA);
    expect(activeName()).toBe("Plan C");
  });

  it("validates project and scenario names", () => {
    expect(validateName("")).not.toBeNull();
    expect(validateName("x".repeat(101))).not.toBeNull();
    expect(validateName(` ${"x".repeat(100)} `)).toBeNull();
    project().renameProject("");
    project().renameScenario(project().activeScenarioId, "x".repeat(101));
    expect(project().name).toBe("Untitled project");
    expect(activeName()).toBe("Plan A");
    project().renameScenario(project().activeScenarioId, " Fast plan ");
    expect(activeName()).toBe("Fast plan");
  });

  it("saves new and existing projects, then reopens every scenario scene", async () => {
    project().renameProject("Depot transition");
    scene().setLight(40);
    project().createScenario();
    scene().addObject("van");
    await project().saveProject();
    expect(saved()).toBe(true);
    expect(project().revision).toBe(1);
    const id = project().projectId!;
    project().renameProject("Depot transition v2");
    await project().saveProject();
    expect(project().revision).toBe(2);

    project().newProject("Other");
    await project().openProject(id);
    expect(project().name).toBe("Depot transition v2");
    expect(project().scenarios.map((scenario) => scenario.name)).toEqual(["Plan A", "Plan B"]);
    expect(scene().document.light).toBe(40);
    project().selectScenario(project().scenarios[1].id);
    expect(scene().document.objects).toHaveLength(2);
    const list = await project().listProjects();
    expect(list[0]).toMatchObject({ id, name: "Depot transition v2", scenarioCount: 2 });
  });

  it("opens the placeholder sample project with distinct scenario scenes", async () => {
    await project().openProject("sample-depot-transition");
    expect(scene().document.objects).toHaveLength(2);
    project().selectScenario("sample-plan-b");
    expect(scene().document.objects).toHaveLength(4);
  });

  it("keeps edits and reports an error when a save conflicts", async () => {
    await project().saveProject();
    const id = project().projectId!;
    setProjectRepository({
      ...createMemoryProjectRepository(),
      update: async () => { throw new ProjectConflictError(); },
    });
    scene().setLight(12);
    await project().saveProject();
    expect(project().saveStatus).toEqual({ state: "error", message: new ProjectConflictError().message });
    expect(project().projectId).toBe(id);
    expect(scene().document.light).toBe(12);
  });

  it("ignores a save that finishes after another project was opened", async () => {
    let finish!: () => void;
    const repository = createMemoryProjectRepository();
    setProjectRepository({ ...repository, create: (name, document) => new Promise((resolve) => { finish = () => resolve(repository.create(name, document)); }) });
    const saving = project().saveProject();
    expect(project().saveStatus.state).toBe("saving");
    project().newProject("Replacement");
    finish();
    await saving;
    expect(project()).toMatchObject({ name: "Replacement", projectId: null, saveStatus: { state: "idle" } });
  });

  it("returns copies from the in-memory repository", async () => {
    const repository = createMemoryProjectRepository();
    const record = await repository.create("Copy test", { version: 1, scenarios: [] });
    record.name = "Mutated";
    expect((await repository.get(record.id)).name).toBe("Copy test");
    await expect(repository.update(record.id, 5, "Stale", record.document)).rejects.toBeInstanceOf(ProjectConflictError);
  });
});
