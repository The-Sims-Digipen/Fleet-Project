import { useState } from "react";

import { analysisYears } from "../domain/contracts";
import { effectiveVehicleState } from "../domain/effectiveState";
import { deleteFleetVehicle, vehicleDeletionImpact } from "../domain/fleetCommands";
import { useFleetStore } from "../state/fleetStore";
import { usePresetStore } from "../state/presetStore";
import { useProjectStore } from "../state/projectStore";
import { useTimelineStore } from "../state/timelineStore";
import { CollapsibleSection } from "./CollapsibleSection";
import { NumberControl, SelectControl, TextControl } from "./controls";

const distanceFormatter = new Intl.NumberFormat("en-SG");

const actionClass = "min-h-8 rounded border border-line-strong px-2.5 text-xs font-semibold text-secondary enabled:hover:bg-white/5 enabled:hover:text-primary disabled:cursor-default disabled:opacity-40";
const fieldClass = "min-h-9 w-full min-w-0 rounded border border-line-strong bg-panel px-2 text-xs font-medium text-primary focus:border-accent disabled:cursor-default disabled:opacity-50";
const labelClass = "grid gap-1 text-[11px] font-semibold text-secondary";

const edit = {
  beginEdit: () => useFleetStore.getState().beginEdit(),
  commitEdit: () => useFleetStore.getState().commitEdit(),
  cancelEdit: () => useFleetStore.getState().cancelEdit(),
};

