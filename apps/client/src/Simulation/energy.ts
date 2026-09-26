import type { M1VehiclePreset } from "../domain/contracts";

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
