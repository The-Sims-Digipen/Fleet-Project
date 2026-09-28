import { create } from "zustand";

import { DEFAULT_VEHICLE_SPAWN_TRANSFORMS, PROJECT_FLEET_CAPACITY } from "../domain/depotLayout";
import { createMockPresets } from "../domain/mockProject";
import {
  copyProject,
  createProject,
  type ProjectAnalysisSettings,
  type ProjectDocument,
  type ProjectScenario,
  type ProjectVehicle,
  type VehicleTransition,
} from "../domain/project";
import { createPortableProject, type PortableProjectFile } from "../project/portableProject";
import type { ProjectRepository } from "../project/repository";
import { getProjectRepository, setProjectRepositoryInstance } from "../project/repositoryContext";
import { NAME_MAX_LENGTH, validateName } from "../project/types";
import type { Transform } from "../scene/types";
import type { VehiclePreset } from "../vehicles/types";
import { useAppStore } from "./appStore";
import {
  beginProjectEdit,
  cancelProjectEdit,
  commitProjectEdit,
  createProjectRuntime,
  executeProjectCommand,
  isProjectDirty,
  markProjectSaved,
  previewProjectCommand,
  redoProjectCommand,
  replaceOpenProject,
  undoProjectCommand,
  updateProjectEditor,
  type ProjectCommand,
  type ProjectEditorState,
  type ProjectRuntime,
  type WorldObjectReference,
} from "./projectRuntime";

export type ProjectStateFields = {
  runtime: ProjectRuntime;
  /** Changes whenever a different project replaces the workspace. */
  session: number;
};

export type ProjectState = ProjectStateFields & {
  newProject: (name: string) => void;
  openProject: (id: string) => Promise<void>;
  saveProject: () => Promise<void>;
  exportProject: () => PortableProjectFile;
  importProject: (file: PortableProjectFile) => Promise<void>;

  renameProject: (name: string) => void;
  selectScenario: (id: string) => void;
  createScenario: () => void;
  duplicateScenario: (id: string) => void;
  renameScenario: (id: string, name: string) => void;
  deleteScenario: (id: string) => void;
  replaceVehicleTransitions: (scenarioId: string, vehicleId: string, transitions: VehicleTransition[]) => void;

  createVehicle: () => string | null;
  duplicateVehicle: (id: string) => string | null;
  updateVehicle: (id: string, patch: Partial<ProjectVehicle>) => void;
  deleteVehicle: (id: string) => void;

  selectPreset: (id: string | null) => void;
  createPreset: () => string;
  duplicatePreset: (id: string) => string | null;
  updatePreset: (id: string, patch: Partial<VehiclePreset>) => void;
  deletePreset: (id: string) => boolean;
  updateAnalysis: (patch: Partial<ProjectAnalysisSettings>) => void;

  setSelectedYear: (year: number) => void;
  resetSelectedYear: () => void;
  selectObject: (selection: WorldObjectReference | null) => void;
  setInteractionMode: (mode: ProjectEditorState["interactionMode"]) => void;
  setTransformMode: (mode: ProjectEditorState["transformMode"]) => void;
  setTransformSpace: (space: ProjectEditorState["transformSpace"]) => void;
  setSnapEnabled: (enabled: boolean) => void;
  setLightIntensity: (intensity: number) => void;
  updateObjectTransform: (reference: WorldObjectReference, transform: Transform) => void;

  executeCommand: (command: ProjectCommand) => void;
  beginEdit: () => void;
  previewCommand: (command: ProjectCommand) => void;
  commitEdit: () => void;
  cancelEdit: () => void;
  undo: () => void;
  redo: () => void;
  updateEditor: (patch: Partial<ProjectEditorState>) => void;
};

function initialProject(name: string): ProjectDocument {
  return createProject({ id: crypto.randomUUID(), name, vehiclePresets: createMockPresets() });
}

export function createProjectState(document: ProjectDocument = initialProject("Untitled project"), session = 0): ProjectStateFields {
  return { runtime: createProjectRuntime(document), session };
}

