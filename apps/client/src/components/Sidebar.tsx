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
    {object ? <div className="mt-[22px] grid gap-5" key={object.id}>
      <Vector3Control label="Position (m)" value={object.position} onChange={(value) => updateTransform(object.id, "position", value)} edit={edit} />
      <Vector3Control label="Rotation (°)" value={object.rotation.map((angle) => angle * 180 / Math.PI) as Vector3} step={1} onChange={(value) => updateTransform(object.id, "rotation", value.map((angle) => angle * Math.PI / 180) as Vector3)} edit={edit} />
      <Vector3Control label="Scale" value={object.scale} min={0.01} onChange={(value) => updateTransform(object.id, "scale", value)} edit={edit} />
      <div className="grid grid-cols-2 gap-4">
        <SelectControl label="Material" value={object.material} options={materialOptions} onChange={(material) => { edit.commitEdit(); updateAppearance(object.id, { material }); }} />
        <ColorControl label="Color" value={object.color} onChange={(color) => updateAppearance(object.id, { color })} edit={edit} />
      </div>
      <label className="flex min-h-[52px] cursor-pointer items-center gap-3"><input className="size-[18px] accent-accent" type="checkbox" checked={object.wireframe} onChange={(event) => { edit.commitEdit(); updateAppearance(object.id, { wireframe: event.target.checked }); }} /><span>Wireframe</span></label>
      <button type="button" className="min-h-12 rounded-lg border border-line-strong bg-transparent px-[15px] text-xs font-bold text-secondary transition-colors duration-150 enabled:hover:border-[#668078] enabled:hover:text-primary disabled:cursor-default disabled:opacity-40 motion-reduce:transition-none" onClick={() => resetObject(object.id)}>Reset object</button>
    </div> : <p className="mb-4 text-[0.76rem] leading-relaxed text-secondary">No object selected. Choose Plane or Cube to inspect its properties.</p>}
  </CollapsibleSection>;
}

function SceneModule({ onResetCamera }: { onResetCamera: () => void }) {
  const light = useSceneStore((state) => state.document.light);
  const setLight = useSceneStore((state) => state.setLight);
  const resetScene = useSceneStore((state) => state.resetScene);
  return <CollapsibleSection title="Scene" onBeforeCollapse={edit.commitEdit}>
    <RangeControl label="Light intensity" value={light} min={0} max={100} unit="%" onChange={setLight} edit={edit} />
    <div className="mt-auto grid grid-cols-2 gap-2.5 pt-6">
      <button type="button" className="min-h-12 rounded-lg border border-line-strong bg-transparent px-[15px] text-xs font-bold text-secondary transition-colors duration-150 enabled:hover:border-[#668078] enabled:hover:text-primary disabled:cursor-default disabled:opacity-40 motion-reduce:transition-none" onClick={() => { edit.commitEdit(); onResetCamera(); }}>Reset camera</button>
      <button type="button" className="min-h-12 rounded-lg border border-line-strong bg-transparent px-[15px] text-xs font-bold text-secondary transition-colors duration-150 enabled:hover:border-[#668078] enabled:hover:text-primary disabled:cursor-default disabled:opacity-40 motion-reduce:transition-none" onClick={resetScene}>Reset scene</button>
    </div>
  </CollapsibleSection>;
}

function DebugModule() {
  const document = useSceneStore((state) => state.document);
  const id = useSceneStore((state) => state.editor.selectedObjectId);
  return <CollapsibleSection title="Debug" description="Read-only scene document. State lasts until this page is reloaded." onBeforeCollapse={edit.commitEdit}>
    <p className="mb-4 text-[0.76rem] leading-relaxed text-secondary">Selected object: <code>{id ?? "none"}</code></p>
    <pre className="max-h-[360px] overflow-auto rounded-lg border border-line bg-surface p-3 text-[0.7rem] leading-relaxed" tabIndex={0} aria-label="Scene document">{JSON.stringify(document, null, 2)}</pre>
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
  return <div className="mb-[22px] grid grid-cols-2 gap-2.5" aria-label="Edit history">
    <button type="button" className="min-h-12 rounded-lg border border-line-strong bg-transparent px-[15px] text-xs font-bold text-secondary transition-colors duration-150 enabled:hover:border-[#668078] enabled:hover:text-primary disabled:cursor-default disabled:opacity-40 motion-reduce:transition-none" disabled={!canUndo} onClick={undo}>Undo</button>
    <button type="button" className="min-h-12 rounded-lg border border-line-strong bg-transparent px-[15px] text-xs font-bold text-secondary transition-colors duration-150 enabled:hover:border-[#668078] enabled:hover:text-primary disabled:cursor-default disabled:opacity-40 motion-reduce:transition-none" disabled={!canRedo} onClick={redo}>Redo</button>
  </div>;
}

export function Sidebar({ onResetCamera }: { onResetCamera: () => void }) {
  return <aside className="flex min-w-0 flex-col overflow-y-auto bg-panel p-7 max-[900px]:overflow-visible max-[560px]:px-5 max-[560px]:py-6" id="controls" aria-labelledby="controls-title" tabIndex={-1}>
    <div className="pb-5"><span className="mb-2 block font-mono text-[0.68rem] font-bold tracking-[0.14em] text-accent uppercase">Scene editor</span><h2 className="text-[clamp(1.6rem,3vw,2.15rem)] font-medium tracking-[-0.045em]" id="controls-title">Playground</h2><p className="mt-2.5 max-w-[38ch] text-[0.87rem] leading-relaxed text-secondary">Explore the world, select an object, and adjust its properties.</p></div>
    <HistoryControls />
    <Inspector />
    <SceneModule onResetCamera={onResetCamera} />
    <DebugModule />
  </aside>;
}
