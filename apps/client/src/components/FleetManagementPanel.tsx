import { useState } from "react";

import { PROJECT_FLEET_CAPACITY } from "../domain/depotLayout";
import { effectivePresetIdFor } from "../domain/project";
import { useProjectStore } from "../state/projectStore";
import { CollapsibleSection } from "./CollapsibleSection";
import { projectEditLifecycle } from "./projectEditLifecycle";
import { VehicleFields } from "./VehicleFields";

const actionClass = "min-h-8 rounded border border-line-strong px-2.5 text-xs font-semibold text-secondary enabled:hover:bg-white/5 enabled:hover:text-primary disabled:cursor-default disabled:opacity-40";
const fieldClass = "min-h-9 w-full min-w-0 rounded border border-line-strong bg-panel px-2 text-xs font-medium text-primary focus:border-accent disabled:cursor-default disabled:opacity-50";
const labelClass = "grid gap-1 text-[11px] font-semibold text-secondary";
const edit = projectEditLifecycle;

export function FleetManagementPanel() {
  const document = useProjectStore((state) => state.runtime.document);
  const selectedYear = useProjectStore((state) => state.runtime.editor.plan.selectedYear);
  const selection = useProjectStore((state) => state.runtime.editor.selection);
  const { vehicles } = document.environment;
  const { analysis, vehiclePresets: presets, scenarios, activeScenarioId } = document;
  const scenario = scenarios.find((item) => item.id === activeScenarioId) ?? scenarios[0];
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [expandedVehicleId, setExpandedVehicleId] = useState<string | null>(null);

  const years = Array.from({ length: analysis.yearCount }, (_, index) => analysis.startYear + index);
  const confirming = vehicles.find((vehicle) => vehicle.id === confirmingId);
  const affectedPlans = confirmingId
    ? scenarios.filter((entry) => entry.vehiclePlans[confirmingId]).map((entry) => entry.name)
    : [];

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

            <VehicleFields vehicle={vehicle} document={document} idPrefix={`fleet-${vehicle.id}`} section="summary" />

            <button type="button" className={`${actionClass} justify-self-start`} aria-expanded={expandedVehicleId === vehicle.id}
              aria-controls={`fleet-vehicle-inputs-${vehicle.id}`}
              onClick={() => { edit.commitEdit(); setExpandedVehicleId(expandedVehicleId === vehicle.id ? null : vehicle.id); }}>
              {expandedVehicleId === vehicle.id ? "Hide vehicle inputs" : "Edit vehicle inputs"}
            </button>

            {expandedVehicleId === vehicle.id && <div id={`fleet-vehicle-inputs-${vehicle.id}`} className="grid gap-3 rounded border border-line bg-panel p-3">
              <VehicleFields vehicle={vehicle} document={document} idPrefix={`fleet-${vehicle.id}`} section="details" />
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
