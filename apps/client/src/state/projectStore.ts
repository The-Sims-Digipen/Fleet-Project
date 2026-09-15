import { useMemo } from "react";
import { create } from "zustand";

import { createIndexedDbProjectRepository } from "../project/indexedDbRepository";
import { createPortableProject, type PortableProjectFile } from "../project/portableProject";
import { type ProjectRepository } from "../project/repository";
import { validateName, NAME_MAX_LENGTH, type Scenario, type WorkspaceRecord, type WorkspaceSaveInput, type WorkspaceWorld, type WorldSummary } from "../project/types";
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
  worlds: WorkspaceWorld[];
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
  switchWorld: (worldId: string) => Promise<void>;
  newWorld: () => void;
  duplicateWorld: () => void;
  deleteWorld: (id: string) => void;
  renameWorld: (name: string) => void;
  openProject: (id: string) => Promise<void>;
  saveProject: () => Promise<void>;
  listProjects: () => ReturnType<ProjectRepository["listProjects"]>;
  listWorlds: () => Promise<WorldSummary[]>;
  attachScenario: (scenario: Scenario) => void;
  renameProject: (name: string) => void;
  selectScenario: (id: string) => void;
  createScenario: () => void;
  duplicateScenario: (id: string) => void;
  renameScenario: (id: string, name: string) => void;
  deleteScenario: (id: string) => void;
  exportProject: () => PortableProjectFile;
  importProject: (file: PortableProjectFile) => Promise<void>;
};

let repository: ProjectRepository = createIndexedDbProjectRepository();
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

function createWorkspaceWorld(name: string, document: SceneDocument, id = crypto.randomUUID()): WorkspaceWorld {
  const scenario = newScenario(id, "Plan A");
  return { id, name, revision: 0, document: clone(document), scenarios: [scenario] };
}

function serializeSnapshot(name: string, activeWorldId: string, worlds: WorkspaceWorld[], presets: VehiclePreset[]) {
  return JSON.stringify({
    name,
    activeWorldId,
    worlds: worlds.map((world) => ({
      id: world.id,
      name: world.name,
      document: world.document,
      scenarios: world.scenarios.map(({ id, name: scenarioNameValue, document }) => ({ id, name: scenarioNameValue, document })),
    })),
    presets,
  });
}

function withActiveScene(worlds: WorkspaceWorld[], activeWorldId: string, document: SceneDocument): WorkspaceWorld[] {
  return worlds.map((world) => world.id === activeWorldId ? { ...world, document: clone(document) } : world);
}

function activeFields(world: WorkspaceWorld, preferredScenarioId?: string) {
  const scenario = world.scenarios.find((item) => item.id === preferredScenarioId) ?? world.scenarios[0];
  if (!scenario) throw new Error("A world needs at least one scenario.");
  return {
    worldId: world.id,
    worldName: world.name,
    worldRevision: world.revision,
    scenarios: clone(world.scenarios),
    activeScenarioId: scenario.id,
  };
}

export function createProjectFields(name = "Untitled project", world: SceneDocument = createDocument(), session = 0, presets: VehiclePreset[] = loadDefaultPresets()): ProjectFields {
  const workspaceWorld = createWorkspaceWorld(`${name} world`, world);
  return {
    projectId: null,
    revision: 0,
    name,
    worlds: [workspaceWorld],
    ...activeFields(workspaceWorld),
    baseline: serializeSnapshot(name, workspaceWorld.id, [workspaceWorld], presets),
    saveStatus: { state: "idle" },
    session,
  };
}

