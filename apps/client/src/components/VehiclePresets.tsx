import { useRef, useState } from "react";

import { objectDefinitions } from "../scene/catalog";
import { usePresetStore } from "../state/presetStore";
import { useSceneStore } from "../state/sceneStore";
import { propulsions, type PresetNumericField, type Propulsion } from "../vehicles/types";
import { CollapsibleSection } from "./CollapsibleSection";
import { NumberControl, SelectControl, TextControl } from "./controls";

const edit = {
  beginEdit: () => usePresetStore.getState().beginEdit(),
  commitEdit: () => usePresetStore.getState().commitEdit(),
  cancelEdit: () => usePresetStore.getState().cancelEdit(),
};

const propulsionOptions = propulsions.map((value) => ({ value, label: `${value[0].toUpperCase()}${value.slice(1)}` }));
const modelOptions = Object.entries(objectDefinitions).map(([value, definition]) => ({ value, label: definition.name }));

const numericFields: { field: PresetNumericField; label: string; step?: number }[] = [
  { field: "litresPer100Km", label: "Fuel use (L/100 km)" },
  { field: "kWhPer100Km", label: "Electric use (kWh/100 km)" },
  { field: "batteryCapacityKWh", label: "Battery (kWh)" },
  { field: "chargingPowerKW", label: "Charging power (kW)" },
  { field: "purchaseCost", label: "Purchase price", step: 100 },
];

const actionClass = "min-h-8 rounded border border-line-strong px-2.5 text-xs font-semibold text-secondary enabled:hover:bg-white/5 enabled:hover:text-primary disabled:cursor-default disabled:opacity-40";
const wideActionClass = "min-h-12 rounded-lg border border-line-strong bg-transparent px-[15px] text-xs font-bold text-secondary transition-colors duration-150 enabled:hover:border-[#668078] enabled:hover:text-primary disabled:cursor-default disabled:opacity-40 motion-reduce:transition-none";

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <fieldset className="m-0 min-w-0 border-0 p-0">
    <legend className="mb-2.5 font-mono text-[0.62rem] font-bold tracking-[0.14em] text-accent uppercase">{title}</legend>
    <div className="grid gap-4">{children}</div>
  </fieldset>;
}

