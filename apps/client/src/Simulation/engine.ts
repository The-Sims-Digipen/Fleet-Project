import { fileURLToPath } from "node:url";

import type {
    AnalysisSettings, // Simulation period, currency, fuel price and emissions factors.
    AnnualComparisonResult, // One year's baseline, scenario and cumulative-savings comparison.
    AnnualPlanResult, // One plan's cost, energy and emissions result for one year.
    FleetVehicle, // Fleet vehicle data such as annual distance and current preset.
    M1VehiclePreset, // Vehicle consumption, maintenance, purchase and ownership data.
    PaybackResult, // Whether payback occurs and the year when it occurs.
    PlanTotals, // Total cost, energy and emissions across the analysis period.
    ScenarioVehiclePlan, // Optional target preset and transition year for one vehicle.
    ScenarioAssumptions, // Charging strategy, depot share and electricity prices.
} from "../domain/contracts";

import {
    effectiveVehicleState,
} from "../domain/effectiveState";

//Resultant strcut
//Types
/**
 * Annual fuel and supplied-electricity consumption.
 */
export type AnnualEnergy = {
    fuelLitres: number;
    electricityKWh: number;
};

/**
 * Combined annual operational cost, energy and emissions.
 */
export type AnnualOperation = {
    operatingCost: number;
    fuelLitres: number;
    electricityKWh: number;
    emissionsKgCo2e: number;
};

/**
 * Calculates annual fuel consumption and supplied electricity.
 * @param annualKm Distance travelled during one year in kilometres.
 * @param preset Vehicle preset containing fuel, electricity and charging-efficiency values.
 * @returns Annual fuel consumption in litres and supplied electricity in kWh.
 */
export function calculateAnnualEnergy(
    annualKm: number,
    preset: M1VehiclePreset,
): AnnualEnergy {

    let battery: number;
    battery = annualKm * (preset.kWhPer100Km / 100);

    //Objects variable needs to be initialize before it can be used
    let result: AnnualEnergy = {
        fuelLitres: annualKm * (preset.litresPer100Km / 100),

        //If vechicle needs x kWh and charging efficiency is @ 90%, the charging will need more than x kWh for fully charged.
        electricityKWh: battery / preset.chargingEfficiency,
    };

    return result;

}

/**
 * Calculates annual energy and maintenance operating costs.
 * @param annualKm Distance travelled during one year in kilometres.
 * @param preset Vehicle preset containing consumption and maintenance values.
 * @param fuelPricePerLitre Fuel price per litre in the project currency.
 * @param electricityPricePerKWh Electricity price per supplied kWh.
 * @returns Total annual fuel, electricity and maintenance cost.
 */
export function calculateAnnualOperatingCost(
    annualKm: number,
    preset: M1VehiclePreset,
    fuelPricePerLitre: number,
    electricityPricePerKwh: number,
): number {
    let fuelCost: number;
    let electricityCost: number;
    let annualPrice: number;

    const energyXfuel: AnnualEnergy = calculateAnnualEnergy(annualKm, preset);

    fuelCost = energyXfuel.fuelLitres * fuelPricePerLitre;

    electricityCost = energyXfuel.electricityKWh * electricityPricePerKwh;

    annualPrice = fuelCost + electricityCost + preset.maintenanceCostPerYear;

    return annualPrice;

}

/**
 * Calculates annual operational emissions from fuel and electricity consumption.
 * @param usage Annual fuel and supplied-electricity consumption.
 * @param fuelEmissionsKgCo2ePerLitre Fuel emissions in kgCO2e per litre.
 * @param electricityEmissionsKgCo2ePerKWh Electricity emissions in kgCO2e per kWh.
 * @returns Total annual operational emissions in kgCO2e.
 */
