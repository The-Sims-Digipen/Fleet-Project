import type {
    AnalysisSettings,
    FleetVehicle,
    M1VehiclePreset,
    ScenarioAssumptions,
    SimulationInput,
} from "../domain/contracts";

/**
 * Verifies that the analysis period can be simulated safely.
 * @param analysis Analysis settings to validate.
 * @throws Error when a setting is invalid.
 */
function validateAnalysisSettings(
    analysis: AnalysisSettings,
): void {
    if (!Number.isInteger(analysis.startYear)) {
        throw new Error(
            "Analysis start year must be an integer.",
        );
    }

    if (
        !Number.isInteger(analysis.yearCount) ||
        analysis.yearCount <= 0
    ) {
        throw new Error(
            "Analysis year count must be a positive integer.",
        );
    }

    if (
        !Number.isFinite(analysis.fuelPricePerLitre) ||
        analysis.fuelPricePerLitre < 0
    ) {
        throw new Error(
            "Fuel price must be a nonnegative finite number.",
        );
    }

    if (
        !Number.isFinite(
            analysis.fuelEmissionsKgCo2ePerLitre,
        ) ||
        analysis.fuelEmissionsKgCo2ePerLitre < 0
    ) {
        throw new Error(
            "Fuel emissions factor must be a nonnegative finite number.",
        );
    }

    if (
        !Number.isFinite(
            analysis.electricityEmissionsKgCo2ePerKWh,
        ) ||
        analysis.electricityEmissionsKgCo2ePerKWh < 0
    ) {
        throw new Error(
            "Electricity emissions factor must be a nonnegative finite number.",
        );
    }
}

/**
 * Verifies that scenario electricity assumptions are safe to calculate.
 * @param assumptions Scenario electricity and charging assumptions.
 * @throws Error when an assumption is invalid.
 */
function validateScenarioAssumptions(
    assumptions: ScenarioAssumptions,
): void {
    if (
        !Number.isFinite(
            assumptions.depotElectricityPricePerKWh,
        ) ||
        assumptions.depotElectricityPricePerKWh < 0
    ) {
        throw new Error(
            "Depot electricity price must be a nonnegative finite number.",
        );
    }

    if (
        !Number.isFinite(
            assumptions.externalElectricityPricePerKWh,
        ) ||
        assumptions.externalElectricityPricePerKWh < 0
    ) {
        throw new Error(
            "External electricity price must be a nonnegative finite number.",
        );
    }

    if (
        !Number.isFinite(
            assumptions.depotChargingShare,
        ) ||
        assumptions.depotChargingShare < 0 ||
        assumptions.depotChargingShare > 1
    ) {
        throw new Error(
            "Depot charging share must be between 0 and 1.",
        );
    }
}

/**
 * Verifies that one vehicle preset contains safe numeric values.
 * @param preset Vehicle preset to validate.
 * @throws Error when a preset value is invalid.
 */
function validateVehiclePreset(
    preset: M1VehiclePreset,
): void {
    // These fields must all be finite and zero or greater.
    const nonNegativeFields = [
        "litresPer100Km",
        "kWhPer100Km",
        "batteryCapacityKWh",
        "chargingPowerKW",
        "purchaseCost",
        "maintenanceCostPerYear",
    ] as const;

    for (const field of nonNegativeFields) {
        const value = preset[field];

        if (
            !Number.isFinite(value) ||
            value < 0
        ) {
            throw new Error(
                `Preset "${preset.id}" has an invalid ${field}.`,
            );
        }
    }

    // A null range means that range does not apply.
    if (
        preset.rangeKm !== null &&
        (
            !Number.isFinite(preset.rangeKm) ||
            preset.rangeKm < 0
        )
    ) {
        throw new Error(
            `Preset "${preset.id}" has an invalid rangeKm.`,
        );
    }

    // Efficiency is used as a divisor, so zero is invalid.
    if (
        !Number.isFinite(preset.chargingEfficiency) ||
        preset.chargingEfficiency <= 0 ||
        preset.chargingEfficiency > 1
    ) {
        throw new Error(
            `Preset "${preset.id}" has an invalid chargingEfficiency.`,
        );
    }

    // Owned vehicles require a valid residual value.
    if (
        preset.acquisition.kind === "owned" &&
        (
            !Number.isFinite(
                preset.acquisition.endResidualValue,
            ) ||
            preset.acquisition.endResidualValue < 0
        )
    ) {
        throw new Error(
            `Preset "${preset.id}" has an invalid endResidualValue.`,
        );
    }

    // Leased vehicles require valid annual payments and exit fees.
    if (preset.acquisition.kind === "leased") {
        if (
            !Number.isFinite(
                preset.acquisition.annualPayment,
            ) ||
            preset.acquisition.annualPayment < 0
        ) {
            throw new Error(
                `Preset "${preset.id}" has an invalid annualPayment.`,
            );
        }

        if (
            !Number.isFinite(
                preset.acquisition.exitFee,
            ) ||
            preset.acquisition.exitFee < 0
        ) {
            throw new Error(
                `Preset "${preset.id}" has an invalid exitFee.`,
            );
        }
    }
}

