import {
  addVehicleTransition,
  copyProject,
  deleteVehiclePreset,
  normalizeProject,
  removeVehicleTransition,
  replaceVehicleTransitions,
  updateVehicleTransition,
  type ProjectDocument,
  type ProjectAnalysisSettings,
  type ProjectVehicle,
  type VehicleTransition,
} from "../domain/project";
import type { Transform } from "../scene/types";
import type { WorldObjectReference } from "../scene/projectWorld";
import type { VehiclePreset } from "../vehicles/types";

export type { WorldObjectReference };

export type ProjectRecordMetadata = {
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectCamera = {
  position: [number, number, number];
  target: [number, number, number];
};

export const DEFAULT_PROJECT_CAMERA: ProjectCamera = {
  position: [8, 7, 9],
  target: [0, 0, 0],
};

export type ProjectEditorState = {
  selection: WorldObjectReference | null;
  hover: WorldObjectReference | null;
  selectedYear: number;
  selectedPresetId: string | null;
  lightIntensity: number;
  interactionMode: "inspect" | "gizmo";
  transformMode: "translate" | "rotate" | "scale";
  transformSpace: "world" | "local";
  snapEnabled: boolean;
  camera: ProjectCamera;
  cameraRevision: number;
};

export type ProjectHistory = {
  past: ProjectDocument[];
  future: ProjectDocument[];
  activeEdit: ProjectDocument | null;
};

export type ProjectRuntime = {
  document: ProjectDocument;
  record: ProjectRecordMetadata | null;
  savedDocument: ProjectDocument;
  editor: ProjectEditorState;
  editorEdit: ProjectEditorState | null;
  history: ProjectHistory;
};

export type ProjectCommand =
  | { type: "rename-project"; name: string }
  | { type: "set-active-scenario"; scenarioId: string }
  | { type: "create-scenario"; scenario: { id: string; name: string } }
  | { type: "duplicate-scenario"; sourceScenarioId: string; scenario: { id: string; name: string } }
  | { type: "rename-scenario"; scenarioId: string; name: string }
  | { type: "delete-scenario"; scenarioId: string }
  | { type: "clear-vehicle-plans"; vehicleId: string }
  | { type: "create-vehicle"; vehicle: ProjectVehicle }
  | { type: "update-vehicle"; vehicleId: string; patch: Partial<ProjectVehicle> }
  | { type: "delete-vehicle"; vehicleId: string }
  | { type: "create-vehicle-preset"; preset: VehiclePreset }
  | { type: "update-vehicle-preset"; presetId: string; patch: Partial<VehiclePreset> }
  | { type: "delete-vehicle-preset"; presetId: string }
  | { type: "update-analysis"; patch: Partial<ProjectAnalysisSettings> }
  | { type: "set-depot-transform"; transform: Transform }
  | { type: "set-vehicle-transform"; vehicleId: string; transform: Transform }
  | { type: "add-vehicle-transition"; scenarioId: string; vehicleId: string; transition: VehicleTransition }
  | { type: "update-vehicle-transition"; scenarioId: string; vehicleId: string; currentYear: number; transition: VehicleTransition }
  | { type: "remove-vehicle-transition"; scenarioId: string; vehicleId: string; year: number }
  | { type: "replace-vehicle-transitions"; scenarioId: string; vehicleId: string; transitions: VehicleTransition[] };

const projectDocumentsEqual = (left: ProjectDocument, right: ProjectDocument) => JSON.stringify(left) === JSON.stringify(right);
const appendHistorySnapshot = (documents: ProjectDocument[], document: ProjectDocument) => [...documents, copyProject(document)].slice(-100);

function defaultEditor(document: ProjectDocument): ProjectEditorState {
  return {
    selection: null,
    hover: null,
    selectedYear: document.analysis.startYear,
    selectedPresetId: null,
    lightIntensity: 65,
    interactionMode: "inspect",
    transformMode: "translate",
    transformSpace: "world",
    snapEnabled: true,
    camera: structuredClone(DEFAULT_PROJECT_CAMERA),
    cameraRevision: 0,
  };
}

function referenceExists(document: ProjectDocument, reference: WorldObjectReference | null): boolean {
  if (!reference) return true;
  if (reference.kind === "depot") return reference.id === document.environment.depot.id;
  return document.environment.vehicles.some((vehicle) => vehicle.id === reference.id);
}

function editorForDocument(editor: ProjectEditorState, document: ProjectDocument): ProjectEditorState {
  const endYear = document.analysis.startYear + document.analysis.yearCount - 1;
  return {
    ...editor,
    selection: referenceExists(document, editor.selection) ? editor.selection : null,
    hover: referenceExists(document, editor.hover) ? editor.hover : null,
    selectedPresetId: document.vehiclePresets.some((preset) => preset.id === editor.selectedPresetId) ? editor.selectedPresetId : null,
    selectedYear: Math.max(document.analysis.startYear, Math.min(endYear, Math.round(editor.selectedYear))),
  };
}

export function createProjectRuntime(document: ProjectDocument, record: ProjectRecordMetadata | null = null): ProjectRuntime {
  const normalized = normalizeProject(document);
  return {
    document: normalized,
    record: record ? { ...record } : null,
    savedDocument: copyProject(normalized),
    editor: defaultEditor(normalized),
    editorEdit: null,
    history: { past: [], future: [], activeEdit: null },
  };
}

export function applyProjectCommand(document: ProjectDocument, command: ProjectCommand): ProjectDocument {
  switch (command.type) {
    case "rename-project":
      return normalizeProject({ ...document, name: command.name });
    case "set-active-scenario":
      return normalizeProject({ ...document, activeScenarioId: command.scenarioId });
    case "create-scenario":
      return normalizeProject({
        ...document,
        activeScenarioId: command.scenario.id,
        scenarios: [...document.scenarios, { ...command.scenario, vehiclePlans: {} }],
      });
    case "duplicate-scenario": {
      const source = document.scenarios.find((scenario) => scenario.id === command.sourceScenarioId);
      if (!source) return document;
      return normalizeProject({
        ...document,
        activeScenarioId: command.scenario.id,
        scenarios: [...document.scenarios, { ...command.scenario, vehiclePlans: structuredClone(source.vehiclePlans) }],
      });
    }
    case "rename-scenario":
      return normalizeProject({
        ...document,
        scenarios: document.scenarios.map((scenario) => scenario.id === command.scenarioId ? { ...scenario, name: command.name } : scenario),
      });
    case "delete-scenario": {
      const index = document.scenarios.findIndex((scenario) => scenario.id === command.scenarioId);
      if (index < 0 || document.scenarios.length === 1) return document;
      const scenarios = document.scenarios.toSpliced(index, 1);
      const activeScenarioId = document.activeScenarioId === command.scenarioId
        ? scenarios[Math.min(index, scenarios.length - 1)].id
        : document.activeScenarioId;
      return normalizeProject({ ...document, scenarios, activeScenarioId });
    }
    case "clear-vehicle-plans":
      return normalizeProject({
        ...document,
        scenarios: document.scenarios.map((scenario) => {
          const vehiclePlans = { ...scenario.vehiclePlans };
          delete vehiclePlans[command.vehicleId];
          return { ...scenario, vehiclePlans };
        }),
      });
    case "create-vehicle":
      return normalizeProject({
        ...document,
        environment: { ...document.environment, vehicles: [...document.environment.vehicles, structuredClone(command.vehicle)] },
      });
    case "update-vehicle":
      return normalizeProject({
        ...document,
        environment: {
          ...document.environment,
          vehicles: document.environment.vehicles.map((vehicle) => vehicle.id === command.vehicleId
            ? { ...vehicle, ...structuredClone(command.patch), id: vehicle.id }
            : vehicle),
        },
      });
    case "delete-vehicle":
      return normalizeProject({
        ...document,
        environment: { ...document.environment, vehicles: document.environment.vehicles.filter((vehicle) => vehicle.id !== command.vehicleId) },
        scenarios: document.scenarios.map((scenario) => {
          const vehiclePlans = { ...scenario.vehiclePlans };
          delete vehiclePlans[command.vehicleId];
          return { ...scenario, vehiclePlans };
        }),
      });
    case "create-vehicle-preset":
      return normalizeProject({ ...document, vehiclePresets: [...document.vehiclePresets, structuredClone(command.preset)] });
    case "update-vehicle-preset":
      return normalizeProject({
        ...document,
        vehiclePresets: document.vehiclePresets.map((preset) => preset.id === command.presetId
          ? { ...preset, ...structuredClone(command.patch), id: preset.id }
          : preset),
      });
    case "delete-vehicle-preset":
      return deleteVehiclePreset(document, command.presetId);
    case "update-analysis":
      return normalizeProject({ ...document, analysis: { ...document.analysis, ...structuredClone(command.patch) } });
    case "set-depot-transform":
      return normalizeProject({ ...document, environment: { ...document.environment, depot: { ...document.environment.depot, transform: structuredClone(command.transform) } } });
    case "set-vehicle-transform":
      return normalizeProject({
        ...document,
        environment: {
          ...document.environment,
          vehicles: document.environment.vehicles.map((vehicle) => vehicle.id === command.vehicleId ? { ...vehicle, transform: structuredClone(command.transform) } : vehicle),
        },
      });
    case "add-vehicle-transition":
      return addVehicleTransition(document, command, command.transition);
    case "update-vehicle-transition":
      return updateVehicleTransition(document, command, command.currentYear, command.transition);
    case "remove-vehicle-transition":
      return removeVehicleTransition(document, command, command.year);
    case "replace-vehicle-transitions":
      return replaceVehicleTransitions(document, command, command.transitions);
  }
}

export function executeProjectCommand(runtime: ProjectRuntime, command: ProjectCommand): ProjectRuntime {
  const committed = commitProjectEdit(commitProjectEditorEdit(runtime));
  const next = applyProjectCommand(committed.document, command);
  if (projectDocumentsEqual(committed.document, next)) return committed;
  return {
    ...committed,
    document: next,
    editor: editorForDocument(committed.editor, next),
    history: { past: appendHistorySnapshot(committed.history.past, committed.document), future: [], activeEdit: null },
  };
}

export function beginProjectEdit(runtime: ProjectRuntime): ProjectRuntime {
  const committed = commitProjectEditorEdit(runtime);
  if (committed.history.activeEdit) return committed;
  return { ...committed, history: { ...committed.history, activeEdit: copyProject(committed.document) } };
}

export function previewProjectCommand(runtime: ProjectRuntime, command: ProjectCommand): ProjectRuntime {
  const editing = runtime.history.activeEdit ? runtime : beginProjectEdit(runtime);
  const document = applyProjectCommand(editing.document, command);
  return { ...editing, document, editor: editorForDocument(editing.editor, document) };
}

export function commitProjectEdit(runtime: ProjectRuntime): ProjectRuntime {
  const start = runtime.history.activeEdit;
  if (!start) return runtime;
  return {
    ...runtime,
    history: projectDocumentsEqual(start, runtime.document)
      ? { ...runtime.history, activeEdit: null }
      : { past: appendHistorySnapshot(runtime.history.past, start), future: [], activeEdit: null },
  };
}

export function cancelProjectEdit(runtime: ProjectRuntime): ProjectRuntime {
  const start = runtime.history.activeEdit;
  if (!start) return runtime;
  return {
    ...runtime,
    document: copyProject(start),
    editor: editorForDocument(runtime.editor, start),
    history: { ...runtime.history, activeEdit: null },
  };
}

export function beginProjectEditorEdit(runtime: ProjectRuntime): ProjectRuntime {
  const committed = commitProjectEdit(runtime);
  if (committed.editorEdit) return committed;
  return { ...committed, editorEdit: structuredClone(committed.editor) };
}

export function commitProjectEditorEdit(runtime: ProjectRuntime): ProjectRuntime {
  return runtime.editorEdit ? { ...runtime, editorEdit: null } : runtime;
}

export function cancelProjectEditorEdit(runtime: ProjectRuntime): ProjectRuntime {
  if (!runtime.editorEdit) return runtime;
  return {
    ...runtime,
    editor: editorForDocument(runtime.editorEdit, runtime.document),
    editorEdit: null,
  };
}

export function undoProjectCommand(runtime: ProjectRuntime): ProjectRuntime {
  const committed = commitProjectEdit(commitProjectEditorEdit(runtime));
  const previous = committed.history.past.at(-1);
  if (!previous) return committed;
  const document = copyProject(previous);
  return {
    ...committed,
    document,
    editor: editorForDocument(committed.editor, document),
    history: {
      past: committed.history.past.slice(0, -1),
      future: appendHistorySnapshot(committed.history.future, committed.document),
      activeEdit: null,
    },
  };
}

export function redoProjectCommand(runtime: ProjectRuntime): ProjectRuntime {
  const committed = commitProjectEdit(commitProjectEditorEdit(runtime));
  const next = committed.history.future.at(-1);
  if (!next) return committed;
  const document = copyProject(next);
  return {
    ...committed,
    document,
    editor: editorForDocument(committed.editor, document),
    history: {
      past: appendHistorySnapshot(committed.history.past, committed.document),
      future: committed.history.future.slice(0, -1),
      activeEdit: null,
    },
  };
}

export function updateProjectEditor(runtime: ProjectRuntime, patch: Partial<ProjectEditorState>): ProjectRuntime {
  const commitKeys: ReadonlySet<keyof ProjectEditorState> = new Set([
    "selection",
    "selectedPresetId",
    "interactionMode",
    "transformMode",
    "transformSpace",
    "snapEnabled",
  ]);
  const current = Object.keys(patch).some((key) => commitKeys.has(key as keyof ProjectEditorState))
    ? commitProjectEdit(commitProjectEditorEdit(runtime))
    : runtime;
  return { ...current, editor: editorForDocument({ ...current.editor, ...structuredClone(patch) }, current.document) };
}

export function markProjectSaved(
  runtime: ProjectRuntime,
  record: ProjectRecordMetadata,
  savedDocument: ProjectDocument,
): ProjectRuntime {
  return { ...runtime, record: { ...record }, savedDocument: copyProject(savedDocument) };
}

export function replaceOpenProject(
  _runtime: ProjectRuntime,
  document: ProjectDocument,
  record: ProjectRecordMetadata | null,
): ProjectRuntime {
  return createProjectRuntime(document, record);
}

export function isProjectDirty(runtime: ProjectRuntime): boolean {
  return !projectDocumentsEqual(runtime.document, runtime.savedDocument);
}
