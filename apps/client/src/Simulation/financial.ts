import type {
    AnalysisSettings,
    AnnualComparisonResult,
    AnnualPlanResult,
    FleetVehicle,
    M1VehiclePreset,
    PaybackResult,
    PlanTotals,
    ScenarioVehiclePlan,
} from "../domain/contracts";
import { effectiveVehicleState } from "../domain/effectiveState";

/**
 * Totals annual financial, energy and emissions results for one plan.
 * @param years Annual results produced by the plan calculation.
 * @param terminalCredits Final residual value credited after the last year.
 * @returns Totals and TCO across the complete analysis period.
 */
export function calculatePlanTotals(
    years: readonly AnnualPlanResult[],
    terminalCredits: number,
): PlanTotals {

    const totals: PlanTotals = {
        acquisitionCapex: 0,
        operatingCost: 0,
        disposalCredits: 0,
        terminalCredits,
        tco: 0,
        fuelLitres: 0,
        electricityKWh: 0,
        emissionsKgCo2e: 0,
    };

    //Looping through the different year's of financial like expense and profits
    for (const year of years) {
        // Adds this year's purchases to total CAPEX.
        totals.acquisitionCapex += year.acquisitionCapex;

        // Adds this year's operating cost.
        totals.operatingCost += year.operatingCost;

        // Adds money recovered from vehicles sold during the plan.
        totals.disposalCredits += year.disposalCredits;

        // Adds this year's net cash cost before the terminal credit.
        totals.tco += year.netCashCost;

        // Adds this year's fuel consumption.
        totals.fuelLitres += year.fuelLitres;

        // Adds this year's supplied electricity.
        totals.electricityKWh += year.electricityKWh;

        // Adds this year's operational emissions.
        totals.emissionsKgCo2e += year.emissionsKgCo2e;
    }

    // Subtracts the value of owned vehicles remaining at the end.
    totals.tco -= terminalCredits;

    // Returns the totals for the complete plan.
    return totals;
}

/**
 * Combines baseline and scenario years into annual comparison results.
 * @param baselineYears Annual baseline results.
 * @param scenarioYears Annual scenario results.
 * @param startYear First calendar year in the analysis period.
 * @returns Yearly baseline, scenario and cumulative-savings comparisons.
 */
export function comparePlanYears(
    baselineYears: readonly AnnualPlanResult[],
    scenarioYears: readonly AnnualPlanResult[],
    startYear: number,
): AnnualComparisonResult[] {
    // Reject mismatched arrays because every year needs both results.
    if (baselineYears.length !== scenarioYears.length) {
        throw new Error(
            "Baseline and scenario must contain the same number of years.",
        );
    }

    // Create the comparison output.
    const comparisons: AnnualComparisonResult[] = [];

    // Visit every baseline/scenario year using the same array index.
    for (
        let yearIndex = 0;
        yearIndex < baselineYears.length;
        yearIndex += 1
    ) {
        const baseline = baselineYears[yearIndex];
        const scenario = scenarioYears[yearIndex];

        // Converts index 0, 1, 2... into calendar years.
        const year = startYear + yearIndex;

        // Positive savings mean the scenario has cost less so far.
        const cumulativeCashSavings =
            baseline.cumulativeCashCost -
            scenario.cumulativeCashCost;

        comparisons.push({
            year,
            baseline,
            scenario,
            cumulativeCashSavings,
        });
    }

    return comparisons;

}

/**
 * Finds the first year where cumulative savings reach payback and stay nonnegative.
 * @param comparisons Annual baseline-versus-scenario comparisons.
 * @returns Reached, initial-parity or not-reached payback information.
 */
export function calculatePayback(
    comparisons: readonly AnnualComparisonResult[],
): PaybackResult {
    // Check every year from the beginning.
    for (
        let yearIndex = 0;
        yearIndex < comparisons.length;
        yearIndex += 1
    ) {
        const comparison = comparisons[yearIndex];

        // Payback cannot occur while cumulative savings are negative.
        if (comparison.cumulativeCashSavings < 0) {
            continue;
        }

        // Checks that savings never become negative after this year.
        //Method changing in typescript
        const remainsNonnegative = comparisons
            .slice(yearIndex)   //Copies part of an array where the parameter is the starting index of where to star copying
            .every(             //Every check whetehr every leemnt passes a condition, remainsNonnegative to false. Similar to for loop but to check for specific conditions
                (laterYear) => //Later year is part of comparisons, entering it like a range
                    laterYear.cumulativeCashSavings >= 0,
            );

        // Skip temporary payback that is lost in a later year.
        if (!remainsNonnegative) {
            continue;
        }

        // Initial parity means no first-year cost premium was introduced.
        const hasNoInitialPremium =
            yearIndex === 0 &&
            comparison.scenario.netCashCost <=
            comparison.baseline.netCashCost;

        return {
            status: hasNoInitialPremium
                ? "initial-parity"
                : "reached",
            year: comparison.year,
        };
    }

    // No modeled year reaches lasting payback.
    return {
        status: "not-reached",
        year: null,
    };
}


/**
 * Combines multiple vehicles' annual results into fleet-level annual results.
 * @param vehicleResults One annual-result array for each fleet vehicle.
 * @returns Fleet totals for every analysis year.
 */
