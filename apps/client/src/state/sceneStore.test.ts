import { beforeEach, describe, expect, it } from "vitest";
import { createDocument, useSceneStore } from "./sceneStore";

const state = useSceneStore.getState;
beforeEach(() => useSceneStore.setState({ document: createDocument(), editor: { selectedObjectId: "cube" }, history: { past: [], future: [], baseline: null } }));

describe("scene document and history", () => {
  it("updates one object immutably and keeps selection outside history", () => {
    const plane = state().document.objects[0];
    state().updateTransform("cube", "position", [2, 3, 4]);
    state().selectObject("plane");
    expect(state().document.objects[0]).toBe(plane);
    expect(state().document.objects[1].position).toEqual([2, 3, 4]);
    state().undo();
    expect(state().document.objects[1].position).toEqual([0, 1, 0]);
    expect(state().editor.selectedObjectId).toBe("plane");
    state().redo();
    expect(state().document.objects[1].position).toEqual([2, 3, 4]);
    expect(JSON.parse(JSON.stringify(state().document))).toEqual(state().document);
  });
  it("rejects invalid values and ignores no-ops and unknown objects", () => {
    state().updateTransform("cube", "scale", [0, 1, 1]);
    state().updateTransform("cube", "scale", [-1, 1, 1]);
    state().updateTransform("cube", "position", [NaN, 1, 1]);
    state().updateTransform("cube", "rotation", [Infinity, 0, 0]);
    state().updateTransform("missing", "position", [1, 1, 1]);
    state().updateAppearance("cube", { color: "invalid" });
    state().setLight(101);
    state().setLight(65);
    expect(state().history.past).toHaveLength(0);
    expect(state().document).toEqual(createDocument());
  });
  it("groups live updates and cancels without losing redo", () => {
    state().setLight(30);
    state().undo();
    state().beginEdit();
    state().setLight(40);
    state().setLight(50);
    expect(state().document.light).toBe(50);
    expect(state().history.past).toHaveLength(0);
    state().cancelEdit();
    expect(state().document.light).toBe(65);
    expect(state().history.future).toHaveLength(1);
    state().beginEdit();
    state().setLight(40);
    state().setLight(45);
    state().commitEdit();
    expect(state().history.past).toHaveLength(1);
    expect(state().history.future).toHaveLength(0);
    state().undo();
    expect(state().document.light).toBe(65);
  });
  it("commits on selection, reset and undo, with undoable object and scene resets", () => {
    state().beginEdit();
    state().updateAppearance("cube", { wireframe: true });
    state().selectObject(null);
    expect(state().history.baseline).toBeNull();
    state().resetObject("cube");
    state().undo();
    expect(state().document.objects[1].wireframe).toBe(true);
    state().setLight(10);
    state().resetScene();
    expect(state().document).toEqual(createDocument());
    state().undo();
    expect(state().document.light).toBe(10);
    state().beginEdit();
    state().setLight(20);
    state().undo();
    expect(state().document.light).toBe(10);
  });
  it("does not record a gesture returning to its starting value and bounds history", () => {
    state().beginEdit();
    state().setLight(10);
    state().setLight(65);
    state().commitEdit();
    expect(state().history.past).toHaveLength(0);
    for (let i = 0; i < 120; i++) state().setLight(i % 100);
    expect(state().history.past).toHaveLength(100);
  });
});
