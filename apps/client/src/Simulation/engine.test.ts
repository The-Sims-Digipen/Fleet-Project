import { describe, expect, it } from "vitest";
import { sim01Project, sim01Scenario } from "../domain/m1Fixture";
import { calculateAnnualEnergy } from "./engine";
import { calculateAnnualOperatingCost } from "./engine";
import { calculateAnnualEmissions } from "./engine";
import { calculateAnnualOperation } from "./engine";
import { calculateBaselineVehicleYears } from "./engine";
import { calculateScenarioVehicleYears } from "./engine";
import { calculatePlanTotals } from "./engine";
import { calculatePayback } from "./engine";
import { calculateElectricityPrice } from "./engine";

import { combineVehicleYears } from "./engine";
import { comparePlanYears } from "./engine";

//Arrange: Find preset and choose an annual distance
//Act: call caclulateAnnualEnergy
//Assert: COmpare the returned values with expected values

describe("calculateAnnualEnergy", () => {

    /*
    *
    * Using vitest to test the program 
    * 
    * - describe("group name", callback)
    * - Groups related tests together.
    * - First parameter: name of the function or feature being tested.
    * - Second parameter: function containing the related it(...) tests.
    * 
    * it("test description", callback)
    * - Creates one test.
    * - First parameter: name describing the expected behaviour.
    * - Second parameter: function containing the test code.
    *
    * expect(actualValue)
    * - Receives the value produced by the code being tested.
    * - Must be followed by a matcher such as toBe or toBeDefined.
    *
    * toBe(expectedValue)
    * - Checks that the actual value exactly equals the expected value.
    * - Example: expect(result.fuelLitres).toBe(1_000);
    *
    * toBeDefined()
    * - Checks that the value is not undefined.
    * - Useful after Array.find(), which may not find an item.
    * - Example: expect(preset).toBeDefined();
    */
    it("calculates annual fuel consumption for a diesel vehicle", () => {
        const dieselPreset = sim01Project.vehiclePresets.find(
            (preset) => preset.id === "sim01-diesel",
        );

        expect(dieselPreset).toBeDefined();

        if (!dieselPreset) {
            throw new Error("SIM01 diesel preset is missing");
        }

        const result = calculateAnnualEnergy(
            10_000,
            dieselPreset,
        );

        expect(result.fuelLitres).toBe(1_000);
        expect(result.electricityKWh).toBe(0);
    });

    it("calculates annual electricity consumption for an electric vehicle", () => {
        const electricPreset = sim01Project.vehiclePresets.find(
            (preset) => preset.id === "sim01-electric",
        );

        expect(electricPreset).toBeDefined();

        if (!electricPreset) {
            throw new Error("SIM01 electric preset is missing");
        }

        const result = calculateAnnualEnergy(
            10_000,
            electricPreset,
        );

        expect(result.fuelLitres).toBe(0);
        expect(result.electricityKWh).toBe(2_000);
    });
});

describe("calculateAnnualOperatingCost", () => {
    it("calculates diesel annual operating cost", () => {
        const dieselPreset = sim01Project.vehiclePresets.find(
            (preset) => preset.id === "sim01-diesel",
        );

        expect(dieselPreset).toBeDefined();

        if (!dieselPreset) {
            throw new Error("SIM01 diesel preset is missing");
        }

        const operatingCost = calculateAnnualOperatingCost(
            10_000,
            dieselPreset,
            2,
            0.25,
        );

        expect(operatingCost).toBe(2_500);
    });

    it("calculates electric annual operating cost", () => {
        const electricPreset = sim01Project.vehiclePresets.find(
            (preset) => preset.id === "sim01-electric",
        );

        expect(electricPreset).toBeDefined();

        if (!electricPreset) {
            throw new Error("SIM01 electric preset is missing");
        }

        const operatingCost = calculateAnnualOperatingCost(
            10_000,
            electricPreset,
            2,
            0.25,
        );

        expect(operatingCost).toBe(700);
    });
});

