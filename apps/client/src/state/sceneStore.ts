import { create } from "zustand";

export type Vector3 = [number, number, number];
export type MaterialPreset = "matte" | "glossy" | "metal";
export type SceneObject = {
  id: string;
  name: string;
  type: "plane" | "cube";
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  color: string;
  material: MaterialPreset;
  wireframe: boolean;
};
export type SceneDocument = { version: 1; objects: SceneObject[]; light: number };
export type TransformProperty = "position" | "rotation" | "scale";

export function createDocument(): SceneDocument {
  return {
    version: 1,
    light: 65,
    objects: [
      { id: "plane", name: "Plane", type: "plane", position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], color: "#55d6be", material: "matte", wireframe: false },
      { id: "cube", name: "Cube", type: "cube", position: [0, 1, 0], rotation: [0, 0, 0], scale: [1, 1, 1], color: "#e8ba78", material: "matte", wireframe: false },
    ],
  };
}

type History = { past: SceneDocument[]; future: SceneDocument[]; baseline: SceneDocument | null };
type SceneState = {
  document: SceneDocument;
  editor: { selectedObjectId: string | null };
  history: History;
  selectObject: (id: string | null) => void;
  updateTransform: (id: string, property: TransformProperty, value: Vector3) => void;
  updateAppearance: (id: string, patch: Partial<Pick<SceneObject, "color" | "material" | "wireframe">>) => void;
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

// Immutable snapshots are sufficient for this deliberately small document.
// Gesture previews change the document but do not enter history until committed.
export const useSceneStore = create<SceneState>((set, get) => {
  const change = (next: SceneDocument) => {
    const { document, history } = get();
    if (equal(document, next)) return;
    set({ document: next, history: history.baseline ? history : { past: push(history.past, document), future: [], baseline: null } });
  };
  const changeObject = (id: string, patch: Partial<SceneObject>) => {
    const document = get().document;
    change({ ...document, objects: document.objects.map((object) => object.id === id ? { ...object, ...patch } : object) });
  };
  return {
    document: createDocument(),
    editor: { selectedObjectId: "cube" },
    history: { past: [], future: [], baseline: null },
    selectObject: (id) => {
      get().commitEdit();
      if (id === null || get().document.objects.some((object) => object.id === id)) set({ editor: { selectedObjectId: id } });
    },
    updateTransform: (id, property, value) => {
      if (!value.every(Number.isFinite) || (property === "scale" && value.some((axis) => axis <= 0))) return;
      changeObject(id, { [property]: [...value] });
    },
    updateAppearance: (id, patch) => {
      if (patch.color !== undefined && !/^#[0-9a-f]{6}$/i.test(patch.color)) return;
      if (patch.material !== undefined && !["matte", "glossy", "metal"].includes(patch.material)) return;
      changeObject(id, patch);
    },
    setLight: (light) => {
      if (Number.isFinite(light) && light >= 0 && light <= 100) change({ ...get().document, light });
    },
    resetObject: (id) => {
      get().commitEdit();
      const object = createDocument().objects.find((item) => item.id === id);
      if (object) changeObject(id, object);
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
      if (history.baseline) set({ document: history.baseline, history: { ...history, baseline: null } });
    },
    undo: () => {
      get().commitEdit();
      const { document, history } = get();
      const previous = history.past.at(-1);
      if (previous) set({ document: previous, history: { past: history.past.slice(0, -1), future: push(history.future, document), baseline: null } });
    },
    redo: () => {
      get().commitEdit();
      const { document, history } = get();
      const next = history.future.at(-1);
      if (next) set({ document: next, history: { past: push(history.past, document), future: history.future.slice(0, -1), baseline: null } });
    },
  };
});
