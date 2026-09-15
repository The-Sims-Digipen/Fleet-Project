import { useMemo } from "react";
import { create } from "zustand";

import { createMemoryProjectRepository, type ProjectRepository } from "../project/repository";
import { createSampleProjects } from "../project/sampleProjects";
import { validateName, NAME_MAX_LENGTH, type ProjectDocument, type ProjectRecord, type ProjectSummary, type Scenario } from "../project/types";
import type { SceneDocument } from "../scene/types";
import { createDocument, useSceneStore } from "./sceneStore";

export type SaveStatus = { state: "idle" } | { state: "saving" } | { state: "error"; message: string };

type ProjectFields = {
  /** Null until the project is first saved. */
  projectId: string | null;
  revision: number;
  name: string;
  /** The active scenario's scene lives in the scene store; its entry here is refreshed when leaving it. */
  scenarios: Scenario[];
  activeScenarioId: string;
  /** Serialized inputs at the last new/open/save, used to detect unsaved changes. */
  baseline: string;
  saveStatus: SaveStatus;
  /** Incremented whenever another project replaces the open one, so late save results are ignored. */
  session: number;
};

type ProjectState = ProjectFields & {
  newProject: (name: string) => void;
  openProject: (id: string) => Promise<void>;
  saveProject: () => Promise<void>;
  listProjects: () => Promise<ProjectSummary[]>;
  renameProject: (name: string) => void;
  selectScenario: (id: string) => void;
  createScenario: () => void;
  duplicateScenario: (id: string) => void;
  renameScenario: (id: string, name: string) => void;
  deleteScenario: (id: string) => void;
};

let repository: ProjectRepository = createMemoryProjectRepository(createSampleProjects());

/** Swaps the storage boundary, e.g. for tests or the F09 API client. */
export function setProjectRepository(next: ProjectRepository) { repository = next; }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export function captureDocument(scenarios: Scenario[], activeScenarioId: string, activeScene: SceneDocument): ProjectDocument {
  return { version: 1, scenarios: scenarios.map((scenario) => scenario.id === activeScenarioId ? { ...scenario, scene: activeScene } : scenario) };
}

const serialize = (name: string, document: ProjectDocument) => JSON.stringify({ name, document });

function scenarioName(scenarios: Scenario[]) {
  const names = new Set(scenarios.map((scenario) => scenario.name));
  for (let index = 0; ; index++) {
    const name = `Plan ${index < 26 ? String.fromCharCode(65 + index) : index + 1}`;
    if (!names.has(name)) return name;
  }
}

/** Fields for a new, never-saved project whose only scenario uses the given scene. */
export function createProjectFields(name = "Untitled project", scene: SceneDocument = createDocument(), session = 0): ProjectFields {
  const scenario: Scenario = { id: crypto.randomUUID(), name: "Plan A", scene };
  return {
    projectId: null,
    revision: 0,
    name,
    scenarios: [scenario],
    activeScenarioId: scenario.id,
    baseline: serialize(name, { version: 1, scenarios: [scenario] }),
    saveStatus: { state: "idle" },
    session,
  };
}

export const useProjectStore = create<ProjectState>((set, get) => {
  const scene = () => useSceneStore.getState();

  /** Finishes pending scene edits and returns scenarios with the active scene written back. */
  const stashActiveScene = () => {
    scene().commitEdit();
    const { scenarios, activeScenarioId } = get();
    return captureDocument(scenarios, activeScenarioId, scene().document).scenarios;
  };

  const activate = (scenarios: Scenario[], scenario: Scenario) => {
    set({ scenarios, activeScenarioId: scenario.id });
    scene().loadDocument(scenario.scene);
  };

  const applyRecord = (record: ProjectRecord) => {
    const [first] = record.document.scenarios;
    if (!first) throw new Error("This project has no scenarios.");
    set({
      projectId: record.id,
      revision: record.revision,
      name: record.name,
      scenarios: record.document.scenarios,
      activeScenarioId: first.id,
      baseline: serialize(record.name, record.document),
      saveStatus: { state: "idle" },
      session: get().session + 1,
    });
    scene().loadDocument(first.scene);
  };

  return {
    ...createProjectFields("Untitled project", useSceneStore.getState().document),

    newProject: (name) => {
      if (validateName(name)) return;
      const fields = createProjectFields(name.trim(), createDocument(), get().session + 1);
      set(fields);
      scene().loadDocument(fields.scenarios[0].scene);
    },

    openProject: async (id) => { applyRecord(await repository.get(id)); },

    listProjects: () => repository.list(),

    saveProject: async () => {
      const { saveStatus, projectId, revision, name, session } = get();
      if (saveStatus.state === "saving") return;
      const document = { version: 1 as const, scenarios: stashActiveScene() };
      set({ saveStatus: { state: "saving" } });
      try {
        const record = projectId ? await repository.update(projectId, revision, name, document) : await repository.create(name, document);
        if (get().session !== session) return;
        // Edits made while saving stay unsaved because the baseline is the captured snapshot.
        set({ projectId: record.id, revision: record.revision, baseline: serialize(name, document), saveStatus: { state: "idle" } });
      } catch (error) {
        if (get().session !== session) return;
        set({ saveStatus: { state: "error", message: error instanceof Error ? error.message : "The project could not be saved." } });
      }
    },

    renameProject: (name) => {
      if (!validateName(name)) set({ name: name.trim() });
    },

    selectScenario: (id) => {
      const target = get().scenarios.find((scenario) => scenario.id === id);
      if (!target || id === get().activeScenarioId) return;
      const scenarios = stashActiveScene();
      activate(scenarios, scenarios.find((scenario) => scenario.id === id)!);
    },

    createScenario: () => {
      const scenarios = stashActiveScene();
      const scenario: Scenario = { id: crypto.randomUUID(), name: scenarioName(scenarios), scene: createDocument() };
      activate([...scenarios, scenario], scenario);
    },

    duplicateScenario: (id) => {
      const scenarios = stashActiveScene();
      const index = scenarios.findIndex((scenario) => scenario.id === id);
      if (index < 0) return;
      const source = scenarios[index];
      const copy: Scenario = { id: crypto.randomUUID(), name: `${source.name} copy`.slice(0, NAME_MAX_LENGTH), scene: clone(source.scene) };
      activate(scenarios.toSpliced(index + 1, 0, copy), copy);
    },

    renameScenario: (id, name) => {
      if (validateName(name)) return;
      set({ scenarios: get().scenarios.map((scenario) => scenario.id === id ? { ...scenario, name: name.trim() } : scenario) });
    },

    deleteScenario: (id) => {
      const { scenarios: current, activeScenarioId } = get();
      const index = current.findIndex((scenario) => scenario.id === id);
      if (index < 0 || current.length <= 1) return;
      if (id !== activeScenarioId) {
        set({ scenarios: current.toSpliced(index, 1) });
        return;
      }
      scene().commitEdit();
      const remaining = current.toSpliced(index, 1);
      activate(remaining, remaining[Math.min(index, remaining.length - 1)]);
    },
  };
});

/** True when the project name, scenarios, or any scenario scene differs from the last new/open/save. */
export function useProjectDirty() {
  const activeScene = useSceneStore((state) => state.document);
  const name = useProjectStore((state) => state.name);
  const scenarios = useProjectStore((state) => state.scenarios);
  const activeScenarioId = useProjectStore((state) => state.activeScenarioId);
  const baseline = useProjectStore((state) => state.baseline);
  return useMemo(() => serialize(name, captureDocument(scenarios, activeScenarioId, activeScene)) !== baseline, [name, scenarios, activeScenarioId, activeScene, baseline]);
}