describe("calculateAnnualEmissions", () => {
    it("calculates diesel annual emissions", () => {
        const dieselPreset = sim01Project.vehiclePresets.find(
            (preset) => preset.id === "sim01-diesel",
        );

        expect(dieselPreset).toBeDefined();

        if (!dieselPreset) {
            throw new Error("SIM01 diesel preset is missing");
        }

        const energy = calculateAnnualEnergy(
            10_000,
            dieselPreset,
        );

        const emissions = calculateAnnualEmissions(
            energy,
            2,
            0.5,
        );

        expect(emissions).toBe(2_000);
    });

    it("calculates electric annual emissions", () => {
        const electricPreset = sim01Project.vehiclePresets.find(
            (preset) => preset.id === "sim01-electric",
        );

        expect(electricPreset).toBeDefined();

        if (!electricPreset) {
            throw new Error("SIM01 electric preset is missing");
        }

        const energy = calculateAnnualEnergy(
            10_000,
            electricPreset,
        );

        const emissions = calculateAnnualEmissions(
            energy,
            2,
            0.5,
        );

        expect(emissions).toBe(1_000);
    });
});

describe("calculateAnnualOperation", () => {
    it("combines diesel cost, energy and emissions", () => {
        const dieselPreset = sim01Project.vehiclePresets.find(
            (preset) => preset.id === "sim01-diesel",
        );

        expect(dieselPreset).toBeDefined();

        if (!dieselPreset) {
            throw new Error("SIM01 diesel preset is missing");
        }

        const result = calculateAnnualOperation(
            10_000,
            dieselPreset,
            2,
            0.25,
            2,
            0.5,
        );

        expect(result).toEqual({
            operatingCost: 2_500,
            fuelLitres: 1_000,
            electricityKWh: 0,
            emissionsKgCo2e: 2_000,
        });
    });

    it("combines electric cost, energy and emissions", () => {
        const electricPreset = sim01Project.vehiclePresets.find(
            (preset) => preset.id === "sim01-electric",
        );

        expect(electricPreset).toBeDefined();

        if (!electricPreset) {
            throw new Error("SIM01 electric preset is missing");
        }

        const result = calculateAnnualOperation(
            10_000,
            electricPreset,
            2,
            0.25,
            2,
            0.5,
        );

        expect(result).toEqual({
            operatingCost: 700,
            fuelLitres: 0,
            electricityKWh: 2_000,
            emissionsKgCo2e: 1_000,
        });
    });
});

describe("calculateBaselineVehicleYears", () => {
    it("calculates four years of SIM01 baseline operation", () => {
        const vehicle = sim01Project.fleetVehicles.find(
            (item) => item.id === "SIM01-VEHICLE",
        );

        expect(vehicle).toBeDefined();

        if (!vehicle) {
            throw new Error("SIM01 vehicle is missing");
        }

        const preset = sim01Project.vehiclePresets.find(
            (item) => item.id === vehicle.currentPresetId,
        );

        expect(preset).toBeDefined();

        if (!preset) {
            throw new Error("SIM01 current preset is missing");
        }

        const results = calculateBaselineVehicleYears(
            vehicle,
            preset,
            sim01Project.analysis,
            sim01Scenario.assumptions.externalElectricityPricePerKWh,
        );

        // SIM01 runs from 2026 to 2029: four years.
        expect(results).toHaveLength(4);

        // Each year costs $2,500.
        expect(results.map((result) => result.operatingCost)).toEqual([
            2_500,
            2_500,
            2_500,
            2_500,
        ]);

        // Cumulative cost increases by $2,500 each year.
        expect(results.map((result) => result.cumulativeCashCost)).toEqual([
            2_500,
            5_000,
            7_500,
            10_000,
        ]);

        // Check the complete first-year result.
        expect(results[0]).toEqual({
            acquisitionCapex: 0,
            operatingCost: 2_500,
            disposalCredits: 0,
            netCashCost: 2_500,
            cumulativeCashCost: 2_500,
            fuelLitres: 1_000,
            electricityKWh: 0,
            emissionsKgCo2e: 2_000,
        });
    });
});

