import { create } from "zustand";

import type { AnalysisSettings, FleetVehicle } from "../domain/contracts";
import { isYearInPeriod } from "../domain/fleet";
import { createMockAnalysis, createMockFleet, createMockPresets } from "../domain/mockProject";
import { copyProjectV5, normalizeProjectV5, type ProjectDocumentV5 } from "../domain/projectV5";
import { legacyProjectView, mergeLegacyProjectData, projectV5FromLegacy } from "../domain/projectV5Compatibility";
import { createScenarioDocument } from "../domain/scenario";
import { createPortableProject, type PortableProjectFile } from "../project/portableProject";
import type { ProjectRepository } from "../project/repository";
import { getProjectRepository, setProjectRepositoryInstance } from "../project/repositoryContext";
import { validateName, NAME_MAX_LENGTH, type ScenarioVehiclePlan, type WorkspaceScenario } from "../project/types";
import type { SceneDocument } from "../scene/types";
import type { VehiclePreset } from "../vehicles/types";
import { useFleetStore } from "./fleetStore";
import { usePresetStore } from "./presetStore";
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
} from "./projectRuntime";
import { createDocument, useSceneStore } from "./sceneStore";
import { useTimelineStore } from "./timelineStore";
import { useAppStore } from "./appStore";

type ProjectInputs = { presets: VehiclePreset[]; fleet: FleetVehicle[]; analysis: AnalysisSettings };

export type ProjectFields = {
  runtime: ProjectRuntime;
  /** Compatibility views retained until tickets 4-7 migrate their consumers. */
  projectId: string | null;
  revision: number;
  name: string;
  scenarios: WorkspaceScenario[];
  activeScenarioId: string;
  baseline: string;
  session: number;
};

export type ProjectState = ProjectFields & {
  newProject: (name: string) => void;
  openProject: (id: string) => Promise<void>;
  saveProject: () => Promise<void>;
  renameProject: (name: string) => void;
  selectScenario: (id: string) => void;
  createScenario: () => void;
  duplicateScenario: (id: string) => void;
  renameScenario: (id: string, name: string) => void;
  deleteScenario: (id: string) => void;
  updateScenarioVehiclePlan: (scenarioId: string, vehicleId: string, patch: Partial<ScenarioVehiclePlan>) => void;
  removeVehiclePlans: (vehicleId: string) => void;
  deleteVehicle: (vehicleId: string) => void;
  exportProject: () => PortableProjectFile;
  importProject: (file: PortableProjectFile) => Promise<void>;
  executeCommand: (command: ProjectCommand) => void;
  beginEdit: () => void;
  previewCommand: (command: ProjectCommand) => void;
  commitEdit: () => void;
  cancelEdit: () => void;
  undo: () => void;
  redo: () => void;
  updateEditor: (patch: Partial<ProjectEditorState>) => void;
};

const mockInputs = (): ProjectInputs => ({ presets: createMockPresets(), fleet: createMockFleet(), analysis: createMockAnalysis() });

let compatibilityProjectionWriteDepth = 0;

function updateCompatibilityProjections(update: () => void): void {
  compatibilityProjectionWriteDepth += 1;
  try {
    update();
  } finally {
    compatibilityProjectionWriteDepth -= 1;
  }
}

function commitCompatibilityEdits(): void {
  useSceneStore.getState().commitEdit();
  usePresetStore.getState().commitEdit();
  useFleetStore.getState().commitEdit();
}

export function setProjectRepository(next: ProjectRepository) {
  setProjectRepositoryInstance(next);
  useAppStore.getState().resetRepositoryState();
}

function newScenario(projectId: string, name: string, position: number): WorkspaceScenario {
  return { id: crypto.randomUUID(), projectId, name, position, revision: 0, document: createScenarioDocument() };
}

function scenarioName(scenarios: readonly WorkspaceScenario[]) {
  const names = new Set(scenarios.map((scenario) => scenario.name));
  for (let index = 0; ; index += 1) {
    const candidate = `Plan ${index < 26 ? String.fromCharCode(65 + index) : index + 1}`;
    if (!names.has(candidate)) return candidate;
  }
}

function projectFields(runtime: ProjectRuntime, session: number): ProjectFields {
  const revision = runtime.record?.revision ?? 0;
  const legacy = legacyProjectView(runtime.document, revision);
  return {
    runtime,
    projectId: runtime.record ? runtime.document.id : null,
    revision,
    name: runtime.document.name,
    scenarios: legacy.scenarios,
    activeScenarioId: runtime.document.activeScenarioId,
    baseline: JSON.stringify(runtime.savedDocument),
    session,
  };
}

