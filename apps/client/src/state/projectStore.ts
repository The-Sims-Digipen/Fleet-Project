import { useMemo } from "react";
import { create } from "zustand";

import { createApiProjectRepository, type ProjectRepository } from "../project/repository";
import { validateName, NAME_MAX_LENGTH, type Scenario, type WorkspaceRecord, type WorkspaceSaveInput, type WorldSummary } from "../project/types";
import type { SceneDocument } from "../scene/types";
import { loadDefaultPresets } from "../vehicles/defaults";
import type { VehiclePreset } from "../vehicles/types";
import { usePresetStore } from "./presetStore";
import { createDocument, useSceneStore } from "./sceneStore";

export type SaveStatus = { state: "idle" } | { state: "saving" } | { state: "error"; message: string };

type ProjectFields = {
  projectId: string | null;
  revision: number;
  name: string;
  worldId: string;
  worldName: string;
  worldRevision: number;
  scenarios: Scenario[];
  activeScenarioId: string;
  baseline: string;
  saveStatus: SaveStatus;
  session: number;
};

type ProjectState = ProjectFields & {
  newProject: (name: string) => void;
  newProjectWithWorld: (name: string, worldId: string) => Promise<void>;
  openProject: (id: string) => Promise<void>;
  saveProject: () => Promise<void>;
  listProjects: () => ReturnType<ProjectRepository["listProjects"]>;
  listWorlds: () => Promise<WorldSummary[]>;
  listCompatibleScenarios: () => Promise<Scenario[]>;
  attachScenario: (scenario: Scenario) => void;
  renameProject: (name: string) => void;
  selectScenario: (id: string) => void;
  createScenario: () => void;
  duplicateScenario: (id: string) => void;
  renameScenario: (id: string, name: string) => void;
  deleteScenario: (id: string) => void;
};

let repository: ProjectRepository = createApiProjectRepository();
export function setProjectRepository(next: ProjectRepository) { repository = next; }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const newScenario = (worldId: string, name: string): Scenario => ({
  id: crypto.randomUUID(), worldId, name, revision: 0, worldRevision: 0, document: { version: 1 },
});

function scenarioName(scenarios: Scenario[]) {
  const names = new Set(scenarios.map((scenario) => scenario.name));
  for (let index = 0; ; index++) {
    const name = `Plan ${index < 26 ? String.fromCharCode(65 + index) : index + 1}`;
    if (!names.has(name)) return name;
  }
}

function serializeSnapshot(name: string, worldId: string, worldName: string, world: SceneDocument, scenarios: Scenario[], presets: VehiclePreset[]) {
  return JSON.stringify({
    name, worldId, worldName, world,
    scenarios: scenarios.map(({ id, name: scenarioNameValue, document }) => ({ id, name: scenarioNameValue, document })),
    presets,
  });
}

export function createProjectFields(name = "Untitled project", world: SceneDocument = createDocument(), session = 0, presets: VehiclePreset[] = loadDefaultPresets()): ProjectFields {
  const worldId = crypto.randomUUID();
  const scenario = newScenario(worldId, "Plan A");
  const worldName = `${name} world`;
  return {
    projectId: null, revision: 0, name, worldId, worldName, worldRevision: 0,
    scenarios: [scenario], activeScenarioId: scenario.id,
    baseline: serializeSnapshot(name, worldId, worldName, world, [scenario], presets),
    saveStatus: { state: "idle" }, session,
  };
}

