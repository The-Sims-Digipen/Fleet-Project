import { useMemo } from "react";
import { create } from "zustand";

import type { AnalysisSettings, FleetVehicle } from "../domain/contracts";
import { isYearInPeriod } from "../domain/fleet";
import { createMockAnalysis, createMockFleet, createMockPresets } from "../domain/mockProject";
import { createProjectDocument, toM1ProjectDocument } from "../domain/projectDocument";
import { cloneScenarioDocument, createScenarioDocument } from "../domain/scenario";
import { withoutVehiclePlan } from "../domain/references";
import { createIndexedDbProjectRepository } from "../project/indexedDbRepository";
import { createPortableProject, type PortableProjectFile } from "../project/portableProject";
import type { ProjectRepository } from "../project/repository";
import { validateName, NAME_MAX_LENGTH, type ScenarioVehiclePlan, type WorkspaceRecord, type WorkspaceSaveInput, type WorkspaceScenario } from "../project/types";
import type { SceneDocument } from "../scene/types";
import type { VehiclePreset } from "../vehicles/types";
import { useFleetStore } from "./fleetStore";
import { usePresetStore } from "./presetStore";
import { createDocument, useSceneStore } from "./sceneStore";

export type SaveStatus = { state: "idle" } | { state: "saving" } | { state: "error"; message: string };

type ProjectFields = {
  projectId: string | null;
  revision: number;
  name: string;
  scenarios: WorkspaceScenario[];
  activeScenarioId: string;
  baseline: string;
  saveStatus: SaveStatus;
  session: number;
};

type ProjectState = ProjectFields & {
  newProject: (name: string) => void;
  openProject: (id: string) => Promise<void>;
  saveProject: () => Promise<void>;
  listProjects: () => ReturnType<ProjectRepository["listProjects"]>;
  renameProject: (name: string) => void;
  selectScenario: (id: string) => void;
  createScenario: () => void;
  duplicateScenario: (id: string) => void;
  renameScenario: (id: string, name: string) => void;
  deleteScenario: (id: string) => void;
  updateScenarioVehiclePlan: (scenarioId: string, vehicleId: string, patch: Partial<ScenarioVehiclePlan>) => void;
  removeVehiclePlans: (vehicleId: string) => void;
  exportProject: () => PortableProjectFile;
  importProject: (file: PortableProjectFile) => Promise<void>;
};

let repository: ProjectRepository = createIndexedDbProjectRepository();
export function setProjectRepository(next: ProjectRepository) { repository = next; }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

function newScenario(projectId: string, name: string, position: number): WorkspaceScenario {
  return { id: crypto.randomUUID(), projectId, name, position, revision: 0, document: createScenarioDocument() };
}

function scenarioName(scenarios: readonly WorkspaceScenario[]) {
  const names = new Set(scenarios.map((scenario) => scenario.name));
  for (let index = 0; ; index++) {
    const name = `Plan ${index < 26 ? String.fromCharCode(65 + index) : index + 1}`;
    if (!names.has(name)) return name;
  }
}

type ProjectInputs = { presets: VehiclePreset[]; fleet: FleetVehicle[]; analysis: AnalysisSettings };

function serializeSnapshot(name: string, scene: SceneDocument, scenarios: readonly WorkspaceScenario[], activeScenarioId: string, inputs: ProjectInputs) {
  return JSON.stringify({
    name,
    scene,
    scenarios: scenarios.map(({ id, name: scenarioNameValue, document }) => ({ id, name: scenarioNameValue, document })),
    activeScenarioId,
    presets: inputs.presets,
    fleet: inputs.fleet,
    analysis: inputs.analysis,
  });
}

const mockInputs = (): ProjectInputs => ({ presets: createMockPresets(), fleet: createMockFleet(), analysis: createMockAnalysis() });

export function createProjectFields(name = "Untitled project", scene: SceneDocument = createDocument(), session = 0, inputs: ProjectInputs = mockInputs()): ProjectFields {
  const scenarios = [newScenario("", "Plan A", 0)];
  return {
    projectId: null,
    revision: 0,
    name,
    scenarios,
    activeScenarioId: scenarios[0].id,
    baseline: serializeSnapshot(name, scene, scenarios, scenarios[0].id, inputs),
    saveStatus: { state: "idle" },
    session,
  };
}

