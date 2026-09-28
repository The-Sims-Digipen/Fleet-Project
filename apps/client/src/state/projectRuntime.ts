import {
  addVehicleTransition,
  copyProjectV5,
  normalizeProjectV5,
  removeVehicleTransition,
  replaceVehicleTransitions,
  updateVehicleTransition,
  type ProjectDocumentV5,
  type ProjectAnalysisSettings,
  type ProjectVehicle,
  type VehicleTransition,
} from "../domain/projectV5";
import type { Transform } from "../scene/types";
import type { VehiclePreset } from "../vehicles/types";

export type ProjectRecordMetadata = {
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type WorldObjectReference =
  | { kind: "depot"; id: string }
  | { kind: "vehicle"; id: string };

export type ProjectEditorState = {
  selection: WorldObjectReference | null;
  hover: WorldObjectReference | null;
  selectedYear: number;
  interactionMode: "inspect" | "gizmo";
  transformMode: "translate" | "rotate" | "scale";
  transformSpace: "world" | "local";
  snapEnabled: boolean;
  activePanel: string | null;
  camera: { position: [number, number, number]; target: [number, number, number] };
};

export type ProjectHistory = {
  past: ProjectDocumentV5[];
  future: ProjectDocumentV5[];
  activeEdit: ProjectDocumentV5 | null;
};

export type ProjectRuntime = {
  document: ProjectDocumentV5;
  record: ProjectRecordMetadata | null;
  savedDocument: ProjectDocumentV5;
  editor: ProjectEditorState;
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
  | { type: "delete-vehicle"; vehicleId: string }
  | { type: "replace-fleet-data"; vehicles: ProjectVehicle[]; analysis: ProjectAnalysisSettings }
  | { type: "replace-vehicle-presets"; presets: VehiclePreset[] }
  | { type: "set-depot-transform"; transform: Transform }
  | { type: "set-vehicle-transform"; vehicleId: string; transform: Transform }
  | { type: "add-vehicle-transition"; scenarioId: string; vehicleId: string; transition: VehicleTransition }
  | { type: "update-vehicle-transition"; scenarioId: string; vehicleId: string; currentYear: number; transition: VehicleTransition }
  | { type: "remove-vehicle-transition"; scenarioId: string; vehicleId: string; year: number }
  | { type: "replace-vehicle-transitions"; scenarioId: string; vehicleId: string; transitions: VehicleTransition[] };

const projectDocumentsEqual = (left: ProjectDocumentV5, right: ProjectDocumentV5) => JSON.stringify(left) === JSON.stringify(right);
const appendHistorySnapshot = (documents: ProjectDocumentV5[], document: ProjectDocumentV5) => [...documents, copyProjectV5(document)].slice(-100);

function defaultEditor(document: ProjectDocumentV5): ProjectEditorState {
  return {
    selection: null,
    hover: null,
    selectedYear: document.analysis.startYear,
    interactionMode: "inspect",
    transformMode: "translate",
    transformSpace: "world",
    snapEnabled: true,
    activePanel: null,
    camera: { position: [8, 7, 9], target: [0, 0, 0] },
  };
}

function referenceExists(document: ProjectDocumentV5, reference: WorldObjectReference | null): boolean {
  if (!reference) return true;
  if (reference.kind === "depot") return reference.id === document.environment.depot.id;
  return document.environment.vehicles.some((vehicle) => vehicle.id === reference.id);
}

function editorForDocument(editor: ProjectEditorState, document: ProjectDocumentV5): ProjectEditorState {
  const endYear = document.analysis.startYear + document.analysis.yearCount - 1;
  return {
    ...editor,
    selection: referenceExists(document, editor.selection) ? editor.selection : null,
    hover: referenceExists(document, editor.hover) ? editor.hover : null,
    selectedYear: Math.max(document.analysis.startYear, Math.min(endYear, Math.round(editor.selectedYear))),
  };
}

export function createProjectRuntime(document: ProjectDocumentV5, record: ProjectRecordMetadata | null = null): ProjectRuntime {
  const normalized = normalizeProjectV5(document);
  return {
    document: normalized,
    record: record ? { ...record } : null,
    savedDocument: copyProjectV5(normalized),
    editor: defaultEditor(normalized),
    history: { past: [], future: [], activeEdit: null },
  };
}

export function applyProjectCommand(document: ProjectDocumentV5, command: ProjectCommand): ProjectDocumentV5 {
  switch (command.type) {
    case "rename-project":
      return normalizeProjectV5({ ...document, name: command.name });
    case "set-active-scenario":
      return normalizeProjectV5({ ...document, activeScenarioId: command.scenarioId });
    case "create-scenario":
      return normalizeProjectV5({
        ...document,
        activeScenarioId: command.scenario.id,
        scenarios: [...document.scenarios, { ...command.scenario, vehiclePlans: {} }],
      });
    case "duplicate-scenario": {
      const source = document.scenarios.find((scenario) => scenario.id === command.sourceScenarioId);
      if (!source) return document;
      return normalizeProjectV5({
        ...document,
        activeScenarioId: command.scenario.id,
        scenarios: [...document.scenarios, { ...command.scenario, vehiclePlans: structuredClone(source.vehiclePlans) }],
      });
    }
    case "rename-scenario":
      return normalizeProjectV5({
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
      return normalizeProjectV5({ ...document, scenarios, activeScenarioId });
    }
    case "clear-vehicle-plans":
      return normalizeProjectV5({
        ...document,
        scenarios: document.scenarios.map((scenario) => {
          const vehiclePlans = { ...scenario.vehiclePlans };
          delete vehiclePlans[command.vehicleId];
          return { ...scenario, vehiclePlans };
        }),
      });
    case "delete-vehicle":
      return normalizeProjectV5({
        ...document,
        environment: { ...document.environment, vehicles: document.environment.vehicles.filter((vehicle) => vehicle.id !== command.vehicleId) },
        scenarios: document.scenarios.map((scenario) => {
          const vehiclePlans = { ...scenario.vehiclePlans };
          delete vehiclePlans[command.vehicleId];
          return { ...scenario, vehiclePlans };
        }),
      });
    case "replace-fleet-data": {
      const vehicleIds = new Set(command.vehicles.map((vehicle) => vehicle.id));
      return normalizeProjectV5({
        ...document,
        environment: { ...document.environment, vehicles: structuredClone(command.vehicles) },
        analysis: structuredClone(command.analysis),
        scenarios: document.scenarios.map((scenario) => ({
          ...scenario,
          vehiclePlans: Object.fromEntries(Object.entries(scenario.vehiclePlans).filter(([vehicleId]) => vehicleIds.has(vehicleId))),
        })),
      });
    }
    case "replace-vehicle-presets":
      return normalizeProjectV5({ ...document, vehiclePresets: structuredClone(command.presets) });
    case "set-depot-transform":
      return normalizeProjectV5({ ...document, environment: { ...document.environment, depot: { ...document.environment.depot, transform: structuredClone(command.transform) } } });
    case "set-vehicle-transform":
      return normalizeProjectV5({
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
  const committed = commitProjectEdit(runtime);
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
  if (runtime.history.activeEdit) return runtime;
  return { ...runtime, history: { ...runtime.history, activeEdit: copyProjectV5(runtime.document) } };
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
    document: copyProjectV5(start),
    editor: editorForDocument(runtime.editor, start),
    history: { ...runtime.history, activeEdit: null },
  };
}

export function undoProjectCommand(runtime: ProjectRuntime): ProjectRuntime {
  const committed = commitProjectEdit(runtime);
  const previous = committed.history.past.at(-1);
  if (!previous) return committed;
  const document = copyProjectV5(previous);
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
  const committed = commitProjectEdit(runtime);
  const next = committed.history.future.at(-1);
  if (!next) return committed;
  const document = copyProjectV5(next);
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
    "interactionMode",
    "transformMode",
    "transformSpace",
    "snapEnabled",
    "activePanel",
  ]);
  const current = Object.keys(patch).some((key) => commitKeys.has(key as keyof ProjectEditorState))
    ? commitProjectEdit(runtime)
    : runtime;
  return { ...current, editor: editorForDocument({ ...current.editor, ...structuredClone(patch) }, current.document) };
}

export function markProjectSaved(
  runtime: ProjectRuntime,
  record: ProjectRecordMetadata,
  savedDocument: ProjectDocumentV5,
): ProjectRuntime {
  return { ...runtime, record: { ...record }, savedDocument: copyProjectV5(savedDocument) };
}

export function replaceOpenProject(
  _runtime: ProjectRuntime,
  document: ProjectDocumentV5,
  record: ProjectRecordMetadata | null,
): ProjectRuntime {
  return createProjectRuntime(document, record);
}

export function isProjectDirty(runtime: ProjectRuntime): boolean {
  return !projectDocumentsEqual(runtime.document, runtime.savedDocument);
}
