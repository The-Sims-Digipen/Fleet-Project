import type { ScenarioAssumptions } from "../domain/contracts";

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
