import type {
    AnalysisSettings,
    AnnualPlanResult,
    FleetVehicle,
    M1VehiclePreset,
    ScenarioVehiclePlan,
} from "../domain/contracts";
import { effectiveVehicleState } from "../domain/effectiveState";
import { calculateAnnualOperation } from "./energy";
import { calculateDisposalValue } from "./financial";

/**
 * Financial state of the vehicle currently active in a plan.
 */
type ActiveHolding = //Union struct
    | {
        kind: "owned";
        startingValue: number;
        endResidualValue: number;
        acquiredYearIndex: number;
    }
    | {
        kind: "leased";
        annualPayment: number;
        exitFee: number;
    };

/**
 * Calculates baseline annual results for one vehicle across the analysis period.
 * @param vehicle Fleet vehicle containing annual-distance and holding information.
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
    // Stores one baseline result per year.
    const results: AnnualPlanResult[] = [];

    // Carries the total cash cost across years.
    let cumulativeCashCost = 0;

    // Tracks the currently active owned or leased holding.
    let holding = createInitialHolding(vehicle);

    // Calculates every year in the analysis period.
    for (
        let yearIndex = 0;
        yearIndex < analysis.yearCount;
        yearIndex += 1
    ) {
        // Converts the zero-based index into a calendar year.
        const year =
            analysis.startYear + yearIndex;

        // Starts this year's financial events at zero.
        let acquisitionCapex = 0;
        let disposalCredits = 0;
        let exitFee = 0;

        // Checks whether baseline replacement occurs this year.
        const replacesThisYear =
            vehicle.replacementYear === year;

        if (replacesThisYear) {
            // Credits an owned vehicle's interpolated disposal value.
            if (holding.kind === "owned") {
                disposalCredits =
                    calculateDisposalValue(
                        holding.startingValue,
                        holding.endResidualValue,
                        holding.acquiredYearIndex,
                        yearIndex,
                        analysis.yearCount,
                    );
            } else {
                // Charges the outgoing lease's exit fee.
                exitFee = holding.exitFee;
            }

            // Creates the new holding using the current preset.
            holding = createAcquiredHolding(
                preset,
                yearIndex,
            );

            // Charges purchase CAPEX only for an owned replacement.
            if (holding.kind === "owned") {
                acquisitionCapex =
                    preset.purchaseCost;
            }
        }

        // Calculates energy, maintenance and emissions for this year.
        const operation = calculateAnnualOperation(
            vehicle.annualKm,
            preset,
            analysis.fuelPricePerLitre,
            electricityPricePerKWh,
            analysis.fuelEmissionsKgCo2ePerLitre,
            analysis.electricityEmissionsKgCo2ePerKWh,
        );

        // Charges the active holding's annual lease payment.
        const leasePayment =
            holding.kind === "leased"
                ? holding.annualPayment
                : 0;

        // Adds lease payments to energy and maintenance costs.
        const operatingCost =
            operation.operatingCost +
            leasePayment;

        // Calculates this year's complete cash cost.
        const netCashCost =
            acquisitionCapex +
            exitFee +
            operatingCost -
            disposalCredits;

        // Adds this year's cost to the running total.
        cumulativeCashCost +=
            netCashCost;

        // Creates this year's baseline result.
        const result: AnnualPlanResult = {
            acquisitionCapex,
            operatingCost,
            disposalCredits,
            netCashCost,
            cumulativeCashCost,
            fuelLitres: operation.fuelLitres,
            electricityKWh: operation.electricityKWh,
            emissionsKgCo2e:
                operation.emissionsKgCo2e,
        };

        // Adds this year's result to the output array.
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

    // Stores all valid preset IDs for scenario-state resolution.
    const presetIds = new Set(
        presets.map((preset) => preset.id),
    );

    // Carries the accumulated cash cost between years.
    let cumulativeCashCost = 0;

    // Tracks the vehicle or lease that is currently active.
    let holding = createInitialHolding(vehicle);

    // Calculates every year in the analysis period.
    for (
        let yearIndex = 0;
        yearIndex < analysis.yearCount;
        yearIndex += 1
    ) {
        // Converts the array index into the actual calendar year.
        const year = analysis.startYear + yearIndex;

        // Determines which preset is active during this year.
        const state = effectiveVehicleState(
            vehicle,
            plan,
            presetIds,
            year,
        );

        // Gets the complete preset using the active preset ID.
        const activePreset = presets.find(
            (preset) => preset.id === state.presetId,
        );

        // Prevents calculations with a missing preset.
        if (!activePreset) {
            throw new Error(
                `Active preset "${state.presetId}" is missing.`,
            );
        }

        // Starts this year's financial events at zero.
        let acquisitionCapex = 0;
        let disposalCredits = 0;
        let exitFee = 0;

        // Checks whether the scenario transition occurs this year.
        const transitionsThisYear =
            state.transitioned &&
            state.transitionYear === year;

        // Allows the normal replacement only before the transition.
        const replacesThisYear =
            vehicle.replacementYear === year &&
            (
                state.transitionYear === null ||
                year < state.transitionYear
            );

        // Replaces the current holding when either event occurs.
        if (transitionsThisYear || replacesThisYear) {
            // Credits an owned vehicle's remaining disposal value.
            if (holding.kind === "owned") {
                disposalCredits = calculateDisposalValue(
                    holding.startingValue,
                    holding.endResidualValue,
                    holding.acquiredYearIndex,
                    yearIndex,
                    analysis.yearCount,
                );
            } else {
                // Charges the outgoing lease's exit fee.
                exitFee = holding.exitFee;
            }

            // Creates the newly owned or leased holding.
            holding = createAcquiredHolding(
                activePreset,
                yearIndex,
            );

            // Charges the purchase price for an owned vehicle.
            if (holding.kind === "owned") {
                acquisitionCapex =
                    holding.startingValue;
            }
        }

        // Calculates energy, maintenance and emissions.
        const operation = calculateAnnualOperation(
            vehicle.annualKm,
            activePreset,
            analysis.fuelPricePerLitre,
            electricityPricePerKWh,
            analysis.fuelEmissionsKgCo2ePerLitre,
            analysis.electricityEmissionsKgCo2ePerKWh,
        );

        // Charges the annual payment when the active vehicle is leased.
        const leasePayment =
            holding.kind === "leased"
                ? holding.annualPayment
                : 0;

        // Combines normal operation with the lease payment.
        const operatingCost =
            operation.operatingCost +
            leasePayment;

        // Calculates the complete cash cost for this year.
        const netCashCost =
            acquisitionCapex +
            exitFee +
            operatingCost -
            disposalCredits;

        // Adds this year's cost to the running total.
        cumulativeCashCost += netCashCost;

        // Creates the result using the AnnualPlanResult structure.
        const result: AnnualPlanResult = {
            acquisitionCapex,
            operatingCost,
            disposalCredits,
            netCashCost,
            cumulativeCashCost,
            fuelLitres: operation.fuelLitres,
            electricityKWh: operation.electricityKWh,
            emissionsKgCo2e:
                operation.emissionsKgCo2e,
        };

        // Adds this year's result to the output array.
        results.push(result);
    }

    return results;
}

/**
 * Converts a fleet vehicle's current ownership data into active financial state.
 */
function createInitialHolding(
    vehicle: FleetVehicle,
): ActiveHolding {
    if (vehicle.currentHolding.kind === "owned") {
        return {
            kind: "owned",
            startingValue:
                vehicle.currentHolding.currentValue,
            endResidualValue:
                vehicle.currentHolding.endResidualValue,
            acquiredYearIndex: 0,
        };
    }

    return {
        kind: "leased",
        annualPayment:
            vehicle.currentHolding.annualPayment,
        exitFee:
            vehicle.currentHolding.exitFee,
    };
}

/**
 * Creates financial state for a preset acquired during the analysis.
 */
function createAcquiredHolding(
    preset: M1VehiclePreset,
    acquiredYearIndex: number,
): ActiveHolding {
    if (preset.acquisition.kind === "owned") {
        return {
            kind: "owned",
            startingValue: preset.purchaseCost,
            endResidualValue:
                preset.acquisition.endResidualValue,
            acquiredYearIndex,
        };
    }

    return {
        kind: "leased",
        annualPayment:
            preset.acquisition.annualPayment,
        exitFee:
            preset.acquisition.exitFee,
    };
}