describe("calculateScenarioVehicleYears", () => {
    it("transitions the SIM01 vehicle to electric in 2026", () => {
        const vehicle = sim01Project.fleetVehicles.find(
            (item) => item.id === "SIM01-VEHICLE",
        );

        expect(vehicle).toBeDefined();

        if (!vehicle) {
            throw new Error("SIM01 vehicle is missing");
        }

        const plan =
            sim01Scenario.vehiclePlans[vehicle.id];

        const results = calculateScenarioVehicleYears(
            vehicle,
            plan,
            sim01Project.vehiclePresets,
            sim01Project.analysis,
            sim01Scenario.assumptions.externalElectricityPricePerKWh,
        );

        // SIM01 contains four simulation years.
        expect(results).toHaveLength(4);

        // The electric vehicle is purchased only in 2026.
        expect(
            results.map((result) => result.acquisitionCapex),
        ).toEqual([
            12_000,
            0,
            0,
            0,
        ]);

        // Electric operation costs $700 every year.
        expect(
            results.map((result) => result.operatingCost),
        ).toEqual([
            700,
            700,
            700,
            700,
        ]);

        // CAPEX and operating costs form the annual cash costs.
        expect(
            results.map((result) => result.netCashCost),
        ).toEqual([
            12_700,
            700,
            700,
            700,
        ]);

        // Each annual cash cost is added to the previous total.
        expect(
            results.map((result) => result.cumulativeCashCost),
        ).toEqual([
            12_700,
            13_400,
            14_100,
            14_800,
        ]);

        // The scenario consumes electricity instead of diesel.
        expect(
            results.map((result) => result.electricityKWh),
        ).toEqual([
            2_000,
            2_000,
            2_000,
            2_000,
        ]);

        expect(
            results.map((result) => result.fuelLitres),
        ).toEqual([
            0,
            0,
            0,
            0,
        ]);
    });
});

describe("calculatePlanTotals", () => {
    it("calculates the SIM01 baseline totals", () => {
        const vehicle = sim01Project.fleetVehicles.find(
            (item) => item.id === "SIM01-VEHICLE",
        );

        expect(vehicle).toBeDefined();

        if (!vehicle) {
            throw new Error("SIM01 vehicle is missing");
        }

        const preset = sim01Project.vehiclePresets.find(
            (item) => item.id === vehicle.currentPresetId,
        );

        expect(preset).toBeDefined();

        if (!preset) {
            throw new Error("SIM01 current preset is missing");
        }

        const years = calculateBaselineVehicleYears(
            vehicle,
            preset,
            sim01Project.analysis,
            sim01Scenario.assumptions.externalElectricityPricePerKWh,
        );

        // The existing diesel vehicle has no terminal value in SIM01.
        const totals = calculatePlanTotals(years, 0);

        expect(totals).toEqual({
            acquisitionCapex: 0,
            operatingCost: 10_000,
            disposalCredits: 0,
            terminalCredits: 0,
            tco: 10_000,
            fuelLitres: 4_000,
            electricityKWh: 0,
            emissionsKgCo2e: 8_000,
        });
    });

    it("calculates the SIM01 scenario totals", () => {
        const vehicle = sim01Project.fleetVehicles.find(
            (item) => item.id === "SIM01-VEHICLE",
        );

        expect(vehicle).toBeDefined();

        if (!vehicle) {
            throw new Error("SIM01 vehicle is missing");
        }

        const plan =
            sim01Scenario.vehiclePlans[vehicle.id];

        const years = calculateScenarioVehicleYears(
            vehicle,
            plan,
            sim01Project.vehiclePresets,
            sim01Project.analysis,
            sim01Scenario.assumptions.externalElectricityPricePerKWh,
        );

        const electricPreset = sim01Project.vehiclePresets.find(
            (preset) => preset.id === "sim01-electric",
        );

        expect(electricPreset).toBeDefined();

        if (!electricPreset) {
            throw new Error("SIM01 electric preset is missing");
        }

        if (electricPreset.acquisition.kind !== "owned") {
            throw new Error("SIM01 electric preset must be owned");
        }

        // The EV remains owned at the end of the analysis.
        const terminalCredits =
            electricPreset.acquisition.endResidualValue;

        const totals = calculatePlanTotals(
            years,
            terminalCredits,
        );

        expect(totals).toEqual({
            acquisitionCapex: 12_000,
            operatingCost: 2_800,
            disposalCredits: 0,
            terminalCredits: 2_000,
            tco: 12_800,
            fuelLitres: 0,
            electricityKWh: 8_000,
            emissionsKgCo2e: 4_000,
        });
    });
});