export function calculateAnnualEmissions(
    usage: AnnualEnergy,
    fuleEmissionKgCo2ePerLitre: number,
    electricityEmissionsKgCo2ePerKwh: number,
): number {

    let fuelEmissions: number = usage.fuelLitres * fuleEmissionKgCo2ePerLitre;
    let electricEmissions: number = usage.electricityKWh * electricityEmissionsKgCo2ePerKwh;
    let totalEmissions: number = fuelEmissions + electricEmissions;

    return totalEmissions;

}

/**
 * Combines annual energy, operating-cost and emissions calculations.
 * @param annualKm Distance travelled during one year in kilometres.
 * @param preset Vehicle preset used during the year.
 * @param fuelPricePerLitre Fuel price per litre.
 * @param electricityPricePerKWh Electricity price per supplied kWh.
 * @param fuelEmissionsKgCo2ePerLitre Fuel emissions factor.
 * @param electricityEmissionsKgCo2ePerKWh Electricity emissions factor.
 * @returns The vehicle's combined annual operational result.
 */
export function calculateAnnualOperation(
    annualKm: number,
    preset: M1VehiclePreset,
    fuelPricePerLitre: number,
    electricityPricePerKWh: number,
    fuelEmissionsKgCo2ePerLitre: number,
    electricityEmissionsKgCo2ePerKWh: number,
): AnnualOperation {
    // Step 1: calculate AnnualEnergy.
    const energy = calculateAnnualEnergy(
        annualKm,
        preset,
    );
    // Step 2: calculate operating cost.
    const operatingCost = calculateAnnualOperatingCost(
        annualKm, preset, fuelPricePerLitre, electricityPricePerKWh
    );
    // Step 3: calculate emissions.
    const emissionsKgCo2e = calculateAnnualEmissions(
        energy, fuelEmissionsKgCo2ePerLitre, electricityEmissionsKgCo2ePerKWh
    );
    // Step 4: create and return AnnualOperation.
    const result: AnnualOperation = {
        operatingCost: operatingCost,
        fuelLitres: energy.fuelLitres,
        electricityKWh: energy.electricityKWh,
        emissionsKgCo2e: emissionsKgCo2e,
    };

    return result;
}


/**
 * Calculates baseline annual results for one vehicle across the analysis period.
 * @param vehicle Fleet vehicle containing annual-distance information.
 * @param preset Vehicle's current preset used throughout the baseline.
 * @param analysis Project analysis period, prices and emissions factors.
 * @param electricityPricePerKWh Electricity price per supplied kWh.
 * @returns One baseline result for every year in the analysis period.
 */
export function calculateBaselineVehicleYears(
    vehicle: FleetVehicle,
    preset: M1VehiclePreset,
    analysis: AnalysisSettings,
    electricityPricePerKWh: number,
): AnnualPlanResult[] {
    //Array of AnnualPlanResult
    const results: AnnualPlanResult[] = [];

    let cumulativeCashCost = 0;

    for (
        let yearIndex = 0;
        yearIndex < analysis.yearCount;
        yearIndex += 1
    ) {
        // Calculate this vehicle's energy, cost and emissions
        // for one year.
        const operation = calculateAnnualOperation(
            vehicle.annualKm,
            preset,
            analysis.fuelPricePerLitre,
            electricityPricePerKWh,
            analysis.fuelEmissionsKgCo2ePerLitre,
            analysis.electricityEmissionsKgCo2ePerKWh,
        );

        // There is currently no purchase or disposal in this
        // simple baseline, so annual cash cost equals operating cost.
        const netCashCost = operation.operatingCost;

        // Add this year's cost to all previous years' costs.
        cumulativeCashCost += netCashCost;

        // Create the result object for this particular year.
        const result: AnnualPlanResult = {
            acquisitionCapex: 0,
            operatingCost: operation.operatingCost,
            disposalCredits: 0,
            netCashCost,
            cumulativeCashCost,
            fuelLitres: operation.fuelLitres,
            electricityKWh: operation.electricityKWh,
            emissionsKgCo2e: operation.emissionsKgCo2e,
        };

        // Add this year's object to the end of the results array.
        results.push(result);
    }

    return results;
}

