import { useState, type ReactNode } from "react";
import type { ChargingStrategy } from "../domain/contracts";
import { useFleetStore } from "../state/fleetStore";
import { usePresetStore } from "../state/presetStore";
import { useProjectStore } from "../state/projectStore";
import { CollapsibleSection } from "./CollapsibleSection";
import { NumberControl, SelectControl, type EditLifecycle } from "./controls";
import { SimulationPreview } from "./SimulationPreview";

const immediateEdit: EditLifecycle = {
  beginEdit: () => {},
  commitEdit: () => {},
  cancelEdit: () => {},
};

function InputGroup({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <fieldset className="grid gap-4 rounded-lg border border-line bg-surface p-4"><legend className="sr-only">{title}</legend>
    <div><h4 className="text-sm font-semibold text-primary">{title}</h4><p className="mt-1 text-xs leading-relaxed text-secondary">{description}</p></div>
    <div className="grid gap-4">{children}</div>
  </fieldset>;
}

export function SimulationSettings() {
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const vehicles = useFleetStore((state) => state.vehicles);
  const analysis = useFleetStore((state) => state.analysis);
  const updateAnalysis = useFleetStore((state) => state.updateAnalysis);
  const updateVehicle = useFleetStore((state) => state.updateVehicle);
  const presets = usePresetStore((state) => state.presets);
  const scenarios = useProjectStore((state) => state.scenarios);
  const activeScenarioId = useProjectStore((state) => state.activeScenarioId);
  const updateScenarioAssumptions = useProjectStore((state) => state.updateScenarioAssumptions);
  const activeScenario = scenarios.find((scenario) => scenario.id === activeScenarioId) ?? scenarios[0];
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? vehicles[0] ?? null;
  const currentPreset = presets.find((preset) => preset.id === selectedVehicle?.currentPresetId);
  const scenarioAssumptions = activeScenario?.document.assumptions;

  const updateElectricity = (patch: Parameters<typeof updateScenarioAssumptions>[1]) => {
    if (activeScenario) updateScenarioAssumptions(activeScenario.id, patch);
  };

  return <CollapsibleSection title="Simulation" defaultOpen description="Edit authoritative simulation inputs and view live annual-v1 financial results.">
    <div className="grid gap-5">
      <InputGroup title="Project assumptions" description="These shared values recalculate the baseline and active scenario immediately.">
        <NumberControl label="Simulation length (years)" value={analysis.yearCount} min={1} step={1} edit={immediateEdit}
          onChange={(yearCount) => { if (Number.isInteger(yearCount)) updateAnalysis({ yearCount }); }} />
        <NumberControl label="Fuel price ($/L)" value={analysis.fuelPricePerLitre} min={0} step={0.01} edit={immediateEdit}
          onChange={(fuelPricePerLitre) => updateAnalysis({ fuelPricePerLitre })} />
        <NumberControl label="Fuel emissions (kgCO2e/L)" value={analysis.fuelEmissionsKgCo2ePerLitre} min={0} step={0.01} edit={immediateEdit}
          onChange={(fuelEmissionsKgCo2ePerLitre) => updateAnalysis({ fuelEmissionsKgCo2ePerLitre })} />
        <NumberControl label="Electricity emissions (kgCO2e/kWh)" value={analysis.electricityEmissionsKgCo2ePerKWh} min={0} step={0.01} edit={immediateEdit}
          onChange={(electricityEmissionsKgCo2ePerKWh) => updateAnalysis({ electricityEmissionsKgCo2ePerKWh })} />
      </InputGroup>

      {scenarioAssumptions && <InputGroup title="Scenario electricity" description="These prices and charging shares belong to the active scenario only.">
        <SelectControl<ChargingStrategy> label="Charging strategy" value={scenarioAssumptions.chargingStrategy}
          options={[
            { value: "depot", label: "Depot" },
            { value: "external", label: "External" },
            { value: "mixed", label: "Mixed" },
          ]}
          onChange={(chargingStrategy) => updateElectricity({
            chargingStrategy,
            depotChargingShare: chargingStrategy === "depot" ? 1 : chargingStrategy === "external" ? 0 : 0.5,
          })} />
        <NumberControl label="Depot charging share (0–1)" value={scenarioAssumptions.depotChargingShare} min={0} step={0.05} edit={immediateEdit}
          onChange={(depotChargingShare) => { if (depotChargingShare <= 1) updateElectricity({ depotChargingShare }); }} />
        <NumberControl label="Depot electricity price ($/kWh)" value={scenarioAssumptions.depotElectricityPricePerKWh} min={0} step={0.01} edit={immediateEdit}
          onChange={(depotElectricityPricePerKWh) => updateElectricity({ depotElectricityPricePerKWh })} />
        <NumberControl label="External electricity price ($/kWh)" value={scenarioAssumptions.externalElectricityPricePerKWh} min={0} step={0.01} edit={immediateEdit}
          onChange={(externalElectricityPricePerKWh) => updateElectricity({ externalElectricityPricePerKWh })} />
      </InputGroup>}

      <InputGroup title="Vehicle operation" description="Annual distance is project-owned. Target preset and transition year remain in Fleet Management.">
        <SelectControl label="Fleet vehicle" value={selectedVehicle?.id ?? ""}
          options={vehicles.map((vehicle) => ({ value: vehicle.id, label: vehicle.name }))}
          onChange={setSelectedVehicleId} />
        {!selectedVehicle && <p role="alert" className="text-xs leading-relaxed text-secondary">Add a fleet vehicle before running a simulation.</p>}
        {selectedVehicle && <>
          <NumberControl label="Annual distance (km/year)" value={selectedVehicle.annualKm} min={0} step={100} edit={immediateEdit}
            onChange={(annualKm) => updateVehicle(selectedVehicle.id, { annualKm })} />
          <p className="text-xs text-secondary">Current preset: <span className="font-semibold text-primary">{currentPreset?.name ?? "Missing preset"}</span></p>
        </>}
      </InputGroup>

      <p className="text-xs leading-relaxed text-secondary">Results update immediately. The annual-v1 model uses constant prices and does not apply inflation.</p>

      <SimulationPreview />
    </div>
  </CollapsibleSection>;
}