describe("comparePlanYears", () => {
    it("compares the SIM01 baseline and scenario by year", () => {
        const vehicle = sim01Project.fleetVehicles.find(
            (item) => item.id === "SIM01-VEHICLE",
        );

        expect(vehicle).toBeDefined();

        if (!vehicle) {
            throw new Error("SIM01 vehicle is missing");
        }

        const baselinePreset = sim01Project.vehiclePresets.find(
            (preset) => preset.id === vehicle.currentPresetId,
        );

        expect(baselinePreset).toBeDefined();

        if (!baselinePreset) {
            throw new Error("SIM01 baseline preset is missing");
        }

        const baselineYears = calculateBaselineVehicleYears(
            vehicle,
            baselinePreset,
            sim01Project.analysis,
            sim01Scenario.assumptions.externalElectricityPricePerKWh,
        );

        const scenarioYears = calculateScenarioVehicleYears(
            vehicle,
            sim01Scenario.vehiclePlans[vehicle.id],
            sim01Project.vehiclePresets,
            sim01Project.analysis,
            sim01Scenario.assumptions.externalElectricityPricePerKWh,
        );

        const comparisons = comparePlanYears(
            baselineYears,
            scenarioYears,
            sim01Project.analysis.startYear,
        );

        expect(
            comparisons.map(
                (comparison) => comparison.year,
            ),
        ).toEqual([
            2026,
            2027,
            2028,
            2029,
        ]);

        expect(
            comparisons.map(
                (comparison) => comparison.cumulativeCashSavings,
            ),
        ).toEqual([
            -10_200,
            -8_400,
            -6_600,
            -4_800,
        ]);
    });
});

describe("comparePlanYears", () => {
    it("compares the SIM01 baseline and scenario by year", () => {
        const vehicle = sim01Project.fleetVehicles.find(
            (item) => item.id === "SIM01-VEHICLE",
        );

        expect(vehicle).toBeDefined();

        if (!vehicle) {
            throw new Error("SIM01 vehicle is missing");
        }

        const baselinePreset = sim01Project.vehiclePresets.find(
            (preset) => preset.id === vehicle.currentPresetId,
        );

        expect(baselinePreset).toBeDefined();

        if (!baselinePreset) {
            throw new Error("SIM01 baseline preset is missing");
        }

        const baselineYears = calculateBaselineVehicleYears(
            vehicle,
            baselinePreset,
            sim01Project.analysis,
            sim01Scenario.assumptions.externalElectricityPricePerKWh,
        );

        const scenarioYears = calculateScenarioVehicleYears(
            vehicle,
            sim01Scenario.vehiclePlans[vehicle.id],
            sim01Project.vehiclePresets,
            sim01Project.analysis,
            sim01Scenario.assumptions.externalElectricityPricePerKWh,
        );

        const comparisons = comparePlanYears(
            baselineYears,
            scenarioYears,
            sim01Project.analysis.startYear,
        );

        expect(
            comparisons.map(
                (comparison) => comparison.year,
            ),
        ).toEqual([
            2026,
            2027,
            2028,
            2029,
        ]);

        expect(
            comparisons.map(
                (comparison) => comparison.cumulativeCashSavings,
            ),
        ).toEqual([
            -10_200,
            -8_400,
            -6_600,
            -4_800,
        ]);
    });
});

describe("calculatePayback", () => {
    it("returns not-reached for the normal SIM01 scenario", () => {
        const vehicle = sim01Project.fleetVehicles.find(
            (item) => item.id === "SIM01-VEHICLE",
        );

        expect(vehicle).toBeDefined();

        if (!vehicle) {
            throw new Error("SIM01 vehicle is missing");
        }

        const baselinePreset = sim01Project.vehiclePresets.find(
            (preset) => preset.id === vehicle.currentPresetId,
        );

        expect(baselinePreset).toBeDefined();

        if (!baselinePreset) {
            throw new Error("SIM01 baseline preset is missing");
        }

        const baselineYears = calculateBaselineVehicleYears(
            vehicle,
            baselinePreset,
            sim01Project.analysis,
            sim01Scenario.assumptions.externalElectricityPricePerKWh,
        );

        const scenarioYears = calculateScenarioVehicleYears(
            vehicle,
            sim01Scenario.vehiclePlans[vehicle.id],
            sim01Project.vehiclePresets,
            sim01Project.analysis,
            sim01Scenario.assumptions.externalElectricityPricePerKWh,
        );

        const comparisons = comparePlanYears(
            baselineYears,
            scenarioYears,
            sim01Project.analysis.startYear,
        );

        const payback = calculatePayback(comparisons);

        expect(payback).toEqual({
            status: "not-reached",
            year: null,
        });
    });

    it("returns the first year where savings reach and keep payback", () => {
        const vehicle = sim01Project.fleetVehicles.find(
            (item) => item.id === "SIM01-VEHICLE",
        );

        expect(vehicle).toBeDefined();

        if (!vehicle) {
            throw new Error("SIM01 vehicle is missing");
        }

        const baselinePreset = sim01Project.vehiclePresets.find(
            (preset) => preset.id === vehicle.currentPresetId,
        );

        expect(baselinePreset).toBeDefined();

        if (!baselinePreset) {
            throw new Error("SIM01 baseline preset is missing");
        }

        const baselineYears = calculateBaselineVehicleYears(
            vehicle,
            baselinePreset,
            sim01Project.analysis,
            sim01Scenario.assumptions.externalElectricityPricePerKWh,
        );

        const scenarioYears = calculateScenarioVehicleYears(
            vehicle,
            sim01Scenario.vehiclePlans[vehicle.id],
            sim01Project.vehiclePresets,
            sim01Project.analysis,
            sim01Scenario.assumptions.externalElectricityPricePerKWh,
        );

        const comparisons = comparePlanYears(
            baselineYears,
            scenarioYears,
            sim01Project.analysis.startYear,
        );

        // Replaces only the savings values to test the payback rule.
        const paybackComparisons = comparisons.map(
            (comparison, index) => ({
                ...comparison,
                cumulativeCashSavings: [
                    -4_200,
                    -2_400,
                    -600,
                    1_200,
                ][index],
            }),
        );

        const payback =
            calculatePayback(paybackComparisons);

        expect(payback).toEqual({
            status: "reached",
            year: 2029,
        });
    });
});