export function setProjectRepository(next: ProjectRepository): void {
  setProjectRepositoryInstance(next);
  useAppStore.getState().resetRepositoryState();
}

function nextScenarioName(scenarios: readonly ProjectScenario[]): string {
  const names = new Set(scenarios.map((scenario) => scenario.name));
  for (let index = 0; ; index += 1) {
    const candidate = `Plan ${index < 26 ? String.fromCharCode(65 + index) : index + 1}`;
    if (!names.has(candidate)) return candidate;
  }
}

function nextEntityName(prefix: string, names: readonly string[]): string {
  const used = new Set(names);
  for (let index = 1; ; index += 1) {
    const candidate = `${prefix} ${index}`;
    if (!used.has(candidate)) return candidate;
  }
}

function transformsEqual(left: Transform, right: Transform): boolean {
  return left.position.every((value, index) => value === right.position[index])
    && left.rotation.every((value, index) => value === right.rotation[index])
    && left.scale.every((value, index) => value === right.scale[index]);
}

function nextSpawnTransform(vehicles: readonly ProjectVehicle[]): Transform | undefined {
  const transform = DEFAULT_VEHICLE_SPAWN_TRANSFORMS.find((candidate) => !vehicles.some((vehicle) => transformsEqual(vehicle.transform, candidate)));
  return transform ? structuredClone(transform) : undefined;
}

function newVehicle(document: ProjectDocument, transform: Transform): ProjectVehicle {
  return {
    id: crypto.randomUUID(),
    name: nextEntityName("Vehicle", document.environment.vehicles.map((vehicle) => vehicle.name)),
    baselinePresetId: document.vehiclePresets[0]?.id ?? null,
    transform,
    annualKm: 0,
    typicalDailyKm: 0,
    operatingDays: 250,
    utilisation: 1,
    routePattern: "predictable",
    returnsToDepot: true,
    depotDwellHours: 12,
    externalChargingAccess: false,
    replacementYear: null,
    currentHolding: { kind: "owned", currentValue: 0, endResidualValue: 0 },
  };
}

function newPreset(document: ProjectDocument): VehiclePreset {
  return {
    id: crypto.randomUUID(),
    name: nextEntityName("Vehicle preset", document.vehiclePresets.map((preset) => preset.name)),
    category: "Van",
    propulsion: "electric",
    modelId: "van",
    litresPer100Km: 0,
    kWhPer100Km: 0,
    batteryCapacityKWh: 0,
    chargingPowerKW: 0,
    purchaseCost: 0,
    maintenanceCostPerYear: 0,
    rangeKm: null,
    chargingEfficiency: 1,
    acquisition: { kind: "owned", endResidualValue: 0 },
  };
}

function presetIsReferenced(document: ProjectDocument, presetId: string): boolean {
  return document.environment.vehicles.some((vehicle) => vehicle.baselinePresetId === presetId)
    || document.scenarios.some((scenario) => Object.values(scenario.vehiclePlans).some((plan) =>
      plan.transitions.some((transition) => transition.targetPresetId === presetId)));
}

