import { create } from "zustand";

import { createObject, getDefinition } from "../scene/catalog";
import { copyTransform, type Appearance, type SceneDocument, type SceneObject, type Transform, type TransformProperty, type Vector3 } from "../scene/types";

export type TransformMode = "translate" | "rotate" | "scale";
export type TransformSpace = "world" | "local";
export type EditorState = {
  selectedObjectId: string | null;
  transformMode: TransformMode;
  transformSpace: TransformSpace;
  snapEnabled: boolean;
};

export function createDocument(): SceneDocument {
  return {
    version: 2,
    light: 65,
    objects: [createObject("van", "sample")!],
  };
}

export function createEditorState(selectedObjectId: string | null = "sample"): EditorState {
  return { selectedObjectId, transformMode: "translate", transformSpace: "world", snapEnabled: true };
}

type History = { past: SceneDocument[]; future: SceneDocument[]; baseline: SceneDocument | null };
type SceneState = {
  document: SceneDocument;
  editor: EditorState;
  history: History;
  selectObject: (id: string | null) => void;
  setTransformMode: (mode: TransformMode) => void;
  setTransformSpace: (space: TransformSpace) => void;
  setSnapEnabled: (enabled: boolean) => void;
  updateTransform: (id: string, property: TransformProperty, value: Vector3) => void;
  updateObjectTransform: (id: string, transform: Transform) => void;
  updateAppearance: (id: string, patch: Appearance) => void;
  restoreAppearance: (id: string) => void;
  addObject: (definitionId: string) => void;
  deleteObject: (id: string) => void;
  setLight: (value: number) => void;
  resetObject: (id: string) => void;
  resetScene: () => void;
  beginEdit: () => void;
  commitEdit: () => void;
  cancelEdit: () => void;
  undo: () => void;
  redo: () => void;
};

const equal = (a: SceneDocument, b: SceneDocument) => JSON.stringify(a) === JSON.stringify(b);
const push = (items: SceneDocument[], item: SceneDocument) => [...items, item].slice(-100);
const validVector = (value: Vector3) => value.length === 3 && value.every(Number.isFinite);
const validTransform = (transform: Transform) =>
  validVector(transform.position) && validVector(transform.rotation) && validVector(transform.scale) && transform.scale.every((axis) => axis > 0);

// Immutable snapshots are sufficient for this deliberately small document.
// Gesture previews change the document but do not enter history until committed.
export const useSceneStore = create<SceneState>((set, get) => {
  const validEditor = (document: SceneDocument): EditorState => {
    const editor = get().editor;
    return {
      ...editor,
      selectedObjectId: document.objects.some((object) => object.id === editor.selectedObjectId) ? editor.selectedObjectId : null,
    };
  };
  const change = (next: SceneDocument) => {
    const { document, history } = get();
    if (equal(document, next)) return;
    set({ document: next, editor: validEditor(next), history: history.baseline ? history : { past: push(history.past, document), future: [], baseline: null } });
  };
  const changeObject = (id: string, patch: Partial<SceneObject>) => {
    const document = get().document;
    change({ ...document, objects: document.objects.map((object) => object.id === id ? { ...object, ...patch } : object) });
  };
  const patchEditor = (patch: Partial<EditorState>) => set({ editor: { ...get().editor, ...patch } });
  return {
    document: createDocument(),
    editor: createEditorState(),
    history: { past: [], future: [], baseline: null },
    selectObject: (id) => {
      get().commitEdit();
      if (id === null || get().document.objects.some((object) => object.id === id)) patchEditor({ selectedObjectId: id });
    },
    setTransformMode: (mode) => {
      get().commitEdit();
      if (["translate", "rotate", "scale"].includes(mode)) patchEditor({ transformMode: mode });
    },
    setTransformSpace: (space) => {
      get().commitEdit();
      if (["world", "local"].includes(space)) patchEditor({ transformSpace: space });
    },
    setSnapEnabled: (enabled) => {
      get().commitEdit();
      patchEditor({ snapEnabled: enabled });
    },
    updateTransform: (id, property, value) => {
      if (!["position", "rotation", "scale"].includes(property) || !validVector(value) || (property === "scale" && value.some((axis) => axis <= 0))) return;
      const object = get().document.objects.find((item) => item.id === id);
      if (object) changeObject(id, { transform: { ...object.transform, [property]: [...value] } });
    },
    updateObjectTransform: (id, transform) => {
      if (!validTransform(transform)) return;
      if (get().document.objects.some((item) => item.id === id)) changeObject(id, { transform: copyTransform(transform) });
    },
    updateAppearance: (id, patch) => {
      if (patch.tint !== undefined && !/^#[0-9a-f]{6}$/i.test(patch.tint)) return;
      if (patch.material !== undefined && !["matte", "glossy", "metal"].includes(patch.material)) return;
      if (patch.wireframe !== undefined && typeof patch.wireframe !== "boolean") return;
      const object = get().document.objects.find((item) => item.id === id);
      if (!object) return;
      const appearance = { ...object.appearance };
      for (const key of ["tint", "material", "wireframe"] as const) {
        if (Object.hasOwn(patch, key)) {
          if (patch[key] === undefined) delete appearance[key];
          else Object.assign(appearance, { [key]: patch[key] });
        }
      }
      changeObject(id, { appearance });
    },
    restoreAppearance: (id) => { get().commitEdit(); changeObject(id, { appearance: {} }); },
    addObject: (definitionId) => {
      const object = createObject(definitionId, crypto.randomUUID());
      if (!object) return;
      get().commitEdit();
      change({ ...get().document, objects: [...get().document.objects, object] });
      patchEditor({ selectedObjectId: object.id });
    },
    deleteObject: (id) => {
      get().commitEdit();
      change({ ...get().document, objects: get().document.objects.filter((object) => object.id !== id) });
    },
    setLight: (light) => {
      if (Number.isFinite(light) && light >= 0 && light <= 100) change({ ...get().document, light });
    },
    resetObject: (id) => {
      get().commitEdit();
      const object = get().document.objects.find((item) => item.id === id);
      const definition = object && getDefinition(object.definitionId);
      if (definition) changeObject(id, { transform: copyTransform(definition.transform), appearance: {} });
    },
    resetScene: () => { get().commitEdit(); change(createDocument()); },
    beginEdit: () => {
      if (!get().history.baseline) set({ history: { ...get().history, baseline: get().document } });
    },
    commitEdit: () => {
      const { document, history } = get();
      if (!history.baseline) return;
      set({ history: equal(history.baseline, document)
        ? { ...history, baseline: null }
        : { past: push(history.past, history.baseline), future: [], baseline: null } });
    },
    cancelEdit: () => {
      const { history } = get();
      if (history.baseline) set({ document: history.baseline, editor: validEditor(history.baseline), history: { ...history, baseline: null } });
    },
    undo: () => {
      get().commitEdit();
      const { document, history } = get();
      const previous = history.past.at(-1);
      if (previous) set({ document: previous, editor: validEditor(previous), history: { past: history.past.slice(0, -1), future: push(history.future, document), baseline: null } });
    },
    redo: () => {
      get().commitEdit();
      const { document, history } = get();
      const next = history.future.at(-1);
      if (next) set({ document: next, editor: validEditor(next), history: { past: push(history.past, document), future: history.future.slice(0, -1), baseline: null } });
    },
  };
});
