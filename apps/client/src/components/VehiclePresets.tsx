import { useState } from "react";

import { deleteVehiclePreset, presetDeletionImpact } from "../domain/fleetCommands";
import { placeVehicleFromPreset } from "../state/fleetStore";
import { describePresetReference } from "../domain/references";
import { vehicleModelEntries } from "../scene/catalog";
import { usePresetStore } from "../state/presetStore";
import { useSceneStore } from "../state/sceneStore";
import { ownershipKinds, propulsions, type PresetNumericField, type Propulsion, type VehiclePreset } from "../vehicles/types";
import { CollapsibleSection } from "./CollapsibleSection";
import { NumberControl, SelectControl, TextControl } from "./controls";

const edit = {
  beginEdit: () => usePresetStore.getState().beginEdit(),
  commitEdit: () => usePresetStore.getState().commitEdit(),
  cancelEdit: () => usePresetStore.getState().cancelEdit(),
};

const propulsionOptions = propulsions.map((value) => ({ value, label: `${value[0].toUpperCase()}${value.slice(1)}` }));
const modelOptions = vehicleModelEntries.map(([value, definition]) => ({ value, label: definition.name }));
const ownershipOptions = ownershipKinds.map((value) => ({ value, label: value === "owned" ? "Owned" : "Leased" }));

const energyFields: { field: PresetNumericField; label: string; step?: number }[] = [
  { field: "litresPer100Km", label: "Fuel use (L/100 km)" },
  { field: "kWhPer100Km", label: "Electric use (kWh/100 km)" },
  { field: "batteryCapacityKWh", label: "Battery (kWh)" },
  { field: "chargingPowerKW", label: "Charging power (kW)" },
];

const actionClass = "min-h-8 rounded border border-line-strong px-2.5 text-xs font-semibold text-secondary enabled:hover:bg-white/5 enabled:hover:text-primary disabled:cursor-default disabled:opacity-40";
const wideActionClass = "min-h-12 rounded-lg border border-line-strong bg-transparent px-[15px] text-xs font-bold text-secondary transition-colors duration-150 enabled:hover:border-[#668078] enabled:hover:text-primary disabled:cursor-default disabled:opacity-40 motion-reduce:transition-none";

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <fieldset className="m-0 min-w-0 border-0 p-0">
    <legend className="mb-2.5 font-mono text-[0.62rem] font-bold tracking-[0.14em] text-accent uppercase">{title}</legend>
    <div className="grid gap-4">{children}</div>
  </fieldset>;
}

/** Acquisition terms carry different fields per kind, so the form follows the kind. */
function AcquisitionFields({ preset, onChange }: { preset: VehiclePreset; onChange: (acquisition: VehiclePreset["acquisition"]) => void }) {
  const { acquisition } = preset;
  return <>
    <SelectControl label="Acquisition" value={acquisition.kind} options={ownershipOptions}
      onChange={(kind) => {
        edit.commitEdit();
        onChange(kind === "owned" ? { kind: "owned", endResidualValue: 0 } : { kind: "leased", annualPayment: 0, exitFee: 0 });
      }} />
    {acquisition.kind === "owned"
      ? <NumberControl label="Residual value at end of analysis" value={acquisition.endResidualValue} min={0} step={100} edit={edit}
        onChange={(endResidualValue) => onChange({ kind: "owned", endResidualValue })} />
      : <div className="grid grid-cols-2 gap-4">
        <NumberControl label="Lease payment (per year)" value={acquisition.annualPayment} min={0} step={100} edit={edit}
          onChange={(annualPayment) => onChange({ ...acquisition, annualPayment })} />
        <NumberControl label="Lease exit fee" value={acquisition.exitFee} min={0} step={100} edit={edit}
          onChange={(exitFee) => onChange({ ...acquisition, exitFee })} />
      </div>}
  </>;
}

