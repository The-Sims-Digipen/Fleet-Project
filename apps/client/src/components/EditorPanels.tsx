import { useId, useRef, useState } from "react";

import { effectivePresetIdFor, type ProjectDocument, type ProjectVehicle, type VehicleTransition } from "../domain/project";
import type { Transform, Vector3 } from "../domain/spatial";
import { useProjectStore } from "../state/projectStore";
import { CollapsibleSection } from "./CollapsibleSection";
import { projectEditLifecycle, projectEditorEditLifecycle } from "./projectEditLifecycle";
import { NumberControl, RangeControl, TextControl, Vector3Control, type EditLifecycle } from "./controls";

const fieldClass = "min-h-9 w-full min-w-0 rounded border border-line-strong bg-panel px-2 text-xs font-medium text-primary focus:border-accent";
const labelClass = "grid gap-1 text-[11px] font-semibold text-secondary";
const actionClass = "min-h-8 rounded border border-line-strong px-2.5 text-xs font-semibold text-secondary enabled:hover:bg-white/5 enabled:hover:text-primary disabled:cursor-default disabled:opacity-40";

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex min-h-9 items-center gap-2 text-xs text-secondary">
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    {label}
  </label>;
}

function TransitionYearControl({ index, value, transitions, onCommit, edit }: {
  index: number;
  value: number;
  transitions: readonly VehicleTransition[];
  onCommit: (year: number) => void;
  edit: EditLifecycle;
}) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const shouldCommitOnBlur = useRef(false);

  const commit = () => {
    if (!shouldCommitOnBlur.current) return;
    shouldCommitOnBlur.current = false;
    if (draft === null) {
      edit.commitEdit();
      return;
    }
    const year = Number(draft);
    if (!draft.trim() || !Number.isSafeInteger(year)) {
      edit.cancelEdit();
      setDraft(null);
      setError("Enter a whole transition year.");
      return;
    }
    if (transitions.some((transition, transitionIndex) => transitionIndex !== index && transition.year === year)) {
      edit.cancelEdit();
      setDraft(null);
      setError("Each Vehicle can have only one transition per year.");
      return;
    }
    onCommit(year);
    edit.commitEdit();
    setDraft(null);
    setError(null);
  };

  return <div className="grid gap-1">
    <label className={labelClass} htmlFor={id}>
      Transition year {index + 1}
      <input id={id} className="min-h-[42px] w-full min-w-0 cursor-text rounded-[7px] border border-line-strong bg-control px-2 py-1.5 text-primary"
        type="number" step={1} value={draft ?? String(value)} aria-invalid={error ? true : undefined}
        onFocus={() => { shouldCommitOnBlur.current = true; edit.beginEdit(); setDraft(String(value)); setError(null); }}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
            event.currentTarget.blur();
          } else if (event.key === "Escape") {
            event.preventDefault();
            shouldCommitOnBlur.current = false;
            edit.cancelEdit();
            setDraft(null);
            setError(null);
            event.currentTarget.blur();
          }
        }} />
    </label>
    {error && <p className="m-0 text-[11px] text-[#ffb4a9]" role="alert">{error}</p>}
  </div>;
}

