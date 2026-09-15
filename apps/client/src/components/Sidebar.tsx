import { useSceneStore } from "../state/sceneStore";
import type { MaterialPreset, Vector3 } from "../scene/types";
import { WorldObjects } from "./WorldObjects";
import { getDefinition } from "../scene/catalog";
import { CollapsibleSection } from "./CollapsibleSection";
import { ColorControl, RangeControl, SelectControl, Vector3Control } from "./controls";
import { useResolvedModelId, useResolvedName } from "../state/presetStore";
import { VehiclePresets } from "./VehiclePresets";

const edit = {
  beginEdit: () => useSceneStore.getState().beginEdit(),
  commitEdit: () => useSceneStore.getState().commitEdit(),
  cancelEdit: () => useSceneStore.getState().cancelEdit(),
};
const materialOptions: { value: MaterialPreset | ""; label: string }[] = [
  { value: "", label: "Default materials" }, { value: "matte", label: "Matte" }, { value: "glossy", label: "Glossy" }, { value: "metal", label: "Metal" },
];

const actionClass = "min-h-11 rounded-lg border border-line-strong px-3 text-xs font-bold text-secondary hover:border-[#668078] hover:text-primary";

function Inspector() {
  const objects = useSceneStore((state) => state.document.objects);
  const selectedId = useSceneStore((state) => state.editor.selectedObjectId);
  const object = objects.find((item) => item.id === selectedId);
  // Hooks stay unconditional; an empty definition id simply resolves to no definition.
  const modelId = useResolvedModelId(object ?? { definitionId: "" });
  const name = useResolvedName(object ?? { name: "" });
  const updateTransform = useSceneStore((state) => state.updateTransform);
  const updateAppearance = useSceneStore((state) => state.updateAppearance);
  const resetObject = useSceneStore((state) => state.resetObject);
  return <CollapsibleSection title="Inspector" defaultOpen description="Edit the selected object's properties. Changes apply live." onBeforeCollapse={edit.commitEdit}>
    {object ? <div className="mt-[22px] grid gap-5" key={object.id}>
      <p className="break-words text-sm font-semibold text-primary">{name}</p>
      {!getDefinition(modelId) && <p role="alert" className="text-xs text-secondary">Unknown object definition. Update the catalog or delete this object.</p>}
      <Vector3Control label="Position (m)" value={object.transform.position} onChange={(value) => updateTransform(object.id, "position", value)} edit={edit} />
      <Vector3Control label="Rotation (°)" value={object.transform.rotation.map((angle) => angle * 180 / Math.PI) as Vector3} step={1} onChange={(value) => updateTransform(object.id, "rotation", value.map((angle) => angle * Math.PI / 180) as Vector3)} edit={edit} />
      <Vector3Control label="Scale" value={object.transform.scale} min={0.01} onChange={(value) => updateTransform(object.id, "scale", value)} edit={edit} />
      <div className="grid grid-cols-2 gap-4">
        <SelectControl label="Material" value={object.appearance.material ?? ""} options={materialOptions} onChange={(material) => { edit.commitEdit(); updateAppearance(object.id, { material: material || undefined }); }} />
        <ColorControl label="Tint" value={object.appearance.tint ?? "#ffffff"} onChange={(tint) => updateAppearance(object.id, { tint })} edit={edit} />
      </div>
      <p className="text-xs text-secondary">{Object.keys(object.appearance).length ? "Appearance overrides active." : "Using the model's default materials."} Tint multiplies the default colors; material presets affect PBR surfaces.</p>
      <button type="button" className={actionClass} onClick={() => useSceneStore.getState().restoreAppearance(object.id)}>Restore Appearance</button>
      <label className="flex min-h-[52px] cursor-pointer items-center gap-3"><input className="size-[18px] accent-accent" type="checkbox" checked={object.appearance.wireframe ?? false} onChange={(event) => { edit.commitEdit(); updateAppearance(object.id, { wireframe: event.target.checked }); }} /><span>Wireframe</span></label>
      <button type="button" className="min-h-12 rounded-lg border border-line-strong bg-transparent px-[15px] text-xs font-bold text-secondary transition-colors duration-150 enabled:hover:border-[#668078] enabled:hover:text-primary disabled:cursor-default disabled:opacity-40 motion-reduce:transition-none" onClick={() => resetObject(object.id)}>Reset object</button>
    </div> : <p className="mb-4 text-[0.76rem] leading-relaxed text-secondary">No object selected. Select an object in World Objects or click one in the viewport.</p>}
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

export function Sidebar({ onResetCamera }: { onResetCamera: () => void }) {
  return <aside className="col-start-3 row-start-1 flex min-h-0 min-w-0 flex-col overflow-y-auto overscroll-contain bg-panel p-7 *:shrink-0 max-[900px]:col-start-1 max-[900px]:row-start-3 max-[560px]:px-5 max-[560px]:py-6" id="controls" aria-labelledby="controls-title" tabIndex={-1}>
    <div className="pb-5"><span className="mb-2 block font-mono text-[0.68rem] font-bold tracking-[0.14em] text-accent uppercase">Scene editor</span><h2 className="text-[clamp(1.6rem,3vw,2.15rem)] font-medium tracking-[-0.045em]" id="controls-title">Playground</h2><p className="mt-2.5 max-w-[38ch] text-[0.87rem] leading-relaxed text-secondary">Explore the world, select an object, and adjust its properties.</p></div>
    <VehiclePresets />
    <WorldObjects />
    <Inspector />
    <SceneModule onResetCamera={onResetCamera} />
    <DebugModule />
  </aside>;
}