export function VehiclePresets() {
  const presets = usePresetStore((state) => state.presets);
  const selectedId = usePresetStore((state) => state.selectedPresetId);
  const updatePreset = usePresetStore((state) => state.updatePreset);
  const preset = presets.find((item) => item.id === selectedId);
  const instanceCount = useSceneStore((state) => state.document.objects.reduce((total, object) => total + (object.presetId === selectedId ? 1 : 0), 0));

  const [notice, setNotice] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  // T03 refuses to delete a preset the fleet or a scenario still points at.
  const blockedBy = confirming ? presetDeletionImpact(confirming) : [];

  const requestDelete = () => {
    if (!selectedId || !preset) return;
    setNotice(null);
    const references = presetDeletionImpact(selectedId);
    if (references.length || instanceCount) setConfirming(selectedId);
    else removeSelected();
  };

  const removeSelected = () => {
    if (!selectedId) return;
    // Routed through T03 so the reference guard applies however deletion starts.
    const result = deleteVehiclePreset(selectedId);
    setConfirming(result.ok ? null : selectedId);
    if (result.ok) setNotice(instanceCount ? `Preset deleted. ${instanceCount} placed ${instanceCount === 1 ? "object keeps" : "objects keep"} its geometry.` : null);
  };

  return <CollapsibleSection title="Vehicle Presets" defaultOpen description="Reusable vehicle types. Each preset chooses the 3D model its instances render with." onBeforeCollapse={edit.commitEdit}>
    <div className="overflow-hidden rounded border border-line-strong bg-control">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line-strong px-2 py-1.5">
        <button type="button" aria-label="New vehicle preset" className={actionClass} onClick={() => { setConfirming(null); usePresetStore.getState().createPreset(); }}>New</button>
        <button type="button" aria-label="Duplicate vehicle preset" className={actionClass} disabled={!preset} onClick={() => { if (selectedId) usePresetStore.getState().duplicatePreset(selectedId); }}>Duplicate</button>
        <button type="button" aria-label="Delete vehicle preset" className={actionClass} disabled={!preset} onClick={requestDelete}>Delete</button>
        <span className="ml-auto text-xs text-secondary">{presets.length}</span>
      </div>

      <div className="h-44 overflow-y-auto overscroll-contain p-1">
        {presets.length ? <ul aria-label="Vehicle presets" className="m-0 list-none p-0">
          {presets.map((item) => <li key={item.id}>
            <button type="button" aria-label={`Select ${item.name}`} aria-pressed={item.id === selectedId}
              className="flex h-9 w-full items-center gap-2 rounded-sm px-2 text-left text-xs text-secondary hover:bg-white/5 aria-pressed:bg-accent/15 aria-pressed:text-primary"
              onClick={() => { setConfirming(null); usePresetStore.getState().selectPreset(item.id); }}>
              <span aria-hidden="true" className="shrink-0 text-accent">◇</span>
              <span className="min-w-0 flex-1 truncate" title={item.name}>{item.name}</span>
              <span className="shrink-0 font-mono text-[10px] opacity-60">{item.category}</span>
            </button>
          </li>)}
        </ul> : <p className="px-2 py-4 text-xs text-secondary">No presets. Click New to create one.</p>}
      </div>
    </div>

    {confirming && preset && <div role="alert" className="mt-3 rounded border border-line-strong bg-[#241a12] p-3 text-xs text-secondary">
      {blockedBy.length ? <>
        <p className="mb-2">
          <b className="text-primary">{preset.name}</b> is still in use and cannot be deleted. Reassign or clear these first:
        </p>
        <ul className="mb-2.5 list-disc pl-4">
          {blockedBy.map((reference) => <li key={describePresetReference(reference)}>{describePresetReference(reference)}</li>)}
        </ul>
        <button type="button" className={actionClass} onClick={() => setConfirming(null)}>Close</button>
      </> : <>
        <p className="mb-2.5">Delete <b className="text-primary">{preset.name}</b>? {instanceCount} placed {instanceCount === 1 ? "object" : "objects"} will keep rendering with the same geometry but lose the preset link.</p>
        <span className="flex gap-2">
          <button type="button" className={actionClass} onClick={removeSelected}>Delete preset</button>
          <button type="button" className={actionClass} onClick={() => setConfirming(null)}>Cancel</button>
        </span>
      </>}
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
          {energyFields.map(({ field, label, step }) =>
            <NumberControl key={field} label={label} value={preset[field]} min={0} step={step} edit={edit} onChange={(value) => updatePreset(preset.id, { [field]: value })} />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <NumberControl label="Range (km, 0 for none)" value={preset.rangeKm ?? 0} min={0} step={10} edit={edit}
            onChange={(rangeKm) => updatePreset(preset.id, { rangeKm: rangeKm > 0 ? rangeKm : null })} />
          <NumberControl label="Charging efficiency (0-1)" value={preset.chargingEfficiency} min={0.01} step={0.01} edit={edit}
            onChange={(chargingEfficiency) => updatePreset(preset.id, { chargingEfficiency })} />
        </div>
        <p className="text-xs text-secondary">Range 0 means range is not a planning constraint for this preset. Charging efficiency divides supplied energy, so 1 means no charging losses.</p>
      </FieldGroup>

      <FieldGroup title="Economics">
        <div className="grid grid-cols-2 gap-4">
          <NumberControl label="Purchase price" value={preset.purchaseCost} min={0} step={100} edit={edit} onChange={(purchaseCost) => updatePreset(preset.id, { purchaseCost })} />
          <NumberControl label="Maintenance (per year)" value={preset.maintenanceCostPerYear} min={0} step={50} edit={edit} onChange={(maintenanceCostPerYear) => updatePreset(preset.id, { maintenanceCostPerYear })} />
        </div>
        <AcquisitionFields preset={preset} onChange={(acquisition) => updatePreset(preset.id, { acquisition })} />
      </FieldGroup>

      <FieldGroup title="Appearance">
        <SelectControl label="3D model" value={preset.modelId} options={modelOptions}
          onChange={(modelId) => { edit.commitEdit(); updatePreset(preset.id, { modelId }); }} />
        <p className="text-xs text-secondary">
          {modelOptions.length === 1 ? "One model is registered so far; more become selectable as they are added to the catalog." : "Changing the model updates every placed instance of this preset."}
        </p>
      </FieldGroup>

      <button type="button" className={wideActionClass} onClick={() => {
        edit.commitEdit();
        setNotice(placeVehicleFromPreset(preset) ? `Placed a ${preset.name} in this depot.` : "This preset has no usable 3D model.");
      }}>
        Place in depot
      </button>
      <p className="text-xs text-secondary">
        {instanceCount} {instanceCount === 1 ? "vehicle in this depot uses" : "vehicles in this depot use"} this preset.
        A preset is a reusable type shared by every depot; placing one adds a real vehicle to the depot you are editing.
      </p>
    </div> : <p className="mt-4 text-[0.76rem] leading-relaxed text-secondary">No preset selected. Choose one above to edit its attributes.</p>}
  </CollapsibleSection>;
}
