import { useState } from "react";

import { PROJECT_FLEET_CAPACITY } from "../domain/depotLayout";
import { effectivePresetIdFor } from "../domain/project";
import { useProjectStore } from "../state/projectStore";
import { CollapsibleSection } from "./CollapsibleSection";
import { NumberControl, TextControl, type EditLifecycle } from "./controls";
import { projectEditLifecycle } from "./projectEditLifecycle";

const actionClass = "min-h-8 rounded border border-line-strong px-2.5 text-xs font-semibold text-secondary enabled:hover:bg-white/5 enabled:hover:text-primary disabled:cursor-default disabled:opacity-40";
const fieldClass = "min-h-9 w-full min-w-0 rounded border border-line-strong bg-panel px-2 text-xs font-medium text-primary focus:border-accent disabled:cursor-default disabled:opacity-50";
const labelClass = "grid gap-1 text-[11px] font-semibold text-secondary";
const edit: EditLifecycle = projectEditLifecycle;

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex min-h-9 items-center gap-2 text-xs text-secondary">
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    {label}
  </label>;
}

export function FleetManagementPanel() {
  const document = useProjectStore((state) => state.runtime.document);
  const selectedYear = useProjectStore((state) => state.runtime.editor.selectedYear);
  const selection = useProjectStore((state) => state.runtime.editor.selection);
  const { vehicles } = document.environment;
  const { analysis, vehiclePresets: presets, scenarios, activeScenarioId } = document;
  const scenario = scenarios.find((item) => item.id === activeScenarioId) ?? scenarios[0];
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [expandedVehicleId, setExpandedVehicleId] = useState<string | null>(null);

  const presetIds = new Set(presets.map((preset) => preset.id));
  const years = Array.from({ length: analysis.yearCount }, (_, index) => analysis.startYear + index);
  const confirming = vehicles.find((vehicle) => vehicle.id === confirmingId);
  const affectedPlans = confirmingId
    ? scenarios.filter((entry) => entry.vehiclePlans[confirmingId]).map((entry) => entry.name)
    : [];

  const updateVehicle = (id: string, patch: Parameters<ReturnType<typeof useProjectStore.getState>["updateVehicle"]>[1]) => {
    useProjectStore.getState().updateVehicle(id, patch);
  };
  const updateDiscreteField = (id: string, patch: Parameters<ReturnType<typeof useProjectStore.getState>["updateVehicle"]>[1]) => {
    edit.commitEdit();
    updateVehicle(id, patch);
  };
  const setTransition = (vehicleId: string, targetPresetId: string | null, year: number | null) => {
    if (!scenario) return;
    edit.commitEdit();
    const current = scenario.vehiclePlans[vehicleId]?.transitions ?? [];
    const remaining = current.slice(1);
    useProjectStore.getState().replaceVehicleTransitions(
      scenario.id,
      vehicleId,
      targetPresetId && year !== null ? [...remaining, { targetPresetId, year }] : remaining,
    );
  };

  const removeVehicle = (id: string, name: string) => {
    edit.commitEdit();
    useProjectStore.getState().deleteVehicle(id);
    setConfirmingId(null);
    setNotice(`Deleted ${name}.`);
  };

  return <CollapsibleSection panelId="fleet" title="Fleet Management" description="Edit Project-owned Vehicles and the active Scenario's transition plan." onBeforeCollapse={edit.commitEdit}>
    <div className="overflow-hidden rounded-lg border border-line-strong bg-control">
      <div className="flex items-center justify-between border-b border-line-strong px-3 py-2">
        <span className="text-xs font-semibold text-primary">Vehicles · {scenario?.name ?? "No scenario"}</span>
        <span className="font-mono text-[11px] text-secondary">{vehicles.length} units</span>
      </div>
      <div className="grid gap-2 border-b border-line-strong p-2">
        <p className="px-1 text-[11px] text-secondary">Vehicles own their world transforms. Capacity: {vehicles.length}/{PROJECT_FLEET_CAPACITY}.</p>
        <button type="button" className={actionClass} disabled={vehicles.length >= PROJECT_FLEET_CAPACITY}
          onClick={() => {
            edit.commitEdit();
            const id = useProjectStore.getState().createVehicle();
            setNotice(id ? "Added a vehicle at the first available world position." : "The fleet has used every default spawn position.");
          }}>Add vehicle</button>
      </div>

      {notice && <p role="status" className="border-b border-line-strong px-3 py-2 text-[11px] text-secondary">{notice}</p>}

      {confirming && <div role="alert" className="border-b border-line-strong bg-[#241a12] px-3 py-3 text-xs text-secondary">
        <p className="mb-2.5">Delete <b className="text-primary">{confirming.name}</b>?{affectedPlans.length
          ? ` Its transition plan will also be removed from: ${affectedPlans.join(", ")}.`
          : " No scenario plans reference it."}</p>
        <span className="flex gap-2">
          <button type="button" className={actionClass} onClick={() => removeVehicle(confirming.id, confirming.name)}>Delete vehicle</button>
          <button type="button" className={actionClass} onClick={() => setConfirmingId(null)}>Cancel</button>
        </span>
      </div>}

      {vehicles.length ? <ul aria-label="Fleet vehicles" className="m-0 max-h-[650px] list-none divide-y divide-line overflow-y-auto overscroll-contain p-0">
        {vehicles.map((vehicle) => {
          const transitions = scenario?.vehiclePlans[vehicle.id]?.transitions ?? [];
          const transition = transitions[0];
          const effectivePresetId = scenario ? effectivePresetIdFor(document, scenario.id, vehicle.id, selectedYear) : vehicle.baselinePresetId;
          const transitioned = effectivePresetId !== vehicle.baselinePresetId;
          const isSelected = selection?.kind === "vehicle" && selection.id === vehicle.id;
          const holding = vehicle.currentHolding;
          return <li key={vehicle.id} className="grid gap-3 px-3 py-3">
            <div className="flex min-w-0 items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <button type="button" aria-label={`Select ${vehicle.name} in viewport`} aria-pressed={isSelected}
                  className="truncate text-left text-sm font-semibold text-primary underline-offset-2 hover:text-accent hover:underline aria-pressed:text-accent"
                  onClick={() => { edit.commitEdit(); useProjectStore.getState().selectProjectEntity({ kind: "vehicle", id: vehicle.id }); }}>
                  {vehicle.name}
                </button>
                <span className="mt-0.5 block font-mono text-[10px] font-bold tracking-wider text-accent">{vehicle.id}</span>
                <p className="text-[11px] text-secondary">Position {vehicle.transform.position.map((value) => value.toFixed(1)).join(", ")}</p>
              </div>
              <span className={`shrink-0 rounded px-2 py-1 font-mono text-[11px] ${transitioned ? "bg-[#39ff14]/15 text-[#39ff14]" : "bg-accent/10 text-accent"}`}>
                {transitioned ? "Changed" : "Current"}
              </span>
            </div>

            <NumberControl label="Annual distance (km)" value={vehicle.annualKm} min={0} step={100} edit={edit} onChange={(annualKm) => updateVehicle(vehicle.id, { annualKm })} />
            <label className={labelClass} htmlFor={`fleet-preset-${vehicle.id}`}>
              Baseline preset
              <select id={`fleet-preset-${vehicle.id}`} aria-label={`Baseline preset for ${vehicle.id}`} value={vehicle.baselinePresetId && presetIds.has(vehicle.baselinePresetId) ? vehicle.baselinePresetId : ""}
                onChange={(event) => updateDiscreteField(vehicle.id, { baselinePresetId: event.target.value || null })} className={fieldClass}>
                <option value="">Generic / no preset</option>
                {presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
              </select>
            </label>

            <button type="button" className={`${actionClass} justify-self-start`} aria-expanded={expandedVehicleId === vehicle.id}
              aria-controls={`fleet-vehicle-inputs-${vehicle.id}`}
              onClick={() => { edit.commitEdit(); setExpandedVehicleId(expandedVehicleId === vehicle.id ? null : vehicle.id); }}>
              {expandedVehicleId === vehicle.id ? "Hide vehicle inputs" : "Edit vehicle inputs"}
            </button>

            {expandedVehicleId === vehicle.id && <div id={`fleet-vehicle-inputs-${vehicle.id}`} className="grid gap-3 rounded border border-line bg-panel p-3">
              <TextControl label="Vehicle name" value={vehicle.name} edit={edit} onChange={(name) => updateVehicle(vehicle.id, { name })} />
              <div className="grid grid-cols-2 gap-3">
                <NumberControl label="Daily distance (km)" value={vehicle.typicalDailyKm} min={0} step={10} edit={edit} onChange={(typicalDailyKm) => updateVehicle(vehicle.id, { typicalDailyKm })} />
                <NumberControl label="Operating days / year" value={vehicle.operatingDays} min={0} step={1} edit={edit} onChange={(operatingDays) => { if (Number.isInteger(operatingDays) && operatingDays <= 366) updateVehicle(vehicle.id, { operatingDays }); }} />
                <NumberControl label="Utilisation (%)" value={vehicle.utilisation * 100} min={0} step={1} edit={edit} onChange={(value) => { if (value <= 100) updateVehicle(vehicle.id, { utilisation: value / 100 }); }} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className={labelClass} htmlFor={`fleet-route-${vehicle.id}`}>
                  Route pattern
                  <select id={`fleet-route-${vehicle.id}`} value={vehicle.routePattern} onChange={(event) => updateDiscreteField(vehicle.id, { routePattern: event.target.value as typeof vehicle.routePattern })} className={fieldClass}>
                    <option value="predictable">Predictable</option>
                    <option value="variable">Variable</option>
                  </select>
                </label>
                <NumberControl label="Depot dwell (hours)" value={vehicle.depotDwellHours} min={0} step={0.5} edit={edit} onChange={(depotDwellHours) => { if (depotDwellHours <= 24) updateVehicle(vehicle.id, { depotDwellHours }); }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <CheckField label="Returns to depot" checked={vehicle.returnsToDepot} onChange={(returnsToDepot) => updateDiscreteField(vehicle.id, { returnsToDepot })} />
                <CheckField label="External charging access" checked={vehicle.externalChargingAccess} onChange={(externalChargingAccess) => updateDiscreteField(vehicle.id, { externalChargingAccess })} />
              </div>

              <label className={labelClass} htmlFor={`fleet-replacement-${vehicle.id}`}>
                Baseline replacement year
                <select id={`fleet-replacement-${vehicle.id}`} value={vehicle.replacementYear ?? ""}
                  onChange={(event) => updateDiscreteField(vehicle.id, { replacementYear: event.target.value ? Number(event.target.value) : null })} className={fieldClass}>
                  <option value="">No planned replacement</option>
                  {vehicle.replacementYear !== null && !years.includes(vehicle.replacementYear) && <option value={vehicle.replacementYear}>{vehicle.replacementYear} · outside period</option>}
                  {years.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </label>

              <label className={labelClass} htmlFor={`fleet-holding-${vehicle.id}`}>
                Current ownership
                <select id={`fleet-holding-${vehicle.id}`} value={holding.kind} onChange={(event) => {
                  const currentHolding = event.target.value === "leased"
                    ? { kind: "leased" as const, annualPayment: 0, exitFee: 0 }
                    : { kind: "owned" as const, currentValue: 0, endResidualValue: 0 };
                  updateDiscreteField(vehicle.id, { currentHolding });
                }} className={fieldClass}>
                  <option value="owned">Owned</option>
                  <option value="leased">Leased</option>
                </select>
              </label>
              {holding.kind === "owned" ? <div className="grid grid-cols-2 gap-3">
                <NumberControl label="Current value" value={holding.currentValue} min={0} step={100} edit={edit} onChange={(currentValue) => updateVehicle(vehicle.id, { currentHolding: { ...holding, currentValue } })} />
                <NumberControl label="End residual value" value={holding.endResidualValue} min={0} step={100} edit={edit} onChange={(endResidualValue) => updateVehicle(vehicle.id, { currentHolding: { ...holding, endResidualValue } })} />
              </div> : <div className="grid grid-cols-2 gap-3">
                <NumberControl label="Annual lease payment" value={holding.annualPayment} min={0} step={100} edit={edit} onChange={(annualPayment) => updateVehicle(vehicle.id, { currentHolding: { ...holding, annualPayment } })} />
                <NumberControl label="Lease exit fee" value={holding.exitFee} min={0} step={100} edit={edit} onChange={(exitFee) => updateVehicle(vehicle.id, { currentHolding: { ...holding, exitFee } })} />
              </div>}
            </div>}

            <div className="border-t border-line pt-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-secondary">Active Scenario transition</p>
              <label className={labelClass} htmlFor={`fleet-target-${vehicle.id}`}>
                Target preset
                <select id={`fleet-target-${vehicle.id}`} aria-label={`Target preset for ${vehicle.id}`} value={transition?.targetPresetId ?? ""}
                  onChange={(event) => setTransition(vehicle.id, event.target.value || null, transition?.year ?? selectedYear)}
                  disabled={!scenario || !presets.length} className={fieldClass}>
                  <option value="">No target</option>
                  {presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
                </select>
              </label>
              <label className={`${labelClass} mt-3`} htmlFor={`fleet-year-${vehicle.id}`}>
                Year to change{transitions.length > 1 ? ` · first of ${transitions.length}` : ""}
                <select id={`fleet-year-${vehicle.id}`} aria-label={`Year to change for ${vehicle.id}`} value={transition?.year ?? ""}
                  onChange={(event) => setTransition(vehicle.id, transition?.targetPresetId ?? null, event.target.value ? Number(event.target.value) : null)}
                  disabled={!scenario || !transition} className={fieldClass}>
                  <option value="">No transition</option>
                  {transition && !years.includes(transition.year) && <option value={transition.year}>{transition.year} · outside period</option>}
                  {years.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </label>
            </div>

            <button type="button" className={`${actionClass} justify-self-start`} aria-label={`Delete ${vehicle.id}`}
              onClick={() => { edit.commitEdit(); setNotice(null); setConfirmingId(vehicle.id); }}>Delete</button>
          </li>;
        })}
      </ul> : <p className="px-3 py-4 text-xs text-secondary">No fleet vehicles yet. Add one to start planning.</p>}
    </div>
  </CollapsibleSection>;
}