describe("combineVehicleYears", () => {
    it("combines annual results from multiple vehicles", () => {
        const vehicle = sim01Project.fleetVehicles.find(
            (item) => item.id === "SIM01-VEHICLE",
        );

        expect(vehicle).toBeDefined();

        if (!vehicle) {
            throw new Error("SIM01 vehicle is missing");
        }

        const preset = sim01Project.vehiclePresets.find(
            (item) => item.id === vehicle.currentPresetId,
        );

        expect(preset).toBeDefined();

        if (!preset) {
            throw new Error("SIM01 current preset is missing");
        }

        const firstVehicleYears =
            calculateBaselineVehicleYears(
                vehicle,
                preset,
                sim01Project.analysis,
                sim01Scenario.assumptions.externalElectricityPricePerKWh,
            );

        // Reuses the same fixture result to represent a second identical vehicle.
        const secondVehicleYears =
            calculateBaselineVehicleYears(
                vehicle,
                preset,
                sim01Project.analysis,
                sim01Scenario.assumptions.externalElectricityPricePerKWh,
            );

        const fleetYears = combineVehicleYears([
            firstVehicleYears,
            secondVehicleYears,
        ]);

        expect(fleetYears).toHaveLength(4);

        // Two vehicles each cost $2,500 annually.
        expect(
            fleetYears.map((year) => year.operatingCost),
        ).toEqual([
            5_000,
            5_000,
            5_000,
            5_000,
        ]);

        // Two vehicles each consume 1,000 litres annually.
        expect(
            fleetYears.map((year) => year.fuelLitres),
        ).toEqual([
            2_000,
            2_000,
            2_000,
            2_000,
        ]);

        // Fleet cumulative cost is recalculated from combined annual costs.
        expect(
            fleetYears.map((year) => year.cumulativeCashCost),
        ).toEqual([
            5_000,
            10_000,
            15_000,
            20_000,
        ]);
    });

    it("returns an empty array for an empty fleet", () => {
        const fleetYears = combineVehicleYears([]);

        expect(fleetYears).toEqual([]);
    });
});

describe("calculateElectricityPrice", () => {
    it("uses the external price for external-only charging", () => {
        const price = calculateElectricityPrice({
            chargingStrategy: "external",
            depotChargingShare: 0,
            depotElectricityPricePerKWh: 0.2,
            externalElectricityPricePerKWh: 0.4,
        });

        expect(price).toBe(0.4);
    });

    it("uses the depot price for depot-only charging", () => {
        const price = calculateElectricityPrice({
            chargingStrategy: "depot",
            depotChargingShare: 1,
            depotElectricityPricePerKWh: 0.2,
            externalElectricityPricePerKWh: 0.4,
        });

        expect(price).toBe(0.2);
    });

    it("calculates a weighted price for mixed charging", () => {
        const price = calculateElectricityPrice({
            chargingStrategy: "mixed",
            depotChargingShare: 0.6,
            depotElectricityPricePerKWh: 0.2,
            externalElectricityPricePerKWh: 0.4,
        });

        expect(price).toBeCloseTo(0.28);
    });
});