export function VehiclePresets() {
  const presets = usePresetStore((state) => state.presets);
  const selectedId = usePresetStore((state) => state.selectedPresetId);
  const updatePreset = usePresetStore((state) => state.updatePreset);
  const preset = presets.find((item) => item.id === selectedId);
  const instanceCount = useSceneStore((state) => state.document.objects.reduce((total, object) => total + (object.presetId === selectedId ? 1 : 0), 0));

  const fileInput = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const removeSelected = () => {
    if (!selectedId) return;
    usePresetStore.getState().deletePreset(selectedId);
    setConfirmingDelete(false);
    setNotice(instanceCount ? `Preset deleted. ${instanceCount} placed ${instanceCount === 1 ? "object keeps" : "objects keep"} its geometry.` : null);
  };

  function exportLibrary() {
    edit.commitEdit();
    const blob = new Blob([usePresetStore.getState().exportPresets()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vehicle-presets.json";
    link.click();
    URL.revokeObjectURL(url);
    setNotice(`Exported ${presets.length} presets.`);
  }

  async function importLibrary(file: File) {
    const result = usePresetStore.getState().importPresets(await file.text());
    setNotice(result.ok ? `Imported ${result.count} presets.` : result.error);
  }

  return <CollapsibleSection title="Vehicle Presets" defaultOpen description="Reusable vehicle types. Each preset chooses the 3D model its instances render with." onBeforeCollapse={edit.commitEdit}>
    <div className="overflow-hidden rounded border border-line-strong bg-control">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line-strong px-2 py-1.5">
        <button type="button" className={actionClass} onClick={() => { setConfirmingDelete(false); usePresetStore.getState().createPreset(); }}>New</button>
        <button type="button" className={actionClass} disabled={!preset} onClick={() => { if (selectedId) usePresetStore.getState().duplicatePreset(selectedId); }}>Duplicate</button>
        <button type="button" className={actionClass} disabled={!preset} onClick={() => { if (instanceCount) setConfirmingDelete(true); else removeSelected(); }}>Delete</button>
        <span className="ml-auto text-xs text-secondary">{presets.length}</span>
      </div>

      <div className="h-44 overflow-y-auto overscroll-contain p-1">
        {presets.length ? <ul aria-label="Vehicle presets" className="m-0 list-none p-0">
          {presets.map((item) => <li key={item.id}>
            <button type="button" aria-label={`Select ${item.name}`} aria-pressed={item.id === selectedId}
              className="flex h-9 w-full items-center gap-2 rounded-sm px-2 text-left text-xs text-secondary hover:bg-white/5 aria-pressed:bg-accent/15 aria-pressed:text-primary"
              onClick={() => { setConfirmingDelete(false); usePresetStore.getState().selectPreset(item.id); }}>
              <span aria-hidden="true" className="shrink-0 text-accent">◇</span>
              <span className="min-w-0 flex-1 truncate" title={item.name}>{item.name}</span>
              <span className="shrink-0 font-mono text-[10px] opacity-60">{item.category}</span>
            </button>
          </li>)}
        </ul> : <p className="px-2 py-4 text-xs text-secondary">No presets. Click New or import a library.</p>}
      </div>

      <div className="flex items-center justify-between gap-1.5 border-t border-line-strong px-2 py-1">
        <span className="text-[11px] text-secondary">{presets.length} {presets.length === 1 ? "preset" : "presets"}</span>
        <span className="flex gap-1.5">
          <button type="button" className={actionClass} onClick={() => { edit.commitEdit(); fileInput.current?.click(); }}>Import</button>
          <button type="button" className={actionClass} disabled={!presets.length} onClick={exportLibrary}>Export</button>
        </span>
      </div>
    </div>

    <input ref={fileInput} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden="true"
      onChange={(event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (file) void importLibrary(file);
      }} />

    {confirmingDelete && preset && <div role="alert" className="mt-3 rounded border border-line-strong bg-[#241a12] p-3 text-xs text-secondary">
      <p className="mb-2.5">Delete <b className="text-primary">{preset.name}</b>? {instanceCount} placed {instanceCount === 1 ? "object" : "objects"} will keep rendering with the same geometry but lose the preset link.</p>
      <span className="flex gap-2">
        <button type="button" className={actionClass} onClick={removeSelected}>Delete preset</button>
        <button type="button" className={actionClass} onClick={() => setConfirmingDelete(false)}>Cancel</button>
      </span>
    </div>}

    {notice && <p role="status" className="mt-3 text-xs text-secondary">{notice}</p>}

    {preset ? <div className="mt-[22px] grid gap-5" key={preset.id}>
      <FieldGroup title="Identity">
        <TextControl label="Preset name" value={preset.name} edit={edit} onChange={(name) => updatePreset(preset.id, { name })} />
        <div className="grid grid-cols-2 gap-4">
          <TextControl label="Category" value={preset.category} edit={edit} onChange={(category) => updatePreset(preset.id, { category })} />
          <SelectControl label="Propulsion" value={preset.propulsion} options={propulsionOptions}
            onChange={(propulsion: Propulsion) => { edit.commitEdit(); updatePreset(preset.id, { propulsion }); }} />
        </div>
      </FieldGroup>

      <FieldGroup title="Energy">
        <div className="grid grid-cols-2 gap-4">
          {numericFields.slice(0, 4).map(({ field, label, step }) =>
            <NumberControl key={field} label={label} value={preset[field]} min={0} step={step} edit={edit} onChange={(value) => updatePreset(preset.id, { [field]: value })} />)}
        </div>
      </FieldGroup>

      <FieldGroup title="Economics">
        <NumberControl label="Purchase price" value={preset.purchaseCost} min={0} step={100} edit={edit} onChange={(purchaseCost) => updatePreset(preset.id, { purchaseCost })} />
      </FieldGroup>

      <FieldGroup title="Appearance">
        <SelectControl label="3D model" value={preset.modelId} options={modelOptions}
          onChange={(modelId) => { edit.commitEdit(); updatePreset(preset.id, { modelId }); }} />
        <p className="text-xs text-secondary">
          {modelOptions.length === 1 ? "One model is registered so far; more become selectable as they are added to the catalog." : "Changing the model updates every placed instance of this preset."}
        </p>
      </FieldGroup>

      <button type="button" className={wideActionClass} onClick={() => { edit.commitEdit(); useSceneStore.getState().addObject(preset.modelId, preset.id, preset.name); }}>
        Add to Scene
      </button>
      <p className="text-xs text-secondary">{instanceCount} placed {instanceCount === 1 ? "object uses" : "objects use"} this preset. Presets are project data and are not covered by scene undo.</p>
    </div> : <p className="mt-4 text-[0.76rem] leading-relaxed text-secondary">No preset selected. Choose one above to edit its attributes.</p>}
  </CollapsibleSection>;
}