export const useProjectStore = create<ProjectState>((set, get) => {
  const setRuntime = (runtime: ProjectRuntime, session = get().session) => set({ runtime, session });
  const applyRuntime = (runtime: ProjectRuntime) => setRuntime(runtime);
  const applyCommand = (command: ProjectCommand) => {
    const runtime = get().runtime;
    applyRuntime(runtime.history.activeEdit ? previewProjectCommand(runtime, command) : executeProjectCommand(runtime, command));
  };
  const safelyApply = (command: ProjectCommand) => {
    try { applyCommand(command); } catch { /* Inputs may be temporarily invalid while a field is being edited. */ }
  };
  const loadRecord = (record: Awaited<ReturnType<ProjectRepository["getProject"]>>) => {
    const metadata = { revision: record.revision, createdAt: record.createdAt, updatedAt: record.updatedAt };
    setRuntime(replaceOpenProject(get().runtime, record.document, metadata), get().session + 1);
    useAppStore.getState().setRepositoryStatus({ state: "idle" });
    useAppStore.getState().setSaveStatus({ state: "idle" });
  };

  return {
    ...createProjectState(),

    newProject: (name) => {
      if (validateName(name)) return;
      set(createProjectState(initialProject(name.trim()), get().session + 1));
      useAppStore.getState().setRepositoryStatus({ state: "idle" });
      useAppStore.getState().setSaveStatus({ state: "idle" });
    },
    openProject: async (id) => {
      useAppStore.getState().setRepositoryStatus({ state: "loading" });
      try { loadRecord(await getProjectRepository().getProject(id)); }
      catch (error) {
        useAppStore.getState().setRepositoryStatus({ state: "error", message: error instanceof Error ? error.message : "The project could not be opened." });
        throw error;
      }
    },
    saveProject: async () => {
      if (useAppStore.getState().saveStatus.state === "saving") return;
      const capturedRuntime = commitProjectEdit(get().runtime);
      setRuntime(capturedRuntime);
      const capturedDocument = copyProject(capturedRuntime.document);
      const capturedSession = get().session;
      useAppStore.getState().setSaveStatus({ state: "saving" });
      try {
        const record = capturedRuntime.record
          ? await getProjectRepository().updateProject(capturedDocument, capturedRuntime.record.revision)
          : await getProjectRepository().createProject(capturedDocument);
        if (get().session !== capturedSession) return;
        setRuntime(markProjectSaved(get().runtime, {
          revision: record.revision,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        }, capturedDocument));
        useAppStore.getState().setSaveStatus({ state: "idle" });
      } catch (error) {
        if (get().session !== capturedSession) return;
        useAppStore.getState().setSaveStatus({ state: "error", message: error instanceof Error ? error.message : "The project could not be saved." });
      }
    },
    exportProject: () => {
      const runtime = commitProjectEdit(get().runtime);
      setRuntime(runtime);
      return createPortableProject(runtime.document);
    },
    importProject: async (file) => {
      const source = file.document;
      const document = createProject({
        id: crypto.randomUUID(),
        name: source.name,
        depot: source.environment.depot,
        vehicles: source.environment.vehicles,
        vehiclePresets: source.vehiclePresets,
        scenarios: source.scenarios,
        activeScenarioId: source.activeScenarioId,
        analysis: source.analysis,
      });
      useAppStore.getState().setRepositoryStatus({ state: "loading" });
      try { loadRecord(await getProjectRepository().createProject(document)); }
      catch (error) {
        useAppStore.getState().setRepositoryStatus({ state: "error", message: error instanceof Error ? error.message : "The project could not be imported." });
        throw error;
      }
    },

    renameProject: (name) => { if (!validateName(name)) safelyApply({ type: "rename-project", name: name.trim() }); },
    selectScenario: (id) => {
      if (get().runtime.document.scenarios.some((scenario) => scenario.id === id)) safelyApply({ type: "set-active-scenario", scenarioId: id });
    },
    createScenario: () => safelyApply({
      type: "create-scenario",
      scenario: { id: crypto.randomUUID(), name: nextScenarioName(get().runtime.document.scenarios) },
    }),
    duplicateScenario: (id) => {
      const source = get().runtime.document.scenarios.find((scenario) => scenario.id === id);
      if (source) safelyApply({
        type: "duplicate-scenario",
        sourceScenarioId: id,
        scenario: { id: crypto.randomUUID(), name: `${source.name} copy`.slice(0, NAME_MAX_LENGTH) },
      });
    },
    renameScenario: (id, name) => { if (!validateName(name)) safelyApply({ type: "rename-scenario", scenarioId: id, name: name.trim() }); },
    deleteScenario: (id) => safelyApply({ type: "delete-scenario", scenarioId: id }),
    replaceVehicleTransitions: (scenarioId, vehicleId, transitions) => safelyApply({ type: "replace-vehicle-transitions", scenarioId, vehicleId, transitions }),

    createVehicle: () => {
      const document = get().runtime.document;
      if (document.environment.vehicles.length >= PROJECT_FLEET_CAPACITY) return null;
      const transform = nextSpawnTransform(document.environment.vehicles);
      if (!transform) return null;
      const vehicle = newVehicle(document, transform);
      safelyApply({ type: "create-vehicle", vehicle });
      return vehicle.id;
    },
    duplicateVehicle: (id) => {
      const document = get().runtime.document;
      const source = document.environment.vehicles.find((vehicle) => vehicle.id === id);
      const transform = nextSpawnTransform(document.environment.vehicles);
      if (!source || !transform || document.environment.vehicles.length >= PROJECT_FLEET_CAPACITY) return null;
      const vehicle = { ...structuredClone(source), id: crypto.randomUUID(), name: `${source.name} copy`.slice(0, NAME_MAX_LENGTH), transform };
      safelyApply({ type: "create-vehicle", vehicle });
      return vehicle.id;
    },
    updateVehicle: (id, patch) => safelyApply({ type: "update-vehicle", vehicleId: id, patch }),
    deleteVehicle: (id) => safelyApply({ type: "delete-vehicle", vehicleId: id }),

    selectPreset: (id) => get().updateEditor({ selectedPresetId: id }),
    createPreset: () => {
      const preset = newPreset(get().runtime.document);
      safelyApply({ type: "create-vehicle-preset", preset });
      get().updateEditor({ selectedPresetId: preset.id });
      return preset.id;
    },
    duplicatePreset: (id) => {
      const source = get().runtime.document.vehiclePresets.find((preset) => preset.id === id);
      if (!source) return null;
      const preset = { ...structuredClone(source), id: crypto.randomUUID(), name: `${source.name} copy`.slice(0, NAME_MAX_LENGTH) };
      safelyApply({ type: "create-vehicle-preset", preset });
      get().updateEditor({ selectedPresetId: preset.id });
      return preset.id;
    },
    updatePreset: (id, patch) => safelyApply({ type: "update-vehicle-preset", presetId: id, patch }),
    deletePreset: (id) => {
      if (presetIsReferenced(get().runtime.document, id)) return false;
      safelyApply({ type: "delete-vehicle-preset", presetId: id });
      return true;
    },
    updateAnalysis: (patch) => safelyApply({ type: "update-analysis", patch }),

    setSelectedYear: (year) => get().updateEditor({ selectedYear: year }),
    resetSelectedYear: () => get().updateEditor({ selectedYear: get().runtime.document.analysis.startYear }),
    selectObject: (selection) => get().updateEditor({ selection }),
    setInteractionMode: (interactionMode) => get().updateEditor({ interactionMode }),
    setTransformMode: (transformMode) => get().updateEditor({ transformMode }),
    setTransformSpace: (transformSpace) => get().updateEditor({ transformSpace }),
    setSnapEnabled: (snapEnabled) => get().updateEditor({ snapEnabled }),
    setLightIntensity: (lightIntensity) => get().updateEditor({ lightIntensity: Math.max(0, Math.min(100, lightIntensity)) }),
    updateObjectTransform: (reference, transform) => safelyApply(reference.kind === "depot"
      ? { type: "set-depot-transform", transform }
      : { type: "set-vehicle-transform", vehicleId: reference.id, transform }),

    executeCommand: (command) => applyRuntime(executeProjectCommand(get().runtime, command)),
    beginEdit: () => setRuntime(beginProjectEdit(get().runtime)),
    previewCommand: (command) => applyRuntime(previewProjectCommand(get().runtime, command)),
    commitEdit: () => setRuntime(commitProjectEdit(get().runtime)),
    cancelEdit: () => applyRuntime(cancelProjectEdit(get().runtime)),
    undo: () => applyRuntime(undoProjectCommand(get().runtime)),
    redo: () => applyRuntime(redoProjectCommand(get().runtime)),
    updateEditor: (patch) => setRuntime(updateProjectEditor(get().runtime, patch)),
  };
});

export function useProjectDirty(): boolean {
  return useProjectStore((state) => isProjectDirty(state.runtime));
}
