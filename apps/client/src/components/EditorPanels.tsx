import type { Transform, Vector3 } from "../scene/types";
import { useProjectStore } from "../state/projectStore";
import { CollapsibleSection } from "./CollapsibleSection";
import { projectEditLifecycle, projectEditorEditLifecycle } from "./projectEditLifecycle";
import { RangeControl, Vector3Control } from "./controls";

export function InspectorPanel() {
  const document = useProjectStore((state) => state.runtime.document);
  const selection = useProjectStore((state) => state.runtime.editor.selection);
  const object = selection?.kind === "depot"
    ? document.environment.depot
    : selection?.kind === "vehicle"
      ? document.environment.vehicles.find((vehicle) => vehicle.id === selection.id)
      : undefined;

  const updateTransform = (property: keyof Transform, value: Vector3) => {
    if (!selection || !object) return;
    useProjectStore.getState().updateObjectTransform(selection, { ...object.transform, [property]: value });
  };

  return <CollapsibleSection panelId="inspector" title="Inspector" description="Edit the selected depot or vehicle transform." onBeforeCollapse={projectEditLifecycle.commitEdit}>
    {object ? <div className="mt-[22px] grid gap-5" key={object.id}>
      <p className="break-words text-sm font-semibold text-primary">{object.name}</p>
      <Vector3Control label="Position (m)" value={object.transform.position} onChange={(value) => updateTransform("position", value)} edit={projectEditLifecycle} />
      <Vector3Control label="Rotation (°)" value={object.transform.rotation.map((angle) => angle * 180 / Math.PI) as Vector3} step={1}
        onChange={(value) => updateTransform("rotation", value.map((angle) => angle * Math.PI / 180) as Vector3)} edit={projectEditLifecycle} />
      <Vector3Control label="Scale" value={object.transform.scale} min={0.01} onChange={(value) => updateTransform("scale", value)} edit={projectEditLifecycle} />
    </div> : <p className="mb-4 text-[0.76rem] leading-relaxed text-secondary">No object selected. Click the depot or a vehicle in the viewport.</p>}
  </CollapsibleSection>;
}

export function ScenePanel() {
  const light = useProjectStore((state) => state.runtime.editor.lightIntensity);
  const setLight = useProjectStore((state) => state.setLightIntensity);
  const resetCamera = useProjectStore((state) => state.resetCamera);
  return <CollapsibleSection panelId="scene" title="Scene" onBeforeCollapse={projectEditorEditLifecycle.commitEdit}>
    <RangeControl label="Light intensity" value={light} min={0} max={100} unit="%" onChange={setLight} edit={projectEditorEditLifecycle} />
    <button type="button" className="mt-6 min-h-12 w-full rounded-lg border border-line-strong bg-transparent px-[15px] text-xs font-bold text-secondary hover:border-[#668078] hover:text-primary"
      onClick={() => { projectEditorEditLifecycle.commitEdit(); resetCamera(); }}>Reset camera</button>
  </CollapsibleSection>;
}

export function DebugPanel() {
  const document = useProjectStore((state) => state.runtime.document);
  const selection = useProjectStore((state) => state.runtime.editor.selection);
  return <CollapsibleSection panelId="debug" title="Debug" description="Read-only canonical Project document.">
    <p className="mb-4 text-[0.76rem] leading-relaxed text-secondary">Selected object: <code>{selection?.id ?? "none"}</code></p>
    <pre className="max-h-[360px] overflow-auto rounded-lg border border-line bg-surface p-3 text-[0.7rem] leading-relaxed" tabIndex={0} aria-label="Project document">{JSON.stringify(document, null, 2)}</pre>
  </CollapsibleSection>;
}