function BaselineVehicleFields({ vehicle, document }: { vehicle: ProjectVehicle; document: ProjectDocument }) {
  const { analysis, vehiclePresets } = document;
  const years = Array.from({ length: analysis.yearCount }, (_, index) => analysis.startYear + index);
  const updateVehicle = (patch: Partial<ProjectVehicle>) => useProjectStore.getState().updateVehicle(vehicle.id, patch);
  const updateDiscrete = (patch: Partial<ProjectVehicle>) => {
    projectEditLifecycle.commitEdit();
    updateVehicle(patch);
  };
  const holding = vehicle.currentHolding;

  return <fieldset className="grid gap-3 rounded border border-line-strong p-3">
    <legend className="px-1 text-xs font-bold text-primary">Baseline Vehicle fields</legend>
    <TextControl label="Vehicle name" value={vehicle.name} edit={projectEditLifecycle} onChange={(name) => updateVehicle({ name })} />
    <label className={labelClass} htmlFor="inspector-baseline-preset">
      Baseline preset
      <select id="inspector-baseline-preset" value={vehicle.baselinePresetId ?? ""}
        onChange={(event) => updateDiscrete({ baselinePresetId: event.target.value || null })} className={fieldClass}>
        <option value="">Generic / no preset</option>
        {vehiclePresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
      </select>
    </label>

    <NumberControl label="Annual distance (km)" value={vehicle.annualKm} min={0} step={100} edit={projectEditLifecycle}
      onChange={(annualKm) => updateVehicle({ annualKm })} />
    <div className="grid grid-cols-2 gap-3">
      <NumberControl label="Daily distance (km)" value={vehicle.typicalDailyKm} min={0} step={10} edit={projectEditLifecycle}
        onChange={(typicalDailyKm) => updateVehicle({ typicalDailyKm })} />
      <NumberControl label="Operating days / year" value={vehicle.operatingDays} min={0} step={1} edit={projectEditLifecycle}
        onChange={(operatingDays) => { if (Number.isInteger(operatingDays) && operatingDays <= 366) updateVehicle({ operatingDays }); }} />
      <NumberControl label="Utilisation (%)" value={vehicle.utilisation * 100} min={0} step={1} edit={projectEditLifecycle}
        onChange={(value) => { if (value <= 100) updateVehicle({ utilisation: value / 100 }); }} />
    </div>

    <div className="grid grid-cols-2 gap-3">
      <label className={labelClass} htmlFor="inspector-route-pattern">
        Route pattern
        <select id="inspector-route-pattern" value={vehicle.routePattern}
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

    <label className={labelClass} htmlFor="inspector-replacement-year">
      Baseline replacement year
      <select id="inspector-replacement-year" value={vehicle.replacementYear ?? ""}
        onChange={(event) => updateDiscrete({ replacementYear: event.target.value ? Number(event.target.value) : null })} className={fieldClass}>
        <option value="">No planned replacement</option>
        {vehicle.replacementYear !== null && !years.includes(vehicle.replacementYear) && <option value={vehicle.replacementYear}>{vehicle.replacementYear} · outside period</option>}
        {years.map((year) => <option key={year} value={year}>{year}</option>)}
      </select>
    </label>
    <label className={labelClass} htmlFor="inspector-current-ownership">
      Current ownership
      <select id="inspector-current-ownership" value={holding.kind} onChange={(event) => {
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
  </fieldset>;
}

function ScenarioTransitions({ vehicle, document, selectedYear }: {
  vehicle: ProjectVehicle;
  document: ProjectDocument;
  selectedYear: number;
}) {
  const scenario = document.scenarios.find((entry) => entry.id === document.activeScenarioId);
  const transitions = scenario?.vehiclePlans[vehicle.id]?.transitions ?? [];
  const replaceTransitions = (next: VehicleTransition[]) => {
    if (!scenario) return;
    useProjectStore.getState().replaceVehicleTransitions(scenario.id, vehicle.id, next);
  };
  const updateTransition = (index: number, patch: Partial<VehicleTransition>) => {
    projectEditLifecycle.commitEdit();
    replaceTransitions(transitions.map((transition, currentIndex) => currentIndex === index ? { ...transition, ...patch } : transition));
  };
  const removeTransition = (index: number) => {
    projectEditLifecycle.commitEdit();
    replaceTransitions(transitions.filter((_, currentIndex) => currentIndex !== index));
  };
  const addTransition = () => {
    projectEditLifecycle.commitEdit();
    let year = selectedYear;
    const usedYears = new Set(transitions.map((transition) => transition.year));
    while (usedYears.has(year)) year += 1;
    replaceTransitions([...transitions, { year, targetPresetId: document.vehiclePresets[0].id }]);
  };

  return <fieldset className="grid gap-3 rounded border border-line-strong p-3">
    <legend className="px-1 text-xs font-bold text-primary">Active Scenario transitions · {scenario?.name ?? "No Scenario"}</legend>
    {transitions.length ? <ol className="m-0 grid list-none gap-3 p-0">
      {transitions.map((transition, index) => <li key={`${index}-${transition.year}`} className="grid gap-3 rounded border border-line bg-panel p-3">
        <label className={labelClass} htmlFor={`inspector-transition-preset-${index}`}>
          Target preset for transition {index + 1}
          <select id={`inspector-transition-preset-${index}`} value={transition.targetPresetId}
            onChange={(event) => updateTransition(index, { targetPresetId: event.target.value })} className={fieldClass}>
            {document.vehiclePresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
          </select>
        </label>
        <TransitionYearControl index={index} value={transition.year} transitions={transitions} edit={projectEditLifecycle}
          onCommit={(year) => replaceTransitions(transitions.map((entry, currentIndex) => currentIndex === index ? { ...entry, year } : entry))} />
        <button type="button" className={actionClass} aria-label={`Remove transition ${index + 1}`}
          onClick={() => removeTransition(index)}>Remove transition</button>
      </li>)}
    </ol> : <p className="m-0 text-xs text-secondary">No transitions in this Scenario.</p>}
    <button type="button" className={actionClass} disabled={!scenario || document.vehiclePresets.length === 0}
      onClick={addTransition}>Add transition</button>
  </fieldset>;
}

function EffectiveVehicleState({ vehicle, document, selectedYear }: {
  vehicle: ProjectVehicle;
  document: ProjectDocument;
  selectedYear: number;
}) {
  const presetId = effectivePresetIdFor(document, document.activeScenarioId, vehicle.id, selectedYear);
  const preset = presetId ? document.vehiclePresets.find((entry) => entry.id === presetId) : undefined;
  const rows = preset ? [
    ["Category", preset.category],
    ["Propulsion", preset.propulsion],
    ["Model", preset.modelId],
    ["Fuel use (L/100 km)", String(preset.litresPer100Km)],
    ["Electricity use (kWh/100 km)", String(preset.kWhPer100Km)],
    ["Battery capacity (kWh)", String(preset.batteryCapacityKWh)],
    ["Charging power (kW)", String(preset.chargingPowerKW)],
    ["Purchase cost", `${document.analysis.currency} ${preset.purchaseCost}`],
    ["Maintenance / year", `${document.analysis.currency} ${preset.maintenanceCostPerYear}`],
    ["Range (km)", preset.rangeKm === null ? "Not applicable" : String(preset.rangeKm)],
    ["Charging efficiency", String(preset.chargingEfficiency)],
    ["Acquisition terms", preset.acquisition.kind === "owned"
      ? `Owned · residual ${document.analysis.currency} ${preset.acquisition.endResidualValue}`
      : `Leased · ${document.analysis.currency} ${preset.acquisition.annualPayment}/year · exit fee ${document.analysis.currency} ${preset.acquisition.exitFee}`],
  ] as const : [];

  return <section aria-label="Effective Vehicle state" className="grid gap-2 rounded border border-line-strong bg-panel p-3">
    <div className="flex items-center justify-between gap-3">
      <h4 className="m-0 text-xs font-bold text-primary">Effective state · {selectedYear}</h4>
      <span className="rounded bg-white/5 px-2 py-1 text-[10px] font-semibold text-secondary">Read-only</span>
    </div>
    <dl className="m-0 grid gap-2 text-xs">
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <dt className="text-secondary">Effective preset</dt>
        <dd className="m-0 text-right font-semibold text-primary">{preset?.name ?? "No preset"}</dd>
      </div>
      {rows.map(([label, value]) => <div key={label} className="grid grid-cols-[1fr_auto] gap-3">
        <dt className="text-secondary">{label}</dt>
        <dd className="m-0 text-right text-primary">{value}</dd>
      </div>)}
    </dl>
  </section>;
}

export function InspectorPanel() {
  const document = useProjectStore((state) => state.runtime.document);
  const selection = useProjectStore((state) => state.runtime.editor.selection);
  const selectedYear = useProjectStore((state) => state.runtime.editor.selectedYear);
  const depot = selection?.kind === "depot" && selection.id === document.environment.depot.id ? document.environment.depot : undefined;
  const vehicle = selection?.kind === "vehicle" ? document.environment.vehicles.find((entry) => entry.id === selection.id) : undefined;
  const object = depot ?? vehicle;

  const updateTransform = (property: keyof Transform, value: Vector3) => {
    if (!selection || !object) return;
    useProjectStore.getState().setProjectEntityTransform(selection, { ...object.transform, [property]: value });
  };

  return <CollapsibleSection panelId="inspector" title="Inspector" description="Inspect and edit the selected typed Project object." onBeforeCollapse={projectEditLifecycle.commitEdit}>
    {object ? <div className="mt-[22px] grid gap-5" key={`${selection?.kind}-${object.id}`}>
      <p className="break-words text-sm font-semibold text-primary">{object.name}</p>
      <Vector3Control label="Position (m)" value={object.transform.position} onChange={(value) => updateTransform("position", value)} edit={projectEditLifecycle} />
      <Vector3Control label="Rotation (°)" value={object.transform.rotation.map((angle) => angle * 180 / Math.PI) as Vector3} step={1}
        onChange={(value) => updateTransform("rotation", value.map((angle) => angle * Math.PI / 180) as Vector3)} edit={projectEditLifecycle} />
      <Vector3Control label="Scale" value={object.transform.scale} min={0.01} onChange={(value) => updateTransform("scale", value)} edit={projectEditLifecycle} />
      {vehicle && <>
        <BaselineVehicleFields vehicle={vehicle} document={document} />
        <ScenarioTransitions vehicle={vehicle} document={document} selectedYear={selectedYear} />
        <EffectiveVehicleState vehicle={vehicle} document={document} selectedYear={selectedYear} />
      </>}
    </div> : <p className="mb-4 text-[0.76rem] leading-relaxed text-secondary">No object selected. Click the depot or a vehicle in the viewport.</p>}
  </CollapsibleSection>;
}

export function ScenePanel() {
  const light = useProjectStore((state) => state.runtime.editor.lightIntensity);
  const setLight = useProjectStore((state) => state.setLightIntensity);
  const resetCamera = useProjectStore((state) => state.resetCamera);
  return <CollapsibleSection panelId="scene" title="Scene" onBeforeCollapse={projectEditorEditLifecycle.commitEdit}>
    <RangeControl label="Light intensity" value={light} min={0} max={100} unit="%" onChange={setLight} edit={projectEditorEditLifecycle} />
    <button type="button" className="mt-6 min-h-12 w-full rounded-lg border border-line-strong bg-transparent px-[15px] text-xs font-bold text-secondary hover:border-[#668078] hover:text-primary"
      onClick={() => { projectEditorEditLifecycle.commitEdit(); resetCamera(); }}>Reset camera</button>
  </CollapsibleSection>;
}

export function DebugPanel() {
  const document = useProjectStore((state) => state.runtime.document);
  const selection = useProjectStore((state) => state.runtime.editor.selection);
  return <CollapsibleSection panelId="debug" title="Debug" description="Read-only canonical Project document.">
    <p className="mb-4 text-[0.76rem] leading-relaxed text-secondary">Selected object: <code>{selection?.id ?? "none"}</code></p>
    <pre className="max-h-[360px] overflow-auto rounded-lg border border-line bg-surface p-3 text-[0.7rem] leading-relaxed" tabIndex={0} aria-label="Project document">{JSON.stringify(document, null, 2)}</pre>
  </CollapsibleSection>;
}