export function createProjectFields(
  name = "Untitled project",
  scene: SceneDocument = createDocument(),
  session = 0,
  inputs: ProjectInputs = mockInputs(),
): ProjectFields {
  const id = crypto.randomUUID();
  const scenarios = [newScenario(id, "Plan A", 0)];
  const document = projectV5FromLegacy({
    id,
    name,
    scene,
    presets: inputs.presets,
    fleet: inputs.fleet,
    analysis: inputs.analysis,
    scenarios,
    activeScenarioId: scenarios[0].id,
  });
  return projectFields(createProjectRuntime(document), session);
}

function documentFromCompatibilityProjections(runtime: ProjectRuntime): ProjectDocumentV5 {
  const scene = useSceneStore.getState();
  const presets = usePresetStore.getState();
  const fleet = useFleetStore.getState();
  return mergeLegacyProjectData(runtime.document, {
    scene: scene.document,
    presets: presets.presets,
    fleet: fleet.vehicles,
    analysis: fleet.analysis,
  });
}

function validDocumentFromCompatibilityProjections(runtime: ProjectRuntime): ProjectDocumentV5 | undefined {
  try {
    return documentFromCompatibilityProjections(runtime);
  } catch {
    return undefined;
  }
}

function loadCompatibilityViews(document: ProjectDocumentV5, revision: number): void {
  const legacy = legacyProjectView(document, revision);
  updateCompatibilityProjections(() => {
    useSceneStore.getState().loadDocument(legacy.scene);
    usePresetStore.getState().replacePresets(legacy.presets);
    useFleetStore.getState().updateAnalysis(legacy.analysis);
    useFleetStore.getState().replaceFleet(legacy.fleet);
    useTimelineStore.getState().setSelectedYear(document.analysis.startYear);
  });
}

function syncChangedCompatibilityViews(previous: ProjectDocumentV5, next: ProjectDocumentV5, revision: number): void {
  const before = legacyProjectView(previous, revision);
  const after = legacyProjectView(next, revision);
  updateCompatibilityProjections(() => {
    if (JSON.stringify(before.scene) !== JSON.stringify(after.scene)) useSceneStore.getState().loadDocument(after.scene);
    if (JSON.stringify(before.presets) !== JSON.stringify(after.presets)) usePresetStore.getState().replacePresets(after.presets);
    if (JSON.stringify(before.analysis) !== JSON.stringify(after.analysis)) useFleetStore.getState().updateAnalysis(after.analysis);
    if (JSON.stringify(before.fleet) !== JSON.stringify(after.fleet)) useFleetStore.getState().replaceFleet(after.fleet);
    if (before.analysis.startYear !== after.analysis.startYear || before.analysis.yearCount !== after.analysis.yearCount) {
      useTimelineStore.getState().setSelectedYear(next.analysis.startYear);
    }
  });
}

