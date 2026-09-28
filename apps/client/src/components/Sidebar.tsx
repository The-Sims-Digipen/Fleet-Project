import type { Transform, Vector3 } from "../scene/types";
import { useProjectStore } from "../state/projectStore";
import { CollapsibleSection } from "./CollapsibleSection";
import { CostAnalysis } from "./CostAnalysis";
import { FleetManagementPanel } from "./FleetManagementPanel";
import { PowerFeasibility } from "./PowerFeasibility";
import { ScenarioPanel } from "./ScenarioPanel";
import { SimulationSettings } from "./SimulationSettings";
import { TimelineControl } from "./TimelineControl";
import { RangeControl, Vector3Control } from "./controls";
import { VehiclePresets } from "./VehiclePresets";

const edit = {
  beginEdit: () => useProjectStore.getState().beginEdit(),
  commitEdit: () => useProjectStore.getState().commitEdit(),
  cancelEdit: () => useProjectStore.getState().cancelEdit(),
};

function Inspector() {
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

  return <CollapsibleSection title="Inspector" defaultOpen description="Edit the selected depot or vehicle transform." onBeforeCollapse={edit.commitEdit}>
    {object ? <div className="mt-[22px] grid gap-5" key={object.id}>
      <p className="break-words text-sm font-semibold text-primary">{object.name}</p>
      <Vector3Control label="Position (m)" value={object.transform.position} onChange={(value) => updateTransform("position", value)} edit={edit} />
      <Vector3Control label="Rotation (°)" value={object.transform.rotation.map((angle) => angle * 180 / Math.PI) as Vector3} step={1}
        onChange={(value) => updateTransform("rotation", value.map((angle) => angle * Math.PI / 180) as Vector3)} edit={edit} />
      <Vector3Control label="Scale" value={object.transform.scale} min={0.01} onChange={(value) => updateTransform("scale", value)} edit={edit} />
    </div> : <p className="mb-4 text-[0.76rem] leading-relaxed text-secondary">No object selected. Click the depot or a vehicle in the viewport.</p>}
  </CollapsibleSection>;
}

function SceneModule({ onResetCamera }: { onResetCamera: () => void }) {
  const light = useProjectStore((state) => state.runtime.editor.lightIntensity);
  const setLight = useProjectStore((state) => state.setLightIntensity);
  return <CollapsibleSection title="Scene" onBeforeCollapse={edit.commitEdit}>
    <RangeControl label="Light intensity" value={light} min={0} max={100} unit="%" onChange={setLight} edit={edit} />
    <button type="button" className="mt-6 min-h-12 w-full rounded-lg border border-line-strong bg-transparent px-[15px] text-xs font-bold text-secondary hover:border-[#668078] hover:text-primary"
      onClick={() => { edit.commitEdit(); onResetCamera(); }}>Reset camera</button>
  </CollapsibleSection>;
}

function DebugModule() {
  const document = useProjectStore((state) => state.runtime.document);
  const selection = useProjectStore((state) => state.runtime.editor.selection);
  return <CollapsibleSection title="Debug" description="Read-only canonical Project document." onBeforeCollapse={edit.commitEdit}>
    <p className="mb-4 text-[0.76rem] leading-relaxed text-secondary">Selected object: <code>{selection?.id ?? "none"}</code></p>
    <pre className="max-h-[360px] overflow-auto rounded-lg border border-line bg-surface p-3 text-[0.7rem] leading-relaxed" tabIndex={0} aria-label="Project document">{JSON.stringify(document, null, 2)}</pre>
  </CollapsibleSection>;
}

export function Sidebar({ onResetCamera }: { onResetCamera: () => void }) {
  return <aside className="col-start-3 row-start-1 flex min-h-0 min-w-0 flex-col overflow-y-auto overscroll-contain bg-panel p-7 *:shrink-0 max-[900px]:col-start-1 max-[900px]:row-start-3 max-[560px]:px-5 max-[560px]:py-6" id="controls" aria-labelledby="controls-title" tabIndex={-1}>
    <ScenarioPanel />
    <FleetManagementPanel />
    <TimelineControl />
    <VehiclePresets />
    <SimulationSettings />
    {import.meta.env.DEV && <Inspector />}
    <PowerFeasibility />
    {import.meta.env.DEV && <SceneModule onResetCamera={onResetCamera} />}
    <CostAnalysis />
    {import.meta.env.DEV && <DebugModule />}
  </aside>;
}
