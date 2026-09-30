import { useState } from "react";

import { analysisYears, type ScenarioVehiclePlan } from "../domain/contracts";
import { effectiveVehicleState } from "../domain/effectiveState";
import { deleteFleetVehicle, vehicleDeletionImpact } from "../domain/fleetCommands";
import { useFleetStore } from "../state/fleetStore";
import { usePresetStore } from "../state/presetStore";
import { useProjectStore } from "../state/projectStore";
import { useTimelineStore } from "../state/timelineStore";
import type { VehiclePreset } from "../vehicles/types";
import { CollapsibleSection } from "./CollapsibleSection";
import { NumberControl, SelectControl, TextControl } from "./controls";

const actionClass = "min-h-8 rounded border border-line-strong px-2.5 text-xs font-semibold text-secondary enabled:hover:bg-white/5 enabled:hover:text-primary disabled:cursor-default disabled:opacity-40";
const edit = {
  beginEdit: () => useFleetStore.getState().beginEdit(),
  commitEdit: () => useFleetStore.getState().commitEdit(),
  cancelEdit: () => useFleetStore.getState().cancelEdit(),
};

function VehicleFields({ vehicleId, scenarioId, plan, presets, years }: {
  vehicleId: string;
  scenarioId?: string;
  plan?: ScenarioVehiclePlan;
  presets: VehiclePreset[];
  years: number[];
}) {
  const vehicle = useFleetStore((state) => state.vehicles.find((item) => item.id === vehicleId));
  const analysis = useFleetStore((state) => state.analysis);
  const updateVehicle = useFleetStore((state) => state.updateVehicle);
  if (!vehicle) return null;

  const presetIds = new Set(presets.map((preset) => preset.id));
  const presetOptions = presets.map((preset) => ({ value: preset.id, label: preset.name }));
  const update = (patch: Parameters<typeof updateVehicle>[1]) => updateVehicle(vehicle.id, patch);
  return <div className="grid gap-3 rounded border border-line bg-panel/50 p-3">
    <TextControl label="Vehicle name" value={vehicle.name} edit={edit} onChange={(name) => update({ name })} />
    <SelectControl label="Baseline preset · shared" value={presetIds.has(vehicle.currentPresetId) ? vehicle.currentPresetId : ""} options={presetOptions}
      onChange={(currentPresetId) => { edit.commitEdit(); update({ currentPresetId }); }} />
    <SelectControl label="Target preset · this scenario" value={plan?.targetPresetId && presetIds.has(plan.targetPresetId) ? plan.targetPresetId : ""}
      options={[{ value: "", label: "No target" }, ...presetOptions]}
      onChange={(targetPresetId) => scenarioId && useProjectStore.getState().updateScenarioVehiclePlan(scenarioId, vehicle.id, { targetPresetId: targetPresetId || undefined })} />
    <SelectControl label="Year to change · this scenario" value={plan?.transitionYear == null ? "" : String(plan.transitionYear)}
      options={[{ value: "", label: "No change" }, ...years.map((year) => ({ value: String(year), label: String(year) }))]}
      onChange={(transitionYear) => scenarioId && useProjectStore.getState().updateScenarioVehiclePlan(scenarioId, vehicle.id, { transitionYear: transitionYear ? Number(transitionYear) : null })} />
    <div className="grid grid-cols-2 gap-3">
      <NumberControl label="Annual distance (km)" value={vehicle.annualKm} min={0} step={100} edit={edit} onChange={(annualKm) => update({ annualKm })} />
      <NumberControl label="Typical daily distance (km)" value={vehicle.typicalDailyKm} min={0} step={1} edit={edit} onChange={(typicalDailyKm) => update({ typicalDailyKm })} />
      <NumberControl label="Operating days / year (max 366)" value={vehicle.operatingDays} min={0} step={1} edit={edit} onChange={(operatingDays) => update({ operatingDays })} />
      <NumberControl label="Utilisation (0-1)" value={vehicle.utilisation} min={0} step={0.05} edit={edit} onChange={(utilisation) => update({ utilisation })} />
      <NumberControl label="Depot dwell (hours, max 24)" value={vehicle.depotDwellHours} min={0} step={0.5} edit={edit} onChange={(depotDwellHours) => update({ depotDwellHours })} />
      <SelectControl label="Replacement year" value={vehicle.replacementYear === null ? "" : String(vehicle.replacementYear)}
        options={[{ value: "", label: "Not planned" }, ...analysisYears(analysis).map((year) => ({ value: String(year), label: String(year) }))]}
        onChange={(value) => { edit.commitEdit(); update({ replacementYear: value ? Number(value) : null }); }} />
    </div>
    <SelectControl label="Route pattern" value={vehicle.routePattern} options={[{ value: "predictable", label: "Predictable" }, { value: "variable", label: "Variable" }]}
      onChange={(routePattern) => { edit.commitEdit(); update({ routePattern }); }} />
    <div className="grid gap-2 text-xs text-secondary">
      <label className="flex min-h-9 items-center gap-2"><input type="checkbox" className="size-4 accent-accent" checked={vehicle.returnsToDepot}
        onChange={(event) => { edit.commitEdit(); update({ returnsToDepot: event.target.checked }); }} />Returns to depot</label>
      <label className="flex min-h-9 items-center gap-2"><input type="checkbox" className="size-4 accent-accent" checked={vehicle.externalChargingAccess}
        onChange={(event) => { edit.commitEdit(); update({ externalChargingAccess: event.target.checked }); }} />Has external charging access</label>
    </div>
    <div className="grid gap-3 border-t border-line pt-3">
      <SelectControl label="Current ownership" value={vehicle.currentHolding.kind} options={[{ value: "owned", label: "Owned" }, { value: "leased", label: "Leased" }]}
        onChange={(kind) => { edit.commitEdit(); update({ currentHolding: kind === "owned" ? { kind, currentValue: 0, endResidualValue: 0 } : { kind, annualPayment: 0, exitFee: 0 } }); }} />
      {vehicle.currentHolding.kind === "owned" ? <div className="grid grid-cols-2 gap-3">
        <NumberControl label="Current value" value={vehicle.currentHolding.currentValue} min={0} step={100} edit={edit}
          onChange={(currentValue) => update({ currentHolding: { kind: "owned", currentValue, endResidualValue: vehicle.currentHolding.kind === "owned" ? vehicle.currentHolding.endResidualValue : 0 } })} />
        <NumberControl label="End residual value" value={vehicle.currentHolding.endResidualValue} min={0} step={100} edit={edit}
          onChange={(endResidualValue) => update({ currentHolding: { kind: "owned", currentValue: vehicle.currentHolding.kind === "owned" ? vehicle.currentHolding.currentValue : 0, endResidualValue } })} />
      </div> : <div className="grid grid-cols-2 gap-3">
        <NumberControl label="Annual lease payment" value={vehicle.currentHolding.annualPayment} min={0} step={100} edit={edit}
          onChange={(annualPayment) => update({ currentHolding: { kind: "leased", annualPayment, exitFee: vehicle.currentHolding.kind === "leased" ? vehicle.currentHolding.exitFee : 0 } })} />
        <NumberControl label="Lease exit fee" value={vehicle.currentHolding.exitFee} min={0} step={100} edit={edit}
          onChange={(exitFee) => update({ currentHolding: { kind: "leased", annualPayment: vehicle.currentHolding.kind === "leased" ? vehicle.currentHolding.annualPayment : 0, exitFee } })} />
      </div>}
    </div>
  </div>;
}

