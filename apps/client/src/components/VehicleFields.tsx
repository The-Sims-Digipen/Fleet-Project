import type { ProjectDocument, ProjectVehicle } from "../domain/project";
import { useProjectStore } from "../state/projectStore";
import { NumberControl, TextControl } from "./controls";
import { projectEditLifecycle } from "./projectEditLifecycle";

const fieldClass = "min-h-9 w-full min-w-0 rounded border border-line-strong bg-panel px-2 text-xs font-medium text-primary focus:border-accent";
const labelClass = "grid gap-1 text-[11px] font-semibold text-secondary";

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex min-h-9 items-center gap-2 text-xs text-secondary">
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    {label}
  </label>;
}

export function VehicleFields({ vehicle, document, idPrefix, section = "all" }: {
  vehicle: ProjectVehicle;
  document: ProjectDocument;
  idPrefix: string;
  section?: "summary" | "details" | "all";
}) {
  const { analysis, vehiclePresets } = document;
  const years = Array.from({ length: analysis.yearCount }, (_, index) => analysis.startYear + index);
  const updateVehicle = (patch: Partial<ProjectVehicle>) => useProjectStore.getState().updateVehicle(vehicle.id, patch);
  const updateDiscrete = (patch: Partial<ProjectVehicle>) => {
    projectEditLifecycle.commitEdit();
    updateVehicle(patch);
  };
  const holding = vehicle.currentHolding;
  const showSummary = section !== "details";
  const showDetails = section !== "summary";

  return <>
    {showDetails && <TextControl label="Vehicle name" value={vehicle.name} edit={projectEditLifecycle}
      onChange={(name) => updateVehicle({ name })} />}
    {showSummary && <>
      {section === "summary" && <NumberControl label="Annual distance (km)" value={vehicle.annualKm} min={0} step={100}
        edit={projectEditLifecycle} onChange={(annualKm) => updateVehicle({ annualKm })} />}
      <label className={labelClass} htmlFor={`${idPrefix}-baseline-preset`}>
        Baseline preset
        <select id={`${idPrefix}-baseline-preset`} aria-label={section === "summary" ? `Baseline preset for ${vehicle.id}` : undefined}
          value={vehicle.baselinePresetId ?? ""} onChange={(event) => updateDiscrete({ baselinePresetId: event.target.value || null })}
          className={fieldClass}>
          <option value="">Generic / no preset</option>
          {vehiclePresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
        </select>
      </label>
      {section === "all" && <NumberControl label="Annual distance (km)" value={vehicle.annualKm} min={0} step={100}
        edit={projectEditLifecycle} onChange={(annualKm) => updateVehicle({ annualKm })} />}
    </>}
    {showDetails && <>
      <div className="grid grid-cols-2 gap-3">
        <NumberControl label="Daily distance (km)" value={vehicle.typicalDailyKm} min={0} step={10} edit={projectEditLifecycle}
          onChange={(typicalDailyKm) => updateVehicle({ typicalDailyKm })} />
        <NumberControl label="Operating days / year" value={vehicle.operatingDays} min={0} step={1} edit={projectEditLifecycle}
          onChange={(operatingDays) => { if (Number.isInteger(operatingDays) && operatingDays <= 366) updateVehicle({ operatingDays }); }} />
        <NumberControl label="Utilisation (%)" value={vehicle.utilisation * 100} min={0} step={1} edit={projectEditLifecycle}
          onChange={(value) => { if (value <= 100) updateVehicle({ utilisation: value / 100 }); }} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass} htmlFor={`${idPrefix}-route-pattern`}>
          Route pattern
          <select id={`${idPrefix}-route-pattern`} value={vehicle.routePattern}
            onChange={(event) => updateDiscrete({ routePattern: event.target.value as ProjectVehicle["routePattern"] })} className={fieldClass}>
            <option value="predictable">Predictable</option>
            <option value="variable">Variable</option>
          </select>
        </label>
        <NumberControl label="Depot dwell (hours)" value={vehicle.depotDwellHours} min={0} step={0.5} edit={projectEditLifecycle}
          onChange={(depotDwellHours) => { if (depotDwellHours <= 24) updateVehicle({ depotDwellHours }); }} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <CheckField label="Returns to depot" checked={vehicle.returnsToDepot}
          onChange={(returnsToDepot) => updateDiscrete({ returnsToDepot })} />
        <CheckField label="External charging access" checked={vehicle.externalChargingAccess}
          onChange={(externalChargingAccess) => updateDiscrete({ externalChargingAccess })} />
      </div>

      <label className={labelClass} htmlFor={`${idPrefix}-replacement-year`}>
        Baseline replacement year
        <select id={`${idPrefix}-replacement-year`} value={vehicle.replacementYear ?? ""}
          onChange={(event) => updateDiscrete({ replacementYear: event.target.value ? Number(event.target.value) : null })} className={fieldClass}>
          <option value="">No planned replacement</option>
          {vehicle.replacementYear !== null && !years.includes(vehicle.replacementYear)
            && <option value={vehicle.replacementYear}>{vehicle.replacementYear} · outside period</option>}
          {years.map((year) => <option key={year} value={year}>{year}</option>)}
        </select>
      </label>
      <label className={labelClass} htmlFor={`${idPrefix}-current-ownership`}>
        Current ownership
        <select id={`${idPrefix}-current-ownership`} value={holding.kind} onChange={(event) => {
          const currentHolding = event.target.value === "leased"
            ? { kind: "leased" as const, annualPayment: 0, exitFee: 0 }
            : { kind: "owned" as const, currentValue: 0, endResidualValue: 0 };
          updateDiscrete({ currentHolding });
        }} className={fieldClass}>
          <option value="owned">Owned</option>
          <option value="leased">Leased</option>
        </select>
      </label>
      {holding.kind === "owned" ? <div className="grid grid-cols-2 gap-3">
        <NumberControl label="Current value" value={holding.currentValue} min={0} step={100} edit={projectEditLifecycle}
          onChange={(currentValue) => updateVehicle({ currentHolding: { ...holding, currentValue } })} />
        <NumberControl label="End residual value" value={holding.endResidualValue} min={0} step={100} edit={projectEditLifecycle}
          onChange={(endResidualValue) => updateVehicle({ currentHolding: { ...holding, endResidualValue } })} />
      </div> : <div className="grid grid-cols-2 gap-3">
        <NumberControl label="Annual lease payment" value={holding.annualPayment} min={0} step={100} edit={projectEditLifecycle}
          onChange={(annualPayment) => updateVehicle({ currentHolding: { ...holding, annualPayment } })} />
        <NumberControl label="Lease exit fee" value={holding.exitFee} min={0} step={100} edit={projectEditLifecycle}
          onChange={(exitFee) => updateVehicle({ currentHolding: { ...holding, exitFee } })} />
      </div>}
    </>}
  </>;
}
