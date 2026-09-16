import { usePresetStore } from "../state/presetStore";
import { useFleetStore } from "../state/fleetStore";
import { END_YEAR, START_YEAR, useTimelineStore } from "../state/timelineStore";
import { CollapsibleSection } from "./CollapsibleSection";

const distanceFormatter = new Intl.NumberFormat("en-SG");

export function FleetManagementPanel({ onVisualize, previewOpen, onClosePreview }: {
  onVisualize: () => void;
  previewOpen: boolean;
  onClosePreview: () => void;
}) {
  const vehicles = useFleetStore((state) => state.vehicles);
  const assignPreset = useFleetStore((state) => state.assignPreset);
  const setTransitionYear = useFleetStore((state) => state.setTransitionYear);
  const selectedYear = useTimelineStore((state) => state.selectedYear);
  const presets = usePresetStore((state) => state.presets);

  return <CollapsibleSection title="Fleet Management" defaultOpen description="Sample fleet. Preset choices come from Vehicle Presets; assignments are local to this page for now.">
    <div className="overflow-hidden rounded-lg border border-line-strong bg-control">
      <div className="flex items-center justify-between border-b border-line-strong px-3 py-2">
        <span className="text-xs font-semibold text-primary">Vehicles</span>
        <span className="font-mono text-[11px] text-secondary">{vehicles.length} units</span>
      </div>
      <div className="border-b border-line-strong p-2">
        <button type="button" className="min-h-10 w-full rounded bg-accent px-3 text-xs font-bold text-accent-ink hover:bg-accent/85"
          onClick={() => previewOpen ? onClosePreview() : onVisualize()}>
          {previewOpen ? "Return to scene" : "Visualize fleet in 3D"}
        </button>
      </div>
      <ul aria-label="Fleet vehicles" className="m-0 max-h-[440px] list-none divide-y divide-line overflow-y-auto overscroll-contain p-0">
        {vehicles.map((vehicle) => <li key={vehicle.vehicleId} className="grid gap-2.5 px-3 py-3">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="font-mono text-[10px] font-bold tracking-wider text-accent">{vehicle.vehicleId}</span>
              <p className="truncate text-sm font-semibold text-primary" title={vehicle.vehicleName}>{vehicle.vehicleName}</p>
            </div>
            <span className={`shrink-0 rounded px-2 py-1 font-mono text-[11px] ${vehicle.plannedTransitionYear !== null && selectedYear >= vehicle.plannedTransitionYear ? "bg-[#39ff14]/15 text-[#39ff14]" : "bg-accent/10 text-accent"}`}>
              {vehicle.plannedTransitionYear !== null && selectedYear >= vehicle.plannedTransitionYear ? "Changed" : "Current"}
            </span>
          </div>
          <div className="flex justify-between gap-2 text-xs text-secondary">
            <span>Annual distance</span><span className="font-mono text-primary">{distanceFormatter.format(vehicle.annualDistance)} km</span>
          </div>
          <label className="grid gap-1 text-[11px] font-semibold text-secondary" htmlFor={`fleet-preset-${vehicle.vehicleId}`}>
            Current preset
            <select id={`fleet-preset-${vehicle.vehicleId}`} aria-label={`Current preset for ${vehicle.vehicleId}`} value={presets.some((preset) => preset.id === vehicle.currentPreset) ? vehicle.currentPreset : ""}
              onChange={(event) => assignPreset(vehicle.vehicleId, event.target.value)}
              disabled={!presets.length}
              className="min-h-9 w-full min-w-0 rounded border border-line-strong bg-panel px-2 text-xs font-medium text-primary focus:border-accent disabled:cursor-default disabled:opacity-50">
              {!presets.some((preset) => preset.id === vehicle.currentPreset) && <option value="">{presets.length ? "Select a preset" : "No presets available"}</option>}
              {presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-[11px] font-semibold text-secondary" htmlFor={`fleet-year-${vehicle.vehicleId}`}>
            Year to change
            <select id={`fleet-year-${vehicle.vehicleId}`} aria-label={`Year to change for ${vehicle.vehicleId}`}
              value={vehicle.plannedTransitionYear ?? ""}
              onChange={(event) => setTransitionYear(vehicle.vehicleId, event.target.value ? Number(event.target.value) : null)}
              className="min-h-9 w-full min-w-0 rounded border border-line-strong bg-panel px-2 text-xs font-medium text-primary focus:border-accent">
              <option value="">No change</option>
              {Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, index) => START_YEAR + index).map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>
        </li>)}
      </ul>
    </div>
  </CollapsibleSection>;
}
