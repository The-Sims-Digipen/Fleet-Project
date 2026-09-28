import { useProjectStore } from "../state/projectStore";
import { CollapsibleSection } from "./CollapsibleSection";
import { NumberControl, TextControl, type EditLifecycle } from "./controls";

const edit: EditLifecycle = {
  beginEdit: () => useProjectStore.getState().beginEdit(),
  commitEdit: () => useProjectStore.getState().commitEdit(),
  cancelEdit: () => useProjectStore.getState().cancelEdit(),
};

export function SimulationSettings() {
  const analysis = useProjectStore((state) => state.runtime.document.analysis);
  const updateAnalysis = useProjectStore((state) => state.updateAnalysis);

  return <CollapsibleSection title="Analysis Settings" defaultOpen description="Shared assumptions used to evaluate every Scenario." onBeforeCollapse={edit.commitEdit}>
    <div className="grid gap-5">
      <p className="text-xs leading-relaxed text-secondary">Changing a shared assumption recalculates the baseline and every Project Scenario. Invalid drafts stay in the field until corrected and do not replace the saved Project value.</p>

      <fieldset className="grid gap-4 rounded-lg border border-line bg-surface p-4">
        <legend className="sr-only">Evaluation period</legend>
        <div><h4 className="text-sm font-semibold text-primary">Evaluation period</h4><p className="mt-1 text-xs leading-relaxed text-secondary">The Project evaluates whole calendar years from the start year.</p></div>
        <div className="grid grid-cols-2 gap-3">
          <NumberControl label="Start year" value={analysis.startYear} step={1} edit={edit} onChange={(startYear) => { if (Number.isInteger(startYear)) updateAnalysis({ startYear }); }} />
          <NumberControl label="Years" value={analysis.yearCount} min={1} step={1} edit={edit} onChange={(yearCount) => { if (Number.isInteger(yearCount)) updateAnalysis({ yearCount }); }} />
        </div>
        <TextControl label="Project currency" value={analysis.currency} maxLength={8} edit={edit} onChange={(currency) => updateAnalysis({ currency })} />
      </fieldset>

      <fieldset className="grid gap-4 rounded-lg border border-line bg-surface p-4">
        <legend className="sr-only">Financial assumptions</legend>
        <div><h4 className="text-sm font-semibold text-primary">Financial assumptions</h4><p className="mt-1 text-xs leading-relaxed text-secondary">One fuel price and one electricity price apply to every Scenario.</p></div>
        <div className="grid grid-cols-2 gap-3">
          <NumberControl label="Diesel / fuel price (per litre)" value={analysis.fuelPricePerLitre} min={0} step={0.01} edit={edit} onChange={(fuelPricePerLitre) => updateAnalysis({ fuelPricePerLitre })} />
          <NumberControl label="Electricity price (per kWh)" value={analysis.electricityPricePerKWh} min={0} step={0.01} edit={edit} onChange={(electricityPricePerKWh) => updateAnalysis({ electricityPricePerKWh })} />
          <NumberControl label="Discount rate (%)" value={analysis.discountRate * 100} min={0} step={0.1} edit={edit} onChange={(rate) => { if (rate <= 100) updateAnalysis({ discountRate: rate / 100 }); }} />
        </div>
      </fieldset>

      <fieldset className="grid gap-4 rounded-lg border border-line bg-surface p-4">
        <legend className="sr-only">Emissions assumptions</legend>
        <div><h4 className="text-sm font-semibold text-primary">Emissions assumptions</h4><p className="mt-1 text-xs leading-relaxed text-secondary">Operational emissions use shared fuel and grid factors.</p></div>
        <div className="grid grid-cols-2 gap-3">
          <NumberControl label="Diesel / fuel emissions (kg CO₂e per litre)" value={analysis.fuelEmissionsKgCo2ePerLitre} min={0} step={0.01} edit={edit} onChange={(fuelEmissionsKgCo2ePerLitre) => updateAnalysis({ fuelEmissionsKgCo2ePerLitre })} />
          <NumberControl label="Grid emissions (kg CO₂e per kWh)" value={analysis.electricityEmissionsKgCo2ePerKWh} min={0} step={0.01} edit={edit} onChange={(electricityEmissionsKgCo2ePerKWh) => updateAnalysis({ electricityEmissionsKgCo2ePerKWh })} />
        </div>
      </fieldset>
    </div>
  </CollapsibleSection>;
}
