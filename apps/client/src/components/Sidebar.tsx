import { useEffect } from "react";
import { useSceneStore, type MaterialPreset, type Vector3 } from "../state/sceneStore";
import { CollapsibleSection } from "./CollapsibleSection";
import { ColorControl, RangeControl, SelectControl, Vector3Control } from "./controls";

const edit = {
  beginEdit: () => useSceneStore.getState().beginEdit(),
  commitEdit: () => useSceneStore.getState().commitEdit(),
  cancelEdit: () => useSceneStore.getState().cancelEdit(),
};
const materialOptions: { value: MaterialPreset; label: string }[] = [
  { value: "matte", label: "Matte" }, { value: "glossy", label: "Glossy" }, { value: "metal", label: "Metal" },
];

function Inspector() {
  const objects = useSceneStore((state) => state.document.objects);
  const selectedId = useSceneStore((state) => state.editor.selectedObjectId);
  const object = objects.find((item) => item.id === selectedId);
  const selectObject = useSceneStore((state) => state.selectObject);
  const updateTransform = useSceneStore((state) => state.updateTransform);
  const updateAppearance = useSceneStore((state) => state.updateAppearance);
  const resetObject = useSceneStore((state) => state.resetObject);
  return <CollapsibleSection title="Inspector" defaultOpen description="Select an object here or in the world. Changes apply live." onBeforeCollapse={edit.commitEdit}>
    <SelectControl label="Object" value={selectedId ?? ""} options={[{ value: "", label: "No selection" }, ...objects.map((item) => ({ value: item.id, label: item.name }))]} onChange={(id) => selectObject(id || null)} />
    {object ? <div className="inspector-fields" key={object.id}>
      <Vector3Control label="Position (m)" value={object.position} onChange={(value) => updateTransform(object.id, "position", value)} edit={edit} />
      <Vector3Control label="Rotation (°)" value={object.rotation.map((angle) => angle * 180 / Math.PI) as Vector3} step={1} onChange={(value) => updateTransform(object.id, "rotation", value.map((angle) => angle * Math.PI / 180) as Vector3)} edit={edit} />
      <Vector3Control label="Scale" value={object.scale} min={0.01} onChange={(value) => updateTransform(object.id, "scale", value)} edit={edit} />
      <div className="field-grid">
        <SelectControl label="Material" value={object.material} options={materialOptions} onChange={(material) => { edit.commitEdit(); updateAppearance(object.id, { material }); }} />
        <ColorControl label="Color" value={object.color} onChange={(color) => updateAppearance(object.id, { color })} edit={edit} />
      </div>
      <label className="checkbox-row"><input type="checkbox" checked={object.wireframe} onChange={(event) => { edit.commitEdit(); updateAppearance(object.id, { wireframe: event.target.checked }); }} /><span>Wireframe</span></label>
      <button type="button" className="secondary-button" onClick={() => resetObject(object.id)}>Reset object</button>
    </div> : <p className="module-description">No object selected. Choose Plane or Cube to inspect its properties.</p>}
  </CollapsibleSection>;
}

function SceneModule({ onResetCamera }: { onResetCamera: () => void }) {
  const light = useSceneStore((state) => state.document.light);
  const setLight = useSceneStore((state) => state.setLight);
  const resetScene = useSceneStore((state) => state.resetScene);
  return <CollapsibleSection title="Scene" onBeforeCollapse={edit.commitEdit}>
    <RangeControl label="Light intensity" value={light} min={0} max={100} unit="%" onChange={setLight} edit={edit} />
    <div className="action-row">
      <button type="button" className="secondary-button" onClick={() => { edit.commitEdit(); onResetCamera(); }}>Reset camera</button>
      <button type="button" className="secondary-button" onClick={resetScene}>Reset scene</button>
    </div>
  </CollapsibleSection>;
}

function DebugModule() {
  const document = useSceneStore((state) => state.document);
  const id = useSceneStore((state) => state.editor.selectedObjectId);
  return <CollapsibleSection title="Debug" description="Read-only scene document. State lasts until this page is reloaded." onBeforeCollapse={edit.commitEdit}>
    <p className="module-description">Selected object: <code>{id ?? "none"}</code></p>
    <pre className="debug-json" tabIndex={0} aria-label="Scene document">{JSON.stringify(document, null, 2)}</pre>
  </CollapsibleSection>;
}

function HistoryControls() {
  const canUndo = useSceneStore((state) => state.history.past.length > 0 || (state.history.baseline !== null && state.history.baseline !== state.document));
  const canRedo = useSceneStore((state) => state.history.future.length > 0);
  const undo = useSceneStore((state) => state.undo);
  const redo = useSceneStore((state) => state.redo);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && (target.matches("input, textarea, select") || target.isContentEditable)) return;
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === "z" || key === "y") {
        event.preventDefault();
        if (key === "y" || event.shiftKey) redo(); else undo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);
  return <div className="history-controls" aria-label="Edit history">
    <button type="button" className="secondary-button" disabled={!canUndo} onClick={undo}>Undo</button>
    <button type="button" className="secondary-button" disabled={!canRedo} onClick={redo}>Redo</button>
  </div>;
}

export function Sidebar({ onResetCamera }: { onResetCamera: () => void }) {
  return <aside className="control-panel" id="controls" aria-labelledby="controls-title" tabIndex={-1}>
    <div className="control-intro"><span className="eyebrow">Scene editor</span><h2 id="controls-title">Playground</h2><p>Explore the world, select an object, and adjust its properties.</p></div>
    <HistoryControls />
    <Inspector />
    <SceneModule onResetCamera={onResetCamera} />
    <DebugModule />
  </aside>;
}