export function combineVehicleYears(
    vehicleResults: readonly (readonly AnnualPlanResult[])[],
): AnnualPlanResult[] {
    // An empty fleet has no annual vehicle results.
    if (vehicleResults.length === 0) {
        return [];
    }

    // All vehicles must use the same analysis period.
    const yearCount = vehicleResults[0].length;

    // Reject vehicles with different result lengths.
    for (const results of vehicleResults) {
        if (results.length !== yearCount) {
            throw new Error(
                "All vehicles must contain the same number of years.",
            );
        }
    }

    const fleetResults: AnnualPlanResult[] = [];
    let cumulativeCashCost = 0;

    // Builds one combined fleet result for each year.
    for (
        let yearIndex = 0;
        yearIndex < yearCount;
        yearIndex += 1
    ) {
        // Starts the current fleet year at zero.
        const fleetYear: AnnualPlanResult = {
            acquisitionCapex: 0,
            operatingCost: 0,
            disposalCredits: 0,
            netCashCost: 0,
            cumulativeCashCost: 0,
            fuelLitres: 0,
            electricityKWh: 0,
            emissionsKgCo2e: 0,
        };

        // Adds every vehicle's values for this year.
        for (const results of vehicleResults) {
            const vehicleYear = results[yearIndex];

            fleetYear.acquisitionCapex +=
                vehicleYear.acquisitionCapex;

            fleetYear.operatingCost +=
                vehicleYear.operatingCost;

            fleetYear.disposalCredits +=
                vehicleYear.disposalCredits;

            fleetYear.netCashCost +=
                vehicleYear.netCashCost;

            fleetYear.fuelLitres +=
                vehicleYear.fuelLitres;

            fleetYear.electricityKWh +=
                vehicleYear.electricityKWh;

            fleetYear.emissionsKgCo2e +=
                vehicleYear.emissionsKgCo2e;
        }

        // Recalculates cumulative cost from the combined fleet costs.
        cumulativeCashCost += fleetYear.netCashCost;
        fleetYear.cumulativeCashCost = cumulativeCashCost;

        fleetResults.push(fleetYear);
    }

    return fleetResults;
}

/**
 * Calculates one vehicle's residual credit at the end of the analysis.
 * @param vehicle Fleet vehicle being evaluated.
 * @param plan Optional scenario transition plan.
 * @param presets Project vehicle presets.
 * @param analysis Project analysis period.
 * @returns End-of-period owned-vehicle residual credit.
 */
export function calculateVehicleTerminalCredit(
    vehicle: FleetVehicle,
    plan: ScenarioVehiclePlan | undefined,
    presets: readonly M1VehiclePreset[],
    analysis: AnalysisSettings,
): number {
    // Creates the preset-ID set required by state resolution.
    const presetIds = new Set(
        presets.map((preset) => preset.id),
    );

    // Calculates the final calendar year.
    const finalYear =
        analysis.startYear +
        analysis.yearCount -
        1;

    // Resolves the active preset at the end of the scenario.
    const finalState = effectiveVehicleState(
        vehicle,
        plan,
        presetIds,
        finalYear,
    );

    // Checks whether a replacement occurs during the analysis.
    const replacedDuringAnalysis =
        vehicle.replacementYear !== null &&
        vehicle.replacementYear <= finalYear;

    // A transition means the scenario acquired the target preset.
    const transitionedDuringAnalysis =
        finalState.transitioned;

    // Keeps the existing holding only when no acquisition occurred.
    if (
        !replacedDuringAnalysis &&
        !transitionedDuringAnalysis
    ) {
        return vehicle.currentHolding.kind === "owned"
            ? vehicle.currentHolding.endResidualValue
            : 0;
    }

    // Finds the preset belonging to the final acquired holding.
    const finalPreset = presets.find(
        (preset) =>
            preset.id === finalState.presetId,
    );

    if (!finalPreset) {
        throw new Error(
            `Final preset "${finalState.presetId}" is missing.`,
        );
    }

    // Leased acquired vehicles have no terminal residual credit.
    return finalPreset.acquisition.kind === "owned"
        ? finalPreset.acquisition.endResidualValue
        : 0;
}

/**
 * Calculates an owned asset's interpolated value when disposed during the analysis.
 * @param startingValue Asset value when its current holding begins.
 * @param endResidualValue Asset value after the final analysis year.
 * @param acquiredYearIndex Zero-based year index when the holding begins.
 * @param disposalYearIndex Zero-based year index when the holding is disposed.
 * @param yearCount Number of years in the analysis period.
 * @returns Asset value credited during the disposal year.
 */
export function calculateDisposalValue(
    startingValue: number,
    endResidualValue: number,
    acquiredYearIndex: number,
    disposalYearIndex: number,
    yearCount: number,
): number {
    const holdingDuration =
        yearCount - acquiredYearIndex;

    const elapsedDuration =
        disposalYearIndex - acquiredYearIndex;

    const valueChange =
        endResidualValue - startingValue;

    return (
        startingValue +
        valueChange *
        (elapsedDuration / holdingDuration)
    );
}