export const useProjectStore = create<ProjectState>((set, get) => {
  const scene = () => useSceneStore.getState();
  const presets = () => usePresetStore.getState();
  const fleet = () => useFleetStore.getState();
  const inputs = (): ProjectInputs => ({ presets: clone(presets().presets), fleet: clone(fleet().vehicles), analysis: { ...fleet().analysis } });

  const loadInputs = (document: ReturnType<typeof toM1ProjectDocument>) => {
    scene().loadDocument(document.scene);
    presets().replacePresets(document.vehiclePresets);
    fleet().updateAnalysis(document.analysis);
    fleet().replaceFleet(document.fleetVehicles);
  };

  const loadWorkspace = (record: WorkspaceRecord) => {
    const document = toM1ProjectDocument(record.project.document);
    const scenarios = clone(record.scenarios);
    if (!scenarios.length) throw new Error("A project needs at least one scenario.");
    const activeScenario = scenarios.find((scenario) => scenario.id === record.project.activeScenarioId) ?? scenarios[0];
    set({
      projectId: record.project.id,
      revision: record.project.revision,
      name: record.project.name,
      scenarios,
      activeScenarioId: activeScenario.id,
      baseline: serializeSnapshot(record.project.name, document.scene, scenarios, activeScenario.id, {
        presets: document.vehiclePresets,
        fleet: document.fleetVehicles,
        analysis: document.analysis,
      }),
      saveStatus: { state: "idle" },
      session: get().session + 1,
    });
    loadInputs(document);
  };

  return {
    ...createProjectFields("Untitled project", useSceneStore.getState().document, 0, {
      presets: usePresetStore.getState().presets,
      fleet: useFleetStore.getState().vehicles,
      analysis: useFleetStore.getState().analysis,
    }),

    newProject: (name) => {
      if (validateName(name)) return;
      const next = mockInputs();
      const nextScene = createDocument();
      set(createProjectFields(name.trim(), nextScene, get().session + 1, next));
      loadInputs(createProjectDocument(next.presets, next.fleet, next.analysis, nextScene));
    },

    openProject: async (id) => loadWorkspace(await repository.getWorkspace(id)),
    listProjects: () => repository.listProjects(),

    saveProject: async () => {
      const state = get();
      if (state.saveStatus.state === "saving") return;
      scene().commitEdit();
      presets().commitEdit();
      fleet().commitEdit();

      const capturedScene = clone(scene().document);
      const capturedInputs = inputs();
      const projectId = state.projectId ?? crypto.randomUUID();
      const base: WorkspaceSaveInput = {
        project: {
          id: projectId,
          name: state.name,
          activeScenarioId: state.activeScenarioId,
          document: createProjectDocument(capturedInputs.presets, capturedInputs.fleet, capturedInputs.analysis, capturedScene),
        },
        scenarios: state.scenarios.map((scenario) => ({
          id: scenario.id,
          name: scenario.name,
          expectedRevision: scenario.revision,
          document: clone(scenario.document),
        })),
      };
      const capturedBaseline = serializeSnapshot(state.name, capturedScene, state.scenarios, state.activeScenarioId, capturedInputs);
      const session = state.session;
      const preferredScenarioId = state.activeScenarioId;
      set({ saveStatus: { state: "saving" } });

      try {
        const record = state.projectId
          ? await repository.updateWorkspace({ ...base, project: { ...base.project, expectedRevision: state.revision } })
          : await repository.createWorkspace(base);
        if (get().session !== session) return;
        const activeScenario = record.scenarios.find((scenario) => scenario.id === record.project.activeScenarioId)
          ?? record.scenarios.find((scenario) => scenario.id === preferredScenarioId)
          ?? record.scenarios[0];
        if (!activeScenario) throw new Error("The saved project has no scenarios.");
        set({
          projectId: record.project.id,
          revision: record.project.revision,
          name: record.project.name,
          scenarios: clone(record.scenarios),
          activeScenarioId: activeScenario.id,
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
      const scenarios = get().scenarios;
      const scenario = newScenario(get().projectId ?? "", scenarioName(scenarios), scenarios.length);
      set({ scenarios: [...scenarios, scenario], activeScenarioId: scenario.id });
    },

    duplicateScenario: (id) => {
      const scenarios = get().scenarios;
      const index = scenarios.findIndex((scenario) => scenario.id === id);
      if (index < 0) return;
      const source = scenarios[index];
      const copy: WorkspaceScenario = {
        ...clone(source),
        document: cloneScenarioDocument(source.document),
        id: crypto.randomUUID(),
        projectId: get().projectId ?? "",
        revision: 0,
        name: `${source.name} copy`.slice(0, NAME_MAX_LENGTH),
        createdAt: undefined,
        updatedAt: undefined,
        position: index + 1,
      };
      const next = scenarios.toSpliced(index + 1, 0, copy).map((scenario, position) => ({ ...scenario, position }));
      set({ scenarios: next, activeScenarioId: copy.id });
    },

    renameScenario: (id, name) => {
      if (validateName(name)) return;
      set({ scenarios: get().scenarios.map((scenario) => scenario.id === id ? { ...scenario, name: name.trim() } : scenario) });
    },

    deleteScenario: (id) => {
      const scenarios = get().scenarios;
      const index = scenarios.findIndex((scenario) => scenario.id === id);
      if (index < 0 || scenarios.length <= 1) return;
      const remaining = scenarios.toSpliced(index, 1).map((scenario, position) => ({ ...scenario, position }));
      const activeScenarioId = get().activeScenarioId === id ? remaining[Math.min(index, remaining.length - 1)].id : get().activeScenarioId;
      set({ scenarios: remaining, activeScenarioId });
    },

    updateScenarioVehiclePlan: (scenarioId, vehicleId, patch) => {
      if (!fleet().vehicles.some((vehicle) => vehicle.id === vehicleId)) return;
      if (!isYearInPeriod(fleet().analysis, patch.transitionYear)) return;
      if (patch.targetPresetId !== undefined && !presets().presets.some((preset) => preset.id === patch.targetPresetId)) return;
      set({ scenarios: get().scenarios.map((scenario) => {
        if (scenario.id !== scenarioId) return scenario;
        const current = scenario.document.vehiclePlans[vehicleId] ?? {};
        return { ...scenario, document: { ...scenario.document, vehiclePlans: { ...scenario.document.vehiclePlans, [vehicleId]: { ...current, ...patch } } } };
      }) });
    },

    removeVehiclePlans: (vehicleId) => {
      set({ scenarios: get().scenarios.map((scenario) => scenario.document.vehiclePlans[vehicleId]
        ? { ...scenario, document: { ...scenario.document, vehiclePlans: withoutVehiclePlan(scenario.document.vehiclePlans, vehicleId) } }
        : scenario) });
    },

    exportProject: () => {
      scene().commitEdit();
      presets().commitEdit();
      fleet().commitEdit();
      const state = get();
      const captured = inputs();
      return createPortableProject({
        projectName: state.name,
        projectDocument: createProjectDocument(captured.presets, captured.fleet, captured.analysis, scene().document),
        scenarios: state.scenarios.map((scenario) => ({ name: scenario.name, document: clone(scenario.document) })),
        activeScenarioIndex: Math.max(0, state.scenarios.findIndex((scenario) => scenario.id === state.activeScenarioId)),
      });
    },

    importProject: async (file) => {
      const projectId = crypto.randomUUID();
      const scenarios = file.scenarios.map((scenario) => ({
        id: crypto.randomUUID(),
        name: scenario.name,
        expectedRevision: 0,
        document: clone(scenario.document),
      }));
      const activeScenarioId = scenarios[file.activeScenarioIndex]?.id;
      if (!activeScenarioId) throw new Error("The imported project has no active Scenario.");
      const record = await repository.createWorkspace({
        project: { id: projectId, name: file.project.name, activeScenarioId, document: clone(file.project.document) },
        scenarios,
      });
      loadWorkspace(record);
    },
  };
});

export function useProjectDirty() {
  const scene = useSceneStore((state) => state.document);
  const presets = usePresetStore((state) => state.presets);
  const fleet = useFleetStore((state) => state.vehicles);
  const analysis = useFleetStore((state) => state.analysis);
  const name = useProjectStore((state) => state.name);
  const scenarios = useProjectStore((state) => state.scenarios);
  const activeScenarioId = useProjectStore((state) => state.activeScenarioId);
  const baseline = useProjectStore((state) => state.baseline);
  return useMemo(() => serializeSnapshot(name, scene, scenarios, activeScenarioId, { presets, fleet, analysis }) !== baseline,
    [name, scene, scenarios, activeScenarioId, presets, fleet, analysis, baseline]);
}
