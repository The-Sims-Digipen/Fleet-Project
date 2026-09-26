import type {
    SimulationInput,
    SimulationResult,
} from "../domain/contracts";
import { ANNUAL_MODEL_VERSION } from "../domain/contracts";
import {
    calculateBaselineVehicleYears,
    calculateScenarioVehicleYears,
} from "./annualPlans";
import {
    calculatePayback,
    calculatePlanTotals,
    calculateVehicleTerminalCredit,
    combineVehicleYears,
    comparePlanYears,
} from "./financial";
import { calculateElectricityPrice } from "./pricing";
import { validateSimulationInput } from "./validation";

export * from "./annualPlans";
export * from "./energy";
export * from "./financial";
export * from "./pricing";
export { validateSimulationInput } from "./validation";

/**
 * Calculates baseline and scenario results for the complete fleet.
 * @param input Canonical project and scenario simulation inputs.
 * @returns Annual comparisons, totals, savings and payback.
 */
export function simulate(
    input: SimulationInput,
): SimulationResult {

    const project = input.project;
    const scenario = input.scenario;

    validateSimulationInput(input);

    //Calculates the scenario's weighted electrcity price
    const electricityPricePerKWh = calculateElectricityPrice(scenario.assumptions);

    // Calculates baseline years separately for every vehicle.
    const baselineVehicleResults =
        project.fleetVehicles.map((vehicle) => {
            const currentPreset =
                project.vehiclePresets.find(
                    (preset) =>
                        preset.id === vehicle.currentPresetId,
                );

            if (!currentPreset) {
                throw new Error(
                    `Current preset for "${vehicle.id}" is missing.`,
                );
            }

            return calculateBaselineVehicleYears(
                vehicle,
                currentPreset,
                project.analysis,
                electricityPricePerKWh,
            );
        });

    // Calculates scenario years separately for every vehicle.
    const scenarioVehicleResults =
        project.fleetVehicles.map((vehicle) => {
            const plan =
                scenario.vehiclePlans[vehicle.id];

            return calculateScenarioVehicleYears(
                vehicle,
                plan,
                project.vehiclePresets,
                project.analysis,
                electricityPricePerKWh,
            );
        });

    // Combines the individual vehicles into fleet-level years.
    const baselineYears =
        combineVehicleYears(
            baselineVehicleResults,
        );

    const scenarioYears =
        combineVehicleYears(
            scenarioVehicleResults,
        );

    // Creates the year-by-year baseline-versus-scenario comparison.
    const annual = comparePlanYears(
        baselineYears,
        scenarioYears,
        project.analysis.startYear,
    );

    let baselineTerminalCredits = 0;
    let scenarioTerminalCredits = 0;

    for (const vehicle of project.fleetVehicles) {
        baselineTerminalCredits +=
            calculateVehicleTerminalCredit(
                vehicle,
                undefined,
                project.vehiclePresets,
                project.analysis,
            );

        scenarioTerminalCredits +=
            calculateVehicleTerminalCredit(
                vehicle,
                scenario.vehiclePlans[vehicle.id],
                project.vehiclePresets,
                project.analysis,
            );
    }

    // Totals every annual fleet result.
    const baseline = calculatePlanTotals(
        baselineYears,
        baselineTerminalCredits,
    );

    const scenarioTotals = calculatePlanTotals(
        scenarioYears,
        scenarioTerminalCredits,
    );

    // Positive savings mean the scenario is cheaper.
    const savings =
        baseline.tco - scenarioTotals.tco;

    return {
        modelVersion: ANNUAL_MODEL_VERSION,
        annual,
        baseline,
        scenario: scenarioTotals,
        savings,

        // This is the same difference viewed in the opposite direction.
        scenarioMinusBaseline: -savings,

        payback: calculatePayback(annual),
    };
}