/**
 * Verifies that one fleet vehicle contains safe simulation values.
 * @param vehicle Fleet vehicle to validate.
 * @param analysis Analysis period used to validate replacement year.
 * @throws Error when a vehicle value is invalid.
 */
function validateFleetVehicle(
    vehicle: FleetVehicle,
    analysis: AnalysisSettings,
): void {
    const nonNegativeFields = [
        "annualKm",
        "typicalDailyKm",
        "operatingDays",
        "depotDwellHours",
    ] as const;

    for (const field of nonNegativeFields) {
        const value = vehicle[field];

        if (
            !Number.isFinite(value) ||
            value < 0
        ) {
            throw new Error(
                `Vehicle "${vehicle.id}" has an invalid ${field}.`,
            );
        }
    }

    // Operating days represents a whole number of days.
    if (!Number.isInteger(vehicle.operatingDays)) {
        throw new Error(
            `Vehicle "${vehicle.id}" has an invalid operatingDays.`,
        );
    }

    // Utilisation is stored as a ratio from zero to one.
    if (
        !Number.isFinite(vehicle.utilisation) ||
        vehicle.utilisation < 0 ||
        vehicle.utilisation > 1
    ) {
        throw new Error(
            `Vehicle "${vehicle.id}" has an invalid utilisation.`,
        );
    }

    // Replacement is optional but must fall inside the analysis.
    if (vehicle.replacementYear !== null) {
        const finalYear =
            analysis.startYear +
            analysis.yearCount -
            1;

        if (
            !Number.isInteger(vehicle.replacementYear) ||
            vehicle.replacementYear < analysis.startYear ||
            vehicle.replacementYear > finalYear
        ) {
            throw new Error(
                `Vehicle "${vehicle.id}" has an invalid replacementYear.`,
            );
        }
    }

    // Validates the existing owned vehicle.
    if (vehicle.currentHolding.kind === "owned") {
        if (
            !Number.isFinite(
                vehicle.currentHolding.currentValue,
            ) ||
            vehicle.currentHolding.currentValue < 0
        ) {
            throw new Error(
                `Vehicle "${vehicle.id}" has an invalid currentValue.`,
            );
        }

        if (
            !Number.isFinite(
                vehicle.currentHolding.endResidualValue,
            ) ||
            vehicle.currentHolding.endResidualValue < 0
        ) {
            throw new Error(
                `Vehicle "${vehicle.id}" has an invalid endResidualValue.`,
            );
        }
    }

    // Validates the existing leased vehicle.
    if (vehicle.currentHolding.kind === "leased") {
        if (
            !Number.isFinite(
                vehicle.currentHolding.annualPayment,
            ) ||
            vehicle.currentHolding.annualPayment < 0
        ) {
            throw new Error(
                `Vehicle "${vehicle.id}" has an invalid annualPayment.`,
            );
        }

        if (
            !Number.isFinite(
                vehicle.currentHolding.exitFee,
            ) ||
            vehicle.currentHolding.exitFee < 0
        ) {
            throw new Error(
                `Vehicle "${vehicle.id}" has an invalid exitFee.`,
            );
        }
    }
}

/**
 * Verifies scenario vehicle references and transition years.
 * @param input Complete project and scenario simulation input.
 * @throws Error when a scenario plan is invalid.
 */
function validateScenarioPlans(
    input: SimulationInput,
): void {
    const project = input.project;
    const scenario = input.scenario;

    const vehicleIds = new Set(
        project.fleetVehicles.map(
            (vehicle) => vehicle.id,
        ),
    );

    const presetIds = new Set(
        project.vehiclePresets.map(
            (preset) => preset.id,
        ),
    );

    const finalYear =
        project.analysis.startYear +
        project.analysis.yearCount -
        1;

    for (
        const [vehicleId, plan]
        of Object.entries(scenario.vehiclePlans)
    ) {
        // The scenario plan must belong to an existing vehicle.
        if (!vehicleIds.has(vehicleId)) {
            throw new Error(
                `Scenario plan references missing vehicle "${vehicleId}".`,
            );
        }

        // The selected target must be an existing preset.
        if (
            plan.targetPresetId !== undefined &&
            !presetIds.has(plan.targetPresetId)
        ) {
            throw new Error(
                `Scenario plan for "${vehicleId}" references missing preset "${plan.targetPresetId}".`,
            );
        }

        // A transition year is optional but must be inside the analysis.
        if (
            plan.transitionYear !== undefined &&
            plan.transitionYear !== null &&
            (
                !Number.isInteger(plan.transitionYear) ||
                plan.transitionYear <
                project.analysis.startYear ||
                plan.transitionYear > finalYear
            )
        ) {
            throw new Error(
                `Scenario plan for "${vehicleId}" has an invalid transitionYear.`,
            );
        }
    }
}

/** Validates every input used by the simulation engine. */
export function validateSimulationInput(input: SimulationInput): void {
    const { project, scenario } = input;
    validateAnalysisSettings(project.analysis);
    validateScenarioAssumptions(scenario.assumptions);

    for (const preset of project.vehiclePresets) {
        validateVehiclePreset(preset);
    }

    for (const vehicle of project.fleetVehicles) {
        validateFleetVehicle(vehicle, project.analysis);
    }

    validateScenarioPlans(input);
}