export function FleetManagementPanel({ onVisualize, previewOpen, onClosePreview }: { onVisualize: () => void; previewOpen: boolean; onClosePreview: () => void }) {
  const vehicles = useFleetStore((state) => state.vehicles);
  const analysis = useFleetStore((state) => state.analysis);
  const selectedYear = useTimelineStore((state) => state.selectedYear);
  const presets = usePresetStore((state) => state.presets);
  const scenarios = useProjectStore((state) => state.scenarios);
  const activeScenarioId = useProjectStore((state) => state.activeScenarioId);
  const scenario = scenarios.find((item) => item.id === activeScenarioId) ?? scenarios[0];
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(() => vehicles[0]?.id ?? null);
  const presetIds = new Set(presets.map((preset) => preset.id));
  const years = analysisYears(analysis);
  const confirming = vehicles.find((vehicle) => vehicle.id === confirmingId);
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedId);
  const selectedPlan = selectedVehicle ? scenario?.document.vehiclePlans[selectedVehicle.id] : undefined;
  const affectedPlans = confirmingId ? vehicleDeletionImpact(confirmingId) : [];

  const removeVehicle = (id: string, name: string) => {
    deleteFleetVehicle(id);
    setConfirmingId(null);
    if (selectedId === id) setSelectedId(null);
    setNotice(`Deleted ${name}.`);
  };

  return <CollapsibleSection title="Fleet Management" defaultOpen description="Select a vehicle to edit its shared fleet inputs and active-scenario transition plan." onBeforeCollapse={edit.commitEdit}>
    <div className="overflow-hidden rounded-lg border border-line-strong bg-control">
      <div className="flex items-center justify-between border-b border-line-strong px-3 py-2">
        <span className="text-xs font-semibold text-primary">Vehicles · {scenario?.name ?? "No scenario"}</span>
        <span className="font-mono text-[11px] text-secondary">{vehicles.length} units</span>
      </div>
      <div className="grid gap-2 border-b border-line-strong p-2">
        <button type="button" className="min-h-10 w-full rounded bg-accent px-3 text-xs font-bold text-accent-ink hover:bg-accent/85" onClick={() => previewOpen ? onClosePreview() : onVisualize()}>
          {previewOpen ? "Return to scene" : "Visualize active plan in 3D"}
        </button>
        <button type="button" className={actionClass} disabled={!presets.length} onClick={() => {
          const id = useFleetStore.getState().createVehicle();
          if (id) setSelectedId(id);
          setNotice(id ? "Added a vehicle. Set its distance and presets below." : "Add a vehicle preset before adding a vehicle.");
        }}>Add vehicle</button>
      </div>
      {notice && <p role="status" className="border-b border-line-strong px-3 py-2 text-[11px] text-secondary">{notice}</p>}
      {confirming && <div role="alert" className="border-b border-line-strong bg-[#241a12] px-3 py-3 text-xs text-secondary">
        <p className="mb-2.5">Delete <b className="text-primary">{confirming.name}</b>?{affectedPlans.length
          ? ` ${affectedPlans.length} scenario ${affectedPlans.length === 1 ? "plan loses its" : "plans lose their"} transition entry: ${affectedPlans.map((reference) => reference.scenarioName).join(", ")}.`
          : " No scenario plans reference it."}</p>
        <span className="flex gap-2"><button type="button" className={actionClass} onClick={() => removeVehicle(confirming.id, confirming.name)}>Delete vehicle</button>
          <button type="button" className={actionClass} onClick={() => setConfirmingId(null)}>Cancel</button></span>
      </div>}
      {vehicles.length ? <ul aria-label="Fleet vehicles" className="m-0 h-44 list-none overflow-y-auto overscroll-contain p-1">
        {vehicles.map((vehicle) => {
          const state = effectiveVehicleState(vehicle, scenario?.document.vehiclePlans[vehicle.id], presetIds, selectedYear);
          return <li key={vehicle.id}><button type="button" aria-label={`Select ${vehicle.name}`} aria-pressed={vehicle.id === selectedId}
            className="flex h-11 w-full min-w-0 items-center gap-2 rounded-sm px-2 text-left text-xs text-secondary hover:bg-white/5 aria-pressed:bg-accent/15 aria-pressed:text-primary"
            onClick={() => { edit.commitEdit(); setConfirmingId(null); setSelectedId(vehicle.id); }}>
            <span aria-hidden="true" className="shrink-0 text-accent">◇</span>
            <span className="min-w-0 flex-1"><span className="block truncate font-semibold" title={vehicle.name}>{vehicle.name}</span>
              <span className="block truncate font-mono text-[9px] opacity-60">{vehicle.id}</span></span>
            <span className={`shrink-0 rounded px-2 py-1 font-mono text-[11px] ${state.transitioned ? "bg-[#39ff14]/15 text-[#39ff14]" : "bg-accent/10 text-accent"}`}>{state.transitioned ? "Changed" : "Current"}</span>
          </button></li>;
        })}
      </ul> : <p className="px-3 py-4 text-xs text-secondary">No fleet vehicles yet. Add one to start planning.</p>}
    </div>
    {selectedVehicle ? <div className="mt-[22px] grid gap-3" key={selectedVehicle.id}>
      <VehicleFields vehicleId={selectedVehicle.id} scenarioId={scenario?.id} plan={selectedPlan} presets={presets} years={years} />
      <button type="button" className={`${actionClass} justify-self-start`} aria-label={`Delete ${selectedVehicle.id}`} onClick={() => { setNotice(null); setConfirmingId(selectedVehicle.id); }}>Delete</button>
    </div> : <p className="mt-4 text-[0.76rem] leading-relaxed text-secondary">No vehicle selected. Choose one above to edit its fleet and scenario settings.</p>}
  </CollapsibleSection>;
}
