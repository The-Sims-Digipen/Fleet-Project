export type EconomicAssumptions = {
    fuelPricePerLitre: number;
    electricityPricePerKwh: number;
}

export type EnergyAssumptions = {
    fuelKgCo2PerLitre: number;
    electricityCo2PerLitre: number;
    chargingEfficiency: number;
}

export type AssumptionIssue = {
    field: string;
    message: string;
}

//Lambda function used to check if the value is non-zero and a finite value
//Return types is boolean. One line no specifc return
const isNonNegativeFinite = (value: number): boolean =>
    Number.isFinite(value) && value >= 0;


export function validateEconomicAssumptions(
    assumptions: EconomicAssumptions,
): AssumptionIssue[] {
    const issues: AssumptionIssue[] = [];

    if (!isNonNegativeFinite(assumptions.electricityPricePerKwh)) {
        issues.push({
            field: "electricityPricePerKwh",
            message: "Electricity price must be a finite number and a positive number and non-zero"
        });
    }

    if (!isNonNegativeFinite(assumptions.fuelPricePerLitre)) {
        issues.push({
            field: "fuelPricePerLitre",
            message: "Fuel price must be a finite number and a positive number and non-zero"
        });
    }

    //Checking if there are any issues, if there are any issues then it will return
    return issues;

}

export function validateEnergyAssumptions(
    assumptions: EnergyAssumptions
): AssumptionIssue[] {

    let issues: AssumptionIssue[] = [];

    if (
        !Number.isFinite(assumptions.chargingEfficiency) ||
        assumptions.chargingEfficiency <= 0 ||
        assumptions.chargingEfficiency > 1
    ) {
        issues.push({
            field: "chargingEfficiency",
            message: "Charging efficiency must be greater than 0 and at most 1",
        });
    }

    if (!isNonNegativeFinite(assumptions.electricityCo2PerLitre)) {
        issues.push({
            field: "electricityCo2PerLitre",
            message: "Electricity Co2 per litre must be a finite number and a positive number and non-zero"
        });
    }

    if (!isNonNegativeFinite(assumptions.fuelKgCo2PerLitre)) {
        issues.push({
            field: "fuelKgCo2PerLitre",
            message: "Fuel Co2 per litre must be a finite number and a positive number and non-zero"
        });
    }

    return issues;
}