export const useProjectStore = create<ProjectState>((set, get) => {
  const initial = createProjectFields("Untitled project", useSceneStore.getState().document, 0, {
    presets: usePresetStore.getState().presets,
    fleet: useFleetStore.getState().vehicles,
    analysis: useFleetStore.getState().analysis,
  });

  const setRuntime = (runtime: ProjectRuntime, session = get().session) => set(projectFields(runtime, session));
  const applyRuntime = (runtime: ProjectRuntime) => {
    const previous = get().runtime.document;
    setRuntime(runtime);
    syncChangedCompatibilityViews(previous, runtime.document, runtime.record?.revision ?? 0);
  };
  const loadRecord = (record: Awaited<ReturnType<ProjectRepository["getProject"]>>) => {
    const metadata = { revision: record.revision, createdAt: record.createdAt, updatedAt: record.updatedAt };
    const runtime = replaceOpenProject(get().runtime, record.document, metadata);
    setRuntime(runtime, get().session + 1);
    loadCompatibilityViews(runtime.document, metadata.revision);
    useAppStore.getState().setRepositoryStatus({ state: "idle" });
    useAppStore.getState().setSaveStatus({ state: "idle" });
  };
  return {
    ...initial,

    newProject: (name) => {
      if (validateName(name)) return;
      const scene = createDocument();
      const inputs = mockInputs();
      const fields = createProjectFields(name.trim(), scene, get().session + 1, inputs);
      set(fields);
      loadCompatibilityViews(fields.runtime.document, 0);
      useAppStore.getState().setRepositoryStatus({ state: "idle" });
      useAppStore.getState().setSaveStatus({ state: "idle" });
    },

    openProject: async (id) => {
      useAppStore.getState().setRepositoryStatus({ state: "loading" });
      try {
        loadRecord(await getProjectRepository().getProject(id));
      } catch (error) {
        useAppStore.getState().setRepositoryStatus({ state: "error", message: error instanceof Error ? error.message : "The project could not be opened." });
        throw error;
      }
    },

    saveProject: async () => {
      if (useAppStore.getState().saveStatus.state === "saving") return;
      commitCompatibilityEdits();
      const capturedRuntime = commitProjectEdit(get().runtime);
      setRuntime(capturedRuntime);
      const capturedDocument = copyProjectV5(capturedRuntime.document);
      const capturedSession = get().session;
      useAppStore.getState().setSaveStatus({ state: "saving" });
      try {
        const record = capturedRuntime.record
          ? await getProjectRepository().updateProject(capturedDocument, capturedRuntime.record.revision)
          : await getProjectRepository().createProject(capturedDocument);
        if (get().session !== capturedSession) return;
        const metadata = { revision: record.revision, createdAt: record.createdAt, updatedAt: record.updatedAt };
        setRuntime(markProjectSaved(get().runtime, metadata, capturedDocument));
        useAppStore.getState().setSaveStatus({ state: "idle" });
      } catch (error) {
        if (get().session !== capturedSession) return;
        useAppStore.getState().setSaveStatus({ state: "error", message: error instanceof Error ? error.message : "The project could not be saved." });
      }
    },

    renameProject: (name) => {
      if (!validateName(name)) applyRuntime(executeProjectCommand(get().runtime, { type: "rename-project", name: name.trim() }));
    },
    selectScenario: (id) => {
      if (get().runtime.document.scenarios.some((scenario) => scenario.id === id)) {
        applyRuntime(executeProjectCommand(get().runtime, { type: "set-active-scenario", scenarioId: id }));
      }
    },
    createScenario: () => {
      const scenarios = get().scenarios;
      applyRuntime(executeProjectCommand(get().runtime, {
        type: "create-scenario",
        scenario: { id: crypto.randomUUID(), name: scenarioName(scenarios) },
      }));
    },
    duplicateScenario: (id) => {
      const source = get().runtime.document.scenarios.find((scenario) => scenario.id === id);
      if (!source) return;
      const copyId = crypto.randomUUID();
      applyRuntime(executeProjectCommand(get().runtime, {
        type: "duplicate-scenario",
        sourceScenarioId: id,
        scenario: { id: copyId, name: `${source.name} copy`.slice(0, NAME_MAX_LENGTH) },
      }));
    },
    renameScenario: (id, name) => {
      if (!validateName(name)) applyRuntime(executeProjectCommand(get().runtime, { type: "rename-scenario", scenarioId: id, name: name.trim() }));
    },
    deleteScenario: (id) => applyRuntime(executeProjectCommand(get().runtime, { type: "delete-scenario", scenarioId: id })),
    updateScenarioVehiclePlan: (scenarioId, vehicleId, patch) => {
      if (!get().runtime.document.environment.vehicles.some((vehicle) => vehicle.id === vehicleId)) return;
      if (!isYearInPeriod(useFleetStore.getState().analysis, patch.transitionYear)) return;
      if (patch.targetPresetId !== undefined && patch.targetPresetId !== ""
        && !get().runtime.document.vehiclePresets.some((preset) => preset.id === patch.targetPresetId)) return;
      const persisted = get().runtime.document.scenarios.find((scenario) => scenario.id === scenarioId)?.vehiclePlans[vehicleId]?.transitions[0];
      const draft = get().scenarios.find((scenario) => scenario.id === scenarioId)?.document.vehiclePlans[vehicleId];
      const year = Object.hasOwn(patch, "transitionYear") ? patch.transitionYear : draft?.transitionYear;
      const targetPresetId = Object.hasOwn(patch, "targetPresetId") ? patch.targetPresetId : draft?.targetPresetId;
      const nextDraft = { ...draft, ...patch };
      if (year !== null && year !== undefined && targetPresetId) {
        applyRuntime(executeProjectCommand(get().runtime, {
          type: "replace-vehicle-transitions",
          scenarioId,
          vehicleId,
          transitions: [{ year, targetPresetId }],
        }));
      } else {
        if (persisted) applyRuntime(executeProjectCommand(get().runtime, { type: "replace-vehicle-transitions", scenarioId, vehicleId, transitions: [] }));
        set({ scenarios: get().scenarios.map((scenario) => {
          if (scenario.id !== scenarioId) return scenario;
          return {
            ...scenario,
            document: {
              ...scenario.document,
              vehiclePlans: { ...scenario.document.vehiclePlans, [vehicleId]: nextDraft },
            },
          };
        }) });
      }
    },
    removeVehiclePlans: (vehicleId) => applyRuntime(executeProjectCommand(get().runtime, { type: "clear-vehicle-plans", vehicleId })),
    deleteVehicle: (vehicleId) => applyRuntime(executeProjectCommand(get().runtime, { type: "delete-vehicle", vehicleId })),

    exportProject: () => {
      commitCompatibilityEdits();
      return createPortableProject(get().runtime.document);
    },
    importProject: async (file) => {
      const document = normalizeProjectV5({ ...file.document, id: crypto.randomUUID() });
      useAppStore.getState().setRepositoryStatus({ state: "loading" });
      try {
        loadRecord(await getProjectRepository().createProject(document));
      } catch (error) {
        useAppStore.getState().setRepositoryStatus({ state: "error", message: error instanceof Error ? error.message : "The project could not be imported." });
        throw error;
      }
    },

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

function applyCompatibilityCommand(command: ProjectCommand, preview: boolean): void {
  const state = useProjectStore.getState();
  try {
    const runtime = preview
      ? previewProjectCommand(state.runtime, command)
      : executeProjectCommand(state.runtime, command);
    useProjectStore.setState(projectFields(runtime, state.session));
  } catch {
    loadCompatibilityViews(state.runtime.document, state.runtime.record?.revision ?? 0);
  }
}

useFleetStore.subscribe((current, previous) => {
  if (compatibilityProjectionWriteDepth) return;
  const project = useProjectStore.getState();
  const beganEdit = previous.baseline === null && current.baseline !== null;
  const endedEdit = previous.baseline !== null && current.baseline === null;
  if (beganEdit) project.beginEdit();
  if (endedEdit && current.vehicles === previous.baseline) {
    project.cancelEdit();
    return;
  }
  if (current.vehicles !== previous.vehicles || current.analysis !== previous.analysis) {
    const merged = validDocumentFromCompatibilityProjections(project.runtime);
    if (merged) {
      applyCompatibilityCommand({
        type: "replace-fleet-data",
        vehicles: merged.environment.vehicles,
        analysis: merged.analysis,
      }, current.baseline !== null);
    }
  }
  if (endedEdit) useProjectStore.getState().commitEdit();
});

usePresetStore.subscribe((current, previous) => {
  if (compatibilityProjectionWriteDepth) return;
  const project = useProjectStore.getState();
  const beganEdit = previous.baseline === null && current.baseline !== null;
  const endedEdit = previous.baseline !== null && current.baseline === null;
  if (beganEdit) project.beginEdit();
  if (endedEdit && current.presets === previous.baseline) {
    project.cancelEdit();
    return;
  }
  if (current.presets !== previous.presets) {
    const merged = validDocumentFromCompatibilityProjections(project.runtime);
    if (merged) applyCompatibilityCommand({ type: "replace-vehicle-presets", presets: merged.vehiclePresets }, current.baseline !== null);
  }
  if (endedEdit) useProjectStore.getState().commitEdit();
});

useSceneStore.subscribe((current, previous) => {
  if (compatibilityProjectionWriteDepth) return;
  const project = useProjectStore.getState();
  const previousBaseline = previous.history.baseline;
  const beganEdit = previousBaseline === null && current.history.baseline !== null;
  const endedEdit = previousBaseline !== null && current.history.baseline === null;
  if (beganEdit) project.beginEdit();
  if (endedEdit && current.document === previousBaseline) {
    project.cancelEdit();
    return;
  }
  if (current.document !== previous.document) {
    const merged = validDocumentFromCompatibilityProjections(project.runtime);
    if (merged) applyCompatibilityCommand({ type: "set-depot-transform", transform: merged.environment.depot.transform }, current.history.baseline !== null);
  }
  if (endedEdit) useProjectStore.getState().commitEdit();
  if (current.editor !== previous.editor) {
    const runtime = useProjectStore.getState().runtime;
    const selectedId = current.editor.selectedObjectId;
    const selection = selectedId === runtime.document.environment.depot.id
      ? { kind: "depot" as const, id: selectedId }
      : runtime.document.environment.vehicles.some((vehicle) => vehicle.id === selectedId)
        ? { kind: "vehicle" as const, id: selectedId! }
        : null;
    useProjectStore.getState().updateEditor({
      selection,
      interactionMode: current.editor.interactionMode,
      transformMode: current.editor.transformMode,
      transformSpace: current.editor.transformSpace,
      snapEnabled: current.editor.snapEnabled,
    });
  }
});

useTimelineStore.subscribe((current, previous) => {
  if (!compatibilityProjectionWriteDepth && current.selectedYear !== previous.selectedYear) {
    useProjectStore.getState().updateEditor({ selectedYear: current.selectedYear });
  }
});

export function useProjectDirty() {
  const runtime = useProjectStore((state) => state.runtime);
  return isProjectDirty(runtime);
}
