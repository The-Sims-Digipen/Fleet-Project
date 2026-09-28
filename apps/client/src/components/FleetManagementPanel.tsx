import { useState } from "react";

import { PROJECT_FLEET_CAPACITY } from "../domain/depotLayout";
import { effectivePresetIdFor } from "../domain/project";
import { useProjectStore } from "../state/projectStore";
import { CollapsibleSection } from "./CollapsibleSection";

const distanceFormatter = new Intl.NumberFormat("en-SG");
const actionClass = "min-h-8 rounded border border-line-strong px-2.5 text-xs font-semibold text-secondary enabled:hover:bg-white/5 enabled:hover:text-primary disabled:cursor-default disabled:opacity-40";
const fieldClass = "min-h-9 w-full min-w-0 rounded border border-line-strong bg-panel px-2 text-xs font-medium text-primary focus:border-accent disabled:cursor-default disabled:opacity-50";
const labelClass = "grid gap-1 text-[11px] font-semibold text-secondary";

export function FleetManagementPanel() {
  const document = useProjectStore((state) => state.runtime.document);
  const selectedYear = useProjectStore((state) => state.runtime.editor.selectedYear);
  const { vehicles } = document.environment;
  const { analysis, vehiclePresets: presets, scenarios, activeScenarioId } = document;
  const scenario = scenarios.find((item) => item.id === activeScenarioId) ?? scenarios[0];
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const presetIds = new Set(presets.map((preset) => preset.id));
  const years = Array.from({ length: analysis.yearCount }, (_, index) => analysis.startYear + index);
  const confirming = vehicles.find((vehicle) => vehicle.id === confirmingId);
  const affectedPlans = confirmingId
    ? scenarios.filter((entry) => entry.vehiclePlans[confirmingId]).map((entry) => entry.name)
    : [];

  const setTransition = (vehicleId: string, targetPresetId: string | null, year: number | null) => {
    if (!scenario) return;
    useProjectStore.getState().replaceVehicleTransitions(
      scenario.id,
      vehicleId,
      targetPresetId && year !== null ? [{ targetPresetId, year }] : [],
    );
  };

  const removeVehicle = (id: string, name: string) => {
    useProjectStore.getState().deleteVehicle(id);
    setConfirmingId(null);
    setNotice(`Deleted ${name}.`);
  };

  return <CollapsibleSection title="Fleet Management" defaultOpen description="Shared fleet inputs plus transition decisions for the active scenario.">
    <div className="overflow-hidden rounded-lg border border-line-strong bg-control">
      <div className="flex items-center justify-between border-b border-line-strong px-3 py-2">
        <span className="text-xs font-semibold text-primary">Vehicles · {scenario?.name ?? "No scenario"}</span>
        <span className="font-mono text-[11px] text-secondary">{vehicles.length} units</span>
      </div>
      <div className="grid gap-2 border-b border-line-strong p-2">
        <p className="px-1 text-[11px] text-secondary">Every vehicle has an authoritative world transform in this project. Capacity: {vehicles.length}/{PROJECT_FLEET_CAPACITY}.</p>
        <button type="button" className={actionClass} disabled={vehicles.length >= PROJECT_FLEET_CAPACITY}
          onClick={() => {
            const id = useProjectStore.getState().createVehicle();
            setNotice(id ? "Added a vehicle at the first available depot position." : "The depot fleet is at capacity.");
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

      {vehicles.length ? <ul aria-label="Fleet vehicles" className="m-0 max-h-[520px] list-none divide-y divide-line overflow-y-auto overscroll-contain p-0">
        {vehicles.map((vehicle) => {
          const transition = scenario?.vehiclePlans[vehicle.id]?.transitions[0];
          const effectivePresetId = scenario ? effectivePresetIdFor(document, scenario.id, vehicle.id, selectedYear) : vehicle.baselinePresetId;
          const transitioned = effectivePresetId !== vehicle.baselinePresetId;
          return <li key={vehicle.id} className="grid gap-2.5 px-3 py-3">
            <div className="flex min-w-0 items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="font-mono text-[10px] font-bold tracking-wider text-accent">{vehicle.id}</span>
                <p className="truncate text-sm font-semibold text-primary" title={vehicle.name}>{vehicle.name}</p>
                <p className="text-[11px] text-secondary">Position {vehicle.transform.position.map((value) => value.toFixed(1)).join(", ")}</p>
              </div>
              <span className={`shrink-0 rounded px-2 py-1 font-mono text-[11px] ${transitioned ? "bg-[#39ff14]/15 text-[#39ff14]" : "bg-accent/10 text-accent"}`}>
                {transitioned ? "Changed" : "Current"}
              </span>
            </div>
            <label className={labelClass} htmlFor={`fleet-distance-${vehicle.id}`}>
              Annual distance (km) <span className="font-normal text-secondary">· shared</span>
              <input id={`fleet-distance-${vehicle.id}`} aria-label={`Annual distance for ${vehicle.id}`} type="number" min={0} step={100} className={fieldClass}
                value={vehicle.annualKm}
                onChange={(event) => useProjectStore.getState().updateVehicle(vehicle.id, { annualKm: Number(event.target.value) })} />
            </label>
            <div className="flex justify-between gap-2 text-xs text-secondary">
              <span>Daily distance</span><span className="font-mono text-primary">{distanceFormatter.format(vehicle.typicalDailyKm)} km · {vehicle.operatingDays} days</span>
            </div>
            <label className={labelClass} htmlFor={`fleet-preset-${vehicle.id}`}>
              Current preset <span className="font-normal text-secondary">· shared</span>
              <select id={`fleet-preset-${vehicle.id}`} aria-label={`Current preset for ${vehicle.id}`} value={vehicle.baselinePresetId && presetIds.has(vehicle.baselinePresetId) ? vehicle.baselinePresetId : ""}
                onChange={(event) => useProjectStore.getState().updateVehicle(vehicle.id, { baselinePresetId: event.target.value || null })}
                className={fieldClass}>
                <option value="">Generic / no preset</option>
                {presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
              </select>
            </label>
            <label className={labelClass} htmlFor={`fleet-target-${vehicle.id}`}>
              Target preset <span className="font-normal text-secondary">· this scenario</span>
              <select id={`fleet-target-${vehicle.id}`} aria-label={`Target preset for ${vehicle.id}`} value={transition?.targetPresetId ?? ""}
                onChange={(event) => setTransition(vehicle.id, event.target.value || null, transition?.year ?? selectedYear)}
                disabled={!scenario || !presets.length} className={fieldClass}>
                <option value="">No target</option>
                {presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
              </select>
            </label>
            <label className={labelClass} htmlFor={`fleet-year-${vehicle.id}`}>
              Year to change <span className="font-normal text-secondary">· this scenario</span>
              <select id={`fleet-year-${vehicle.id}`} aria-label={`Year to change for ${vehicle.id}`} value={transition?.year ?? ""}
                onChange={(event) => setTransition(vehicle.id, transition?.targetPresetId ?? null, event.target.value ? Number(event.target.value) : null)}
                disabled={!scenario || !transition} className={fieldClass}>
                <option value="">No change</option>
                {years.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </label>
            <button type="button" className={`${actionClass} justify-self-start`} aria-label={`Delete ${vehicle.id}`}
              onClick={() => { setNotice(null); setConfirmingId(vehicle.id); }}>Delete</button>
          </li>;
        })}
      </ul> : <p className="px-3 py-4 text-xs text-secondary">No fleet vehicles yet. Add one to start planning.</p>}
    </div>
  </CollapsibleSection>;
}