export const useProjectStore = create<ProjectState>((set, get) => {
  const scene = () => useSceneStore.getState();
  const presets = () => usePresetStore.getState();

  const captureWorlds = () => withActiveScene(get().worlds, get().worldId, scene().document);

  const setActiveWorld = (worlds: WorkspaceWorld[], worldId: string, preferredScenarioId?: string) => {
    const world = worlds.find((item) => item.id === worldId);
    if (!world) throw new Error("The selected world is not part of this project.");
    set({ worlds, ...activeFields(world, preferredScenarioId), saveStatus: { state: "idle" } });
    scene().loadDocument(world.document);
  };

  const replaceActiveWorld = (update: (world: WorkspaceWorld) => WorkspaceWorld) => {
    const worlds = captureWorlds();
    const index = worlds.findIndex((world) => world.id === get().worldId);
    if (index < 0) return;
    const nextWorld = update(worlds[index]);
    const nextWorlds = worlds.with(index, nextWorld);
    set({ worlds: nextWorlds, ...activeFields(nextWorld, get().activeScenarioId) });
  };

  const loadWorkspace = (record: WorkspaceRecord) => {
    const scenariosByWorld = new Map<string, Scenario[]>();
    for (const scenario of record.scenarios) {
      const list = scenariosByWorld.get(scenario.worldId) ?? [];
      list.push(clone(scenario));
      scenariosByWorld.set(scenario.worldId, list);
    }
    const worlds: WorkspaceWorld[] = record.worlds.map((world) => {
      const worldScenarios = scenariosByWorld.get(world.id) ?? [];
      return {
        ...clone(world),
        scenarios: worldScenarios.length ? worldScenarios : [newScenario(world.id, "Plan A")],
      };
    });
    if (!worlds.length) throw new Error("This project has no worlds.");
    const activeWorld = worlds.find((world) => world.id === record.project.worldId) ?? worlds[0];
    const vehiclePresets = record.project.document.vehiclePresets;
    set({
      projectId: record.project.id,
      revision: record.project.revision,
      name: record.project.name,
      worlds,
      ...activeFields(activeWorld),
      baseline: serializeSnapshot(record.project.name, activeWorld.id, worlds, vehiclePresets),
      saveStatus: { state: "idle" },
      session: get().session + 1,
    });
    scene().loadDocument(activeWorld.document);
    presets().replacePresets(vehiclePresets);
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
      const workspaceWorld: WorkspaceWorld = { ...clone(world), scenarios: [newScenario(world.id, "Plan A")] };
      set({
        projectId: null,
        revision: 0,
        name: name.trim(),
        worlds: [workspaceWorld],
        ...activeFields(workspaceWorld),
        baseline: serializeSnapshot(name.trim(), world.id, [workspaceWorld], nextPresets),
        saveStatus: { state: "idle" },
        session: get().session + 1,
      });
      scene().loadDocument(world.document);
      presets().replacePresets(nextPresets);
    },

    switchWorld: async (worldId) => {
      if (worldId === get().worldId) return;
      scene().commitEdit();
      presets().commitEdit();
      let worlds = captureWorlds();
      let target = worlds.find((world) => world.id === worldId);
      if (!target) {
        const saved = await repository.getWorld(worldId);
        target = { ...clone(saved), scenarios: [newScenario(saved.id, "Plan A")] };
        worlds = [...worlds, target];
      }
      setActiveWorld(worlds, target.id);
    },

    newWorld: () => {
      scene().commitEdit();
      presets().commitEdit();
      const worlds = captureWorlds();
      const world = createWorkspaceWorld("New world", createDocument());
      const nextWorlds = [...worlds, world];
      set({ worlds: nextWorlds, ...activeFields(world), saveStatus: { state: "idle" } });
      scene().loadDocument(world.document);
    },

    duplicateWorld: () => {
      scene().commitEdit();
      presets().commitEdit();
      const worlds = captureWorlds();
      const source = worlds.find((world) => world.id === get().worldId);
      if (!source) return;
      const world = createWorkspaceWorld(`${source.name} copy`.slice(0, NAME_MAX_LENGTH), source.document);
      const nextWorlds = [...worlds, world];
      set({ worlds: nextWorlds, ...activeFields(world), saveStatus: { state: "idle" } });
      scene().loadDocument(world.document);
    },

    deleteWorld: (id) => {
      scene().commitEdit();
      presets().commitEdit();
      const worlds = captureWorlds();
      if (worlds.length <= 1) return;
      const index = worlds.findIndex((world) => world.id === id);
      if (index < 0) return;
      const remaining = worlds.toSpliced(index, 1);

      if (id !== get().worldId) {
        set({ worlds: remaining, saveStatus: { state: "idle" } });
        return;
      }

      const nextWorld = remaining[Math.min(index, remaining.length - 1)];
      if (!nextWorld) return;
      set({ worlds: remaining, ...activeFields(nextWorld), saveStatus: { state: "idle" } });
      scene().loadDocument(nextWorld.document);
    },

    renameWorld: (name) => {
      if (validateName(name)) return;
      replaceActiveWorld((world) => ({ ...world, name: name.trim() }));
    },

    openProject: async (id) => loadWorkspace(await repository.getWorkspace(id)),
    listProjects: () => repository.listProjects(),
    listWorlds: () => repository.listWorlds(),

    saveProject: async () => {
      const state = get();
      if (state.saveStatus.state === "saving") return;
      scene().commitEdit();
      presets().commitEdit();

      const capturedWorlds = captureWorlds();
      const capturedPresets = clone(presets().presets);
      const projectId = state.projectId ?? crypto.randomUUID();
      const allScenarios = capturedWorlds.flatMap((world) => world.scenarios.map((scenario) => ({ ...scenario, worldId: world.id })));
      const base: WorkspaceSaveInput = {
        project: { id: projectId, name: state.name, activeWorldId: state.worldId, document: { version: 2, vehiclePresets: capturedPresets } },
        worlds: capturedWorlds.map((world) => ({ id: world.id, name: world.name, expectedRevision: world.revision, document: clone(world.document) })),
        scenarios: allScenarios.map((scenario) => ({ id: scenario.id, worldId: scenario.worldId, name: scenario.name, expectedRevision: scenario.revision, document: clone(scenario.document) })),
      };
      const capturedBaseline = serializeSnapshot(state.name, state.worldId, capturedWorlds, capturedPresets);
      const session = state.session;
      const preferredScenarioId = state.activeScenarioId;
      set({ worlds: capturedWorlds, saveStatus: { state: "saving" } });

      try {
        const record = state.projectId
          ? await repository.updateWorkspace({ ...base, project: { ...base.project, expectedRevision: state.revision } })
          : await repository.createWorkspace(base);
        if (get().session !== session) return;

        const scenariosByWorld = new Map<string, Scenario[]>();
        for (const scenario of record.scenarios) {
          const list = scenariosByWorld.get(scenario.worldId) ?? [];
          list.push(clone(scenario));
          scenariosByWorld.set(scenario.worldId, list);
        }
        const savedWorlds: WorkspaceWorld[] = record.worlds.map((world) => ({
          ...clone(world),
          scenarios: scenariosByWorld.get(world.id) ?? [],
        }));
        const activeWorld = savedWorlds.find((world) => world.id === state.worldId) ?? savedWorlds[0];
        if (!activeWorld) throw new Error("The saved project has no worlds.");
        set({
          projectId: record.project.id,
          revision: record.project.revision,
          name: record.project.name,
          worlds: savedWorlds,
          ...activeFields(activeWorld, preferredScenarioId),
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
      replaceActiveWorld((world) => {
        const scenario = newScenario(world.id, scenarioName(world.scenarios));
        set({ activeScenarioId: scenario.id });
        return { ...world, scenarios: [...world.scenarios, scenario] };
      });
    },

    duplicateScenario: (id) => {
      replaceActiveWorld((world) => {
        const index = world.scenarios.findIndex((scenario) => scenario.id === id);
        if (index < 0) return world;
        const source = world.scenarios[index];
        const copy: Scenario = {
          ...clone(source),
          id: crypto.randomUUID(),
          worldId: world.id,
          revision: 0,
          worldRevision: world.revision,
          name: `${source.name} copy`.slice(0, NAME_MAX_LENGTH),
          createdAt: undefined,
          updatedAt: undefined,
        };
        set({ activeScenarioId: copy.id });
        return { ...world, scenarios: world.scenarios.toSpliced(index + 1, 0, copy) };
      });
    },

    renameScenario: (id, name) => {
      if (validateName(name)) return;
      replaceActiveWorld((world) => ({ ...world, scenarios: world.scenarios.map((scenario) => scenario.id === id ? { ...scenario, name: name.trim() } : scenario) }));
    },

    deleteScenario: (id) => {
      const world = captureWorlds().find((item) => item.id === get().worldId);
      if (!world) return;
      const index = world.scenarios.findIndex((scenario) => scenario.id === id);
      if (index < 0 || world.scenarios.length <= 1) return;
      const remaining = world.scenarios.toSpliced(index, 1);
      const activeScenarioId = get().activeScenarioId === id ? remaining[Math.min(index, remaining.length - 1)].id : get().activeScenarioId;
      const worlds = captureWorlds().map((item) => item.id === world.id ? { ...item, scenarios: remaining } : item);
      set({ worlds, scenarios: clone(remaining), activeScenarioId });
    },

    exportProject: () => {
      scene().commitEdit();
      presets().commitEdit();
      const state = get();
      const worlds = withActiveScene(state.worlds, state.worldId, scene().document);
      return createPortableProject({
        projectName: state.name,
        projectDocument: { version: 2, vehiclePresets: clone(presets().presets) },
        worlds: worlds.map((world) => ({ name: world.name, document: clone(world.document), scenarios: world.scenarios.map((scenario) => ({ name: scenario.name, document: clone(scenario.document) })) })),
        activeWorldIndex: Math.max(0, worlds.findIndex((world) => world.id === state.worldId)),
        activeScenarioIndex: Math.max(0, state.scenarios.findIndex((scenario) => scenario.id === state.activeScenarioId)),
      });
    },

    importProject: async (file) => {
      const projectId = crypto.randomUUID();
      const worlds = file.worlds.map((world) => {
        const worldId = crypto.randomUUID();
        return {
          id: worldId,
          name: world.name,
          expectedRevision: 0,
          document: clone(world.document),
          scenarios: world.scenarios.map((scenario) => ({ id: crypto.randomUUID(), worldId, name: scenario.name, expectedRevision: 0, document: clone(scenario.document) })),
        };
      });
      const activeWorld = worlds[file.activeWorldIndex] ?? worlds[0];
      if (!activeWorld) throw new Error("The imported project has no worlds.");
      const record = await repository.createWorkspace({
        project: { id: projectId, name: file.project.name, activeWorldId: activeWorld.id, document: clone(file.project.document) },
        worlds: worlds.map(({ scenarios: _scenarios, ...world }) => world),
        scenarios: worlds.flatMap((world) => world.scenarios),
      });
      loadWorkspace(record);
      const importedActiveWorld = get().worlds[file.activeWorldIndex];
      if (importedActiveWorld) {
        const importedScenario = importedActiveWorld.scenarios[file.activeScenarioIndex];
        setActiveWorld(get().worlds, importedActiveWorld.id, importedScenario?.id);
      }
    },

    attachScenario: (scenario) => {
      if (scenario.worldId !== get().worldId || get().scenarios.some((item) => item.id === scenario.id)) return;
      replaceActiveWorld((world) => ({ ...world, scenarios: [...world.scenarios, clone(scenario)] }));
      set({ activeScenarioId: scenario.id });
    },
  };
});

export function useProjectDirty() {
  const world = useSceneStore((state) => state.document);
  const vehiclePresets = usePresetStore((state) => state.presets);
  const name = useProjectStore((state) => state.name);
  const worlds = useProjectStore((state) => state.worlds);
  const worldId = useProjectStore((state) => state.worldId);
  const baseline = useProjectStore((state) => state.baseline);
  return useMemo(() => serializeSnapshot(name, worldId, withActiveScene(worlds, worldId, world), vehiclePresets) !== baseline,
    [name, worlds, worldId, world, vehiclePresets, baseline]);
}

// Scene edits are workspace edits first. Keep the active World's in-memory document synchronized,
// but do not touch IndexedDB until Save Project is explicitly used.
useSceneStore.subscribe((state, previous) => {
  if (state.document === previous.document) return;
  const project = useProjectStore.getState();
  if (!project.worlds.some((world) => world.id === project.worldId)) return;
  useProjectStore.setState({
    worlds: project.worlds.map((world) => world.id === project.worldId ? { ...world, document: state.document } : world),
  });
});