export const useProjectStore = create<ProjectState>((set, get) => {
  const scene = () => useSceneStore.getState();
  const presets = () => usePresetStore.getState();

  const loadWorkspace = (record: WorkspaceRecord, preserveActive = false) => {
    const activeId = preserveActive && record.scenarios.some((scenario) => scenario.id === get().activeScenarioId)
      ? get().activeScenarioId : record.scenarios[0]?.id;
    if (!activeId) throw new Error("This project has no scenarios.");
    const copiedScenarios = clone(record.scenarios);
    set({
      projectId: record.project.id,
      revision: record.project.revision,
      name: record.project.name,
      worldId: record.world.id,
      worldName: record.world.name,
      worldRevision: record.world.revision,
      scenarios: copiedScenarios,
      activeScenarioId: activeId,
      baseline: serializeSnapshot(record.project.name, record.world.id, record.world.name, record.world.document, copiedScenarios, record.project.document.vehiclePresets),
      saveStatus: { state: "idle" },
      session: get().session + (preserveActive ? 0 : 1),
    });
    scene().loadDocument(record.world.document);
    presets().replacePresets(record.project.document.vehiclePresets);
  };

  return {
    ...createProjectFields("Untitled project", useSceneStore.getState().document, 0, usePresetStore.getState().presets),

    newProject: (name) => {
      if (validateName(name)) return;
      const nextPresets = loadDefaultPresets();
      const world = createDocument();
      const fields = createProjectFields(name.trim(), world, get().session + 1, nextPresets);
      set(fields);
      scene().loadDocument(world);
      presets().replacePresets(nextPresets);
    },

    newProjectWithWorld: async (name, worldId) => {
      if (validateName(name)) return;
      const world = await repository.getWorld(worldId);
      const nextPresets = loadDefaultPresets();
      const scenario = newScenario(world.id, "Plan A");
      set({
        projectId: null, revision: 0, name: name.trim(), worldId: world.id, worldName: world.name, worldRevision: world.revision,
        scenarios: [scenario], activeScenarioId: scenario.id,
        baseline: serializeSnapshot(name.trim(), world.id, world.name, world.document, [scenario], nextPresets),
        saveStatus: { state: "idle" }, session: get().session + 1,
      });
      scene().loadDocument(world.document);
      presets().replacePresets(nextPresets);
    },

    openProject: async (id) => loadWorkspace(await repository.getWorkspace(id)),
    listProjects: () => repository.listProjects(),
    listWorlds: () => repository.listWorlds(),
    listCompatibleScenarios: () => repository.listScenarios(get().worldId),

    saveProject: async () => {
      const state = get();
      if (state.saveStatus.state === "saving") return;
      scene().commitEdit();
      presets().commitEdit();

      const capturedWorld = clone(scene().document);
      const capturedPresets = clone(presets().presets);
      const capturedScenarios = clone(state.scenarios);
      const projectId = state.projectId ?? crypto.randomUUID();
      const base: WorkspaceSaveInput = {
        project: { id: projectId, name: state.name, document: { version: 2, vehiclePresets: capturedPresets } },
        world: { id: state.worldId, name: state.worldName, expectedRevision: state.worldRevision, document: capturedWorld },
        scenarios: capturedScenarios.map((scenario) => ({ id: scenario.id, name: scenario.name, expectedRevision: scenario.revision, document: scenario.document })),
      };
      const capturedBaseline = serializeSnapshot(state.name, state.worldId, state.worldName, capturedWorld, capturedScenarios, capturedPresets);
      const session = state.session;
      set({ saveStatus: { state: "saving" } });

      try {
        const record = state.projectId
          ? await repository.updateWorkspace({ ...base, project: { ...base.project, expectedRevision: state.revision } })
          : await repository.createWorkspace(base);
        if (get().session !== session) return;

        const savedById = new Map(record.scenarios.map((scenario) => [scenario.id, scenario]));
        const currentScenarios = get().scenarios.map((scenario) => {
          const saved = savedById.get(scenario.id);
          return saved ? { ...scenario, revision: saved.revision, worldRevision: saved.worldRevision, createdAt: saved.createdAt, updatedAt: saved.updatedAt } : scenario;
        });
        set({
          projectId: record.project.id,
          revision: record.project.revision,
          worldRevision: record.world.revision,
          scenarios: currentScenarios,
          baseline: capturedBaseline,
          saveStatus: { state: "idle" },
        });
      } catch (error) {
        if (get().session !== session) return;
        set({ saveStatus: { state: "error", message: error instanceof Error ? error.message : "The project could not be saved." } });
      }
    },

    renameProject: (name) => { if (!validateName(name)) set({ name: name.trim() }); },
    selectScenario: (id) => { if (get().scenarios.some((scenario) => scenario.id === id)) set({ activeScenarioId: id }); },

    createScenario: () => {
      const scenario = newScenario(get().worldId, scenarioName(get().scenarios));
      set({ scenarios: [...get().scenarios, scenario], activeScenarioId: scenario.id });
    },

    duplicateScenario: (id) => {
      const scenarios = get().scenarios;
      const index = scenarios.findIndex((scenario) => scenario.id === id);
      if (index < 0) return;
      const source = scenarios[index];
      const copy: Scenario = {
        ...clone(source), id: crypto.randomUUID(), revision: 0, worldRevision: get().worldRevision,
        name: `${source.name} copy`.slice(0, NAME_MAX_LENGTH), createdAt: undefined, updatedAt: undefined,
      };
      set({ scenarios: scenarios.toSpliced(index + 1, 0, copy), activeScenarioId: copy.id });
    },

    renameScenario: (id, name) => {
      if (validateName(name)) return;
      set({ scenarios: get().scenarios.map((scenario) => scenario.id === id ? { ...scenario, name: name.trim() } : scenario) });
    },

    deleteScenario: (id) => {
      const current = get().scenarios;
      const index = current.findIndex((scenario) => scenario.id === id);
      if (index < 0 || current.length <= 1) return;
      const remaining = current.toSpliced(index, 1);
      const activeScenarioId = get().activeScenarioId === id ? remaining[Math.min(index, remaining.length - 1)].id : get().activeScenarioId;
      set({ scenarios: remaining, activeScenarioId });
    },

    attachScenario: (scenario) => {
      if (scenario.worldId !== get().worldId || get().scenarios.some((item) => item.id === scenario.id)) return;
      set({ scenarios: [...get().scenarios, clone(scenario)], activeScenarioId: scenario.id });
    },
  };
});

export function useProjectDirty() {
  const world = useSceneStore((state) => state.document);
  const vehiclePresets = usePresetStore((state) => state.presets);
  const name = useProjectStore((state) => state.name);
  const worldId = useProjectStore((state) => state.worldId);
  const worldName = useProjectStore((state) => state.worldName);
  const scenarios = useProjectStore((state) => state.scenarios);
  const baseline = useProjectStore((state) => state.baseline);
  return useMemo(() => serializeSnapshot(name, worldId, worldName, world, scenarios, vehiclePresets) !== baseline,
    [name, worldId, worldName, world, scenarios, vehiclePresets, baseline]);
}