/**
 * Calculates scenario annual results for one vehicle using its transition plan.
 * @param vehicle Fleet vehicle being simulated.
 * @param plan Optional target-preset and transition-year decision.
 * @param presets Project presets available for current and target resolution.
 * @param analysis Project analysis period, fuel price and emissions factors.
 * @param electricityPricePerKWh Electricity price per supplied kWh.
 * @returns One scenario result for every year in the analysis period.
 */
export function calculateScenarioVehicleYears(
    vehicle: FleetVehicle,
    plan: ScenarioVehiclePlan | undefined,
    presets: readonly M1VehiclePreset[],
    analysis: AnalysisSettings,
    electricityPricePerKWh: number,
): AnnualPlanResult[] {
    // Stores one calculated result per year.
    const results: AnnualPlanResult[] = [];

    // Stores valid preset IDs for scenario-state resolution.
    const presetIds = new Set(
        presets.map((preset) => preset.id),
    );

    // Carries the total cash cost across years.
    let cumulativeCashCost = 0;

    // Calculates each year in the analysis period.
    for (
        let yearIndex = 0;
        yearIndex < analysis.yearCount;
        yearIndex += 1
    ) {
        // Converts the zero-based index into a calendar year.
        const year = analysis.startYear + yearIndex;

        // Resolves the vehicle's active preset for this year.
        const state = effectiveVehicleState(
            vehicle,
            plan,
            presetIds,
            year,
        );

        // Finds the complete preset using the resolved preset ID.
        const activePreset = presets.find(
            (preset) => preset.id === state.presetId,
        );

        // Stops the calculation when the active preset is missing.
        if (!activePreset) {
            throw new Error(
                `Active preset "${state.presetId}" is missing.`,
            );
        }

        // Calculates this year's energy, operating cost and emissions.
        const operation = calculateAnnualOperation(
            vehicle.annualKm,
            activePreset,
            analysis.fuelPricePerLitre,
            electricityPricePerKWh,
            analysis.fuelEmissionsKgCo2ePerLitre,
            analysis.electricityEmissionsKgCo2ePerKWh,
        );

        // Starts this year with no vehicle-purchase CAPEX.
        let acquisitionCapex = 0;

        // Checks whether the transition happens in this exact year.
        const transitionsThisYear =
            state.transitioned &&
            state.transitionYear === year;

        // Charges an owned target vehicle's purchase price once.
        if (
            transitionsThisYear &&
            activePreset.acquisition.kind === "owned"
        ) {
            acquisitionCapex = activePreset.purchaseCost;
        }

        // Disposal credits will be implemented in a later step.
        //This is the money received when a current vehicle is sold or disposed
        const disposalCredits = 0;

        // Calculates the cash cost for this year.
        const netCashCost =
            acquisitionCapex +
            operation.operatingCost -
            disposalCredits;

        // Adds this year's cost to the running total.
        cumulativeCashCost += netCashCost;

        // Creates this year's complete result.
        const result: AnnualPlanResult = {
            acquisitionCapex,
            operatingCost: operation.operatingCost,
            disposalCredits,
            netCashCost,
            cumulativeCashCost,
            fuelLitres: operation.fuelLitres,
            electricityKWh: operation.electricityKWh,
            emissionsKgCo2e: operation.emissionsKgCo2e,
        };

        // Adds this year's result to the output array.
        results.push(result);
    }

    // Returns all calculated scenario years.
    return results;
}

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
 * Calculates the weighted electricity price for a scenario.
 * @param assumptions Scenario charging shares and electricity prices.
 * @returns Effective electricity price per supplied kWh.
 */
export function calculateElectricityPrice(
    assumptions: ScenarioAssumptions,
): number {
    const depotShare =
        assumptions.depotChargingShare;

    const externalShare =
        1 - depotShare;

    const depotCost =
        depotShare *
        assumptions.depotElectricityPricePerKWh;

    const externalCost =
        externalShare *
        assumptions.externalElectricityPricePerKWh;

    return depotCost + externalCost;
}