function VehicleFields({ vehicleId }: { vehicleId: string }) {
  const vehicle = useFleetStore((state) => state.vehicles.find((item) => item.id === vehicleId));
  const analysis = useFleetStore((state) => state.analysis);
  const updateVehicle = useFleetStore((state) => state.updateVehicle);
  if (!vehicle) return null;

  const update = (patch: Parameters<typeof updateVehicle>[1]) => updateVehicle(vehicle.id, patch);
  return <div className="grid gap-3 rounded border border-line bg-panel/50 p-3">
    <TextControl label="Vehicle name" value={vehicle.name} edit={edit} onChange={(name) => update({ name })} />
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
    <SelectControl label="Route pattern" value={vehicle.routePattern}
      options={[{ value: "predictable", label: "Predictable" }, { value: "variable", label: "Variable" }]}
      onChange={(routePattern) => { edit.commitEdit(); update({ routePattern }); }} />
    <div className="grid gap-2 text-xs text-secondary">
      <label className="flex min-h-9 items-center gap-2"><input type="checkbox" className="size-4 accent-accent" checked={vehicle.returnsToDepot}
        onChange={(event) => { edit.commitEdit(); update({ returnsToDepot: event.target.checked }); }} />Returns to depot</label>
      <label className="flex min-h-9 items-center gap-2"><input type="checkbox" className="size-4 accent-accent" checked={vehicle.externalChargingAccess}
        onChange={(event) => { edit.commitEdit(); update({ externalChargingAccess: event.target.checked }); }} />Has external charging access</label>
    </div>
    <div className="grid gap-3 border-t border-line pt-3">
      <SelectControl label="Current ownership" value={vehicle.currentHolding.kind}
        options={[{ value: "owned", label: "Owned" }, { value: "leased", label: "Leased" }]}
        onChange={(kind) => {
          edit.commitEdit();
          update({ currentHolding: kind === "owned" ? { kind, currentValue: 0, endResidualValue: 0 } : { kind, annualPayment: 0, exitFee: 0 } });
        }} />
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

export function FleetManagementPanel({ onVisualize, previewOpen, onClosePreview }: {
  onVisualize: () => void;
  previewOpen: boolean;
  onClosePreview: () => void;
}) {
  const vehicles = useFleetStore((state) => state.vehicles);
  const analysis = useFleetStore((state) => state.analysis);
  const updateVehicle = useFleetStore((state) => state.updateVehicle);
  const selectedYear = useTimelineStore((state) => state.selectedYear);
  const presets = usePresetStore((state) => state.presets);
  const scenarios = useProjectStore((state) => state.scenarios);
  const activeScenarioId = useProjectStore((state) => state.activeScenarioId);
  const scenario = scenarios.find((item) => item.id === activeScenarioId) ?? scenarios[0];
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const presetIds = new Set(presets.map((preset) => preset.id));
  const years = analysisYears(analysis);
  const confirming = vehicles.find((vehicle) => vehicle.id === confirmingId);
  // The contract requires deletion to name the scenario plans it will remove.
  const affectedPlans = confirmingId ? vehicleDeletionImpact(confirmingId) : [];

  const removeVehicle = (id: string, name: string) => {
    deleteFleetVehicle(id);
    setConfirmingId(null);
    setNotice(`Deleted ${name}.`);
  };

  return <CollapsibleSection title="Fleet Management" defaultOpen description="Shared fleet inputs plus transition decisions for the active scenario. Target preset and transition year are stored per scenario." onBeforeCollapse={edit.commitEdit}>
    <div className="overflow-hidden rounded-lg border border-line-strong bg-control">
      <div className="flex items-center justify-between border-b border-line-strong px-3 py-2">
        <span className="text-xs font-semibold text-primary">Vehicles · {scenario?.name ?? "No scenario"}</span>
        <span className="font-mono text-[11px] text-secondary">{vehicles.length} units</span>
      </div>
      <div className="grid gap-2 border-b border-line-strong p-2">
        <button type="button" className="min-h-10 w-full rounded bg-accent px-3 text-xs font-bold text-accent-ink hover:bg-accent/85"
          onClick={() => previewOpen ? onClosePreview() : onVisualize()}>
          {previewOpen ? "Return to scene" : "Visualize active plan in 3D"}
        </button>
        <button type="button" className={actionClass} disabled={!presets.length}
          onClick={() => {
            const id = useFleetStore.getState().createVehicle();
            setNotice(id ? "Added a vehicle. Set its distance and preset below." : "Add a vehicle preset before adding a vehicle.");
          }}>Add vehicle</button>
      </div>

      {notice && <p role="status" className="border-b border-line-strong px-3 py-2 text-[11px] text-secondary">{notice}</p>}

      {confirming && <div role="alert" className="border-b border-line-strong bg-[#241a12] px-3 py-3 text-xs text-secondary">
        <p className="mb-2.5">Delete <b className="text-primary">{confirming.name}</b>?{affectedPlans.length
          ? ` ${affectedPlans.length} scenario ${affectedPlans.length === 1 ? "plan loses its" : "plans lose their"} transition entry: ${affectedPlans.map((reference) => reference.scenarioName).join(", ")}.`
          : " No scenario plans reference it."}</p>
        <span className="flex gap-2">
          <button type="button" className={actionClass} onClick={() => removeVehicle(confirming.id, confirming.name)}>Delete vehicle</button>
          <button type="button" className={actionClass} onClick={() => setConfirmingId(null)}>Cancel</button>
        </span>
      </div>}

      {vehicles.length ? <ul aria-label="Fleet vehicles" className="m-0 max-h-[520px] list-none divide-y divide-line overflow-y-auto overscroll-contain p-0">
        {vehicles.map((vehicle) => {
          const plan = scenario?.document.vehiclePlans[vehicle.id];
          const state = effectiveVehicleState(vehicle, plan, presetIds, selectedYear);
          return <li key={vehicle.id} className="grid gap-2.5 px-3 py-3">
            <div className="flex min-w-0 items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="font-mono text-[10px] font-bold tracking-wider text-accent">{vehicle.id}</span>
                <p className="truncate text-sm font-semibold text-primary" title={vehicle.name}>{vehicle.name}</p>
              </div>
              <span className={`shrink-0 rounded px-2 py-1 font-mono text-[11px] ${state.transitioned ? "bg-[#39ff14]/15 text-[#39ff14]" : "bg-accent/10 text-accent"}`}>
                {state.transitioned ? "Changed" : "Current"}
              </span>
            </div>
            <label className={labelClass} htmlFor={`fleet-distance-${vehicle.id}`}>
              Annual distance (km) <span className="font-normal text-secondary">· shared</span>
              <input id={`fleet-distance-${vehicle.id}`} aria-label={`Annual distance for ${vehicle.id}`} type="number" min={0} step={100} className={fieldClass}
                value={vehicle.annualKm}
                onFocus={(event) => { if (vehicle.annualKm === 0) event.currentTarget.select(); }}
                onChange={(event) => updateVehicle(vehicle.id, { annualKm: Number(event.target.value) })} />
            </label>
            <div className="flex justify-between gap-2 text-xs text-secondary">
              <span>Daily distance</span><span className="font-mono text-primary">{distanceFormatter.format(vehicle.typicalDailyKm)} km · {vehicle.operatingDays} days</span>
            </div>
            <label className={labelClass} htmlFor={`fleet-preset-${vehicle.id}`}>
              Current preset <span className="font-normal text-secondary">· shared</span>
              <select id={`fleet-preset-${vehicle.id}`} aria-label={`Current preset for ${vehicle.id}`} value={presetIds.has(vehicle.currentPresetId) ? vehicle.currentPresetId : ""}
                onChange={(event) => updateVehicle(vehicle.id, { currentPresetId: event.target.value })}
                disabled={!presets.length} className={fieldClass}>
                {!presetIds.has(vehicle.currentPresetId) && <option value="">{presets.length ? "Select a preset" : "No presets available"}</option>}
                {presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
              </select>
            </label>
            <label className={labelClass} htmlFor={`fleet-target-${vehicle.id}`}>
              Target preset <span className="font-normal text-secondary">· this scenario</span>
              <select id={`fleet-target-${vehicle.id}`} aria-label={`Target preset for ${vehicle.id}`}
                value={plan?.targetPresetId && presetIds.has(plan.targetPresetId) ? plan.targetPresetId : ""}
                onChange={(event) => scenario && useProjectStore.getState().updateScenarioVehiclePlan(scenario.id, vehicle.id, { targetPresetId: event.target.value || undefined })}
                disabled={!scenario || !presets.length} className={fieldClass}>
                <option value="">No target</option>
                {presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
              </select>
            </label>
            <label className={labelClass} htmlFor={`fleet-year-${vehicle.id}`}>
              Year to change <span className="font-normal text-secondary">· this scenario</span>
              <select id={`fleet-year-${vehicle.id}`} aria-label={`Year to change for ${vehicle.id}`}
                value={plan?.transitionYear ?? ""}
                onChange={(event) => scenario && useProjectStore.getState().updateScenarioVehiclePlan(scenario.id, vehicle.id, { transitionYear: event.target.value ? Number(event.target.value) : null })}
                disabled={!scenario} className={fieldClass}>
                <option value="">No change</option>
                {years.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </label>
            <details>
              <summary className="cursor-pointer py-1 text-xs font-semibold text-secondary hover:text-primary">Edit vehicle information</summary>
              <div className="pt-2"><VehicleFields vehicleId={vehicle.id} /></div>
            </details>
            <button type="button" className={`${actionClass} justify-self-start`} aria-label={`Delete ${vehicle.id}`}
              onClick={() => { setNotice(null); setConfirmingId(vehicle.id); }}>Delete</button>
          </li>;
        })}
      </ul> : <p className="px-3 py-4 text-xs text-secondary">No fleet vehicles yet. Add one to start planning.</p>}
    </div>
  </CollapsibleSection>;
}
