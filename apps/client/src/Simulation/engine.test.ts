import { describe, expect, it } from "vitest";
import { sim01Project, sim01Scenario, sim01Expected } from "../domain/m1Fixture";
import { calculateAnnualEnergy } from "./engine";
import { calculateAnnualOperatingCost } from "./engine";
import { calculateAnnualEmissions } from "./engine";
import { calculateAnnualOperation } from "./engine";
import { calculateBaselineVehicleYears } from "./engine";
import { calculateScenarioVehicleYears } from "./engine";
import { calculatePlanTotals } from "./engine";
import { calculatePayback } from "./engine";
import { calculateElectricityPrice } from "./engine";
import { calculateDisposalValue } from "./engine";
import { calculateVehicleTerminalCredit } from "./engine"
import { simulate } from "./engine"

import { validateEnergyAssumptions } from "./assumptions";

import type {
    AnalysisSettings,
    FleetVehicle,
    M1VehiclePreset,
    ScenarioVehiclePlan,
    SimulationInput,
} from "../domain/contracts";

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

    it("replaces an owned vehicle and credits its disposal value", () => {
        // Creates independent copies so the shared SIM01 fixture is not modified.
        const project =
            structuredClone(sim01Project);

        const vehicle =
            project.fleetVehicles[0];

        const preset =
            project.vehiclePresets[0];

        // Changes the analysis to the three-year SIM02 period.
        project.analysis.yearCount = 3;

        // Removes operational costs so the test focuses on replacement.
        vehicle.annualKm = 0;
        preset.maintenanceCostPerYear = 0;

        // Replaces the existing vehicle during the second year.
        vehicle.replacementYear = 2027;

        // Gives the existing vehicle SIM02's current and residual values.
        vehicle.currentHolding = {
            kind: "owned",
            currentValue: 6_000,
            endResidualValue: 0,
        };

        // Gives the replacement vehicle SIM02's purchase and residual values.
        preset.purchaseCost = 9_000;
        preset.acquisition = {
            kind: "owned",
            endResidualValue: 3_000,
        };

        const results =
            calculateBaselineVehicleYears(
                vehicle,
                preset,
                project.analysis,
                0,
            );

        // The existing vehicle is sold for $4,000 in 2027.
        expect(
            results.map((result) => result.disposalCredits),
        ).toEqual([
            0,
            4_000,
            0,
        ]);

        // The $9,000 replacement is purchased in 2027.
        expect(
            results.map((result) => result.acquisitionCapex),
        ).toEqual([
            0,
            9_000,
            0,
        ]);

        // The replacement-year cash cost is $9,000 − $4,000.
        expect(
            results.map((result) => result.netCashCost),
        ).toEqual([
            0,
            5_000,
            0,
        ]);

        // The replacement remains worth $3,000 at the horizon.
        const totals = calculatePlanTotals(
            results,
            3_000,
        );

        expect(totals.tco).toBe(2_000);
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

    it("replaces the baseline vehicle before a later scenario transition", () => {
        const vehicle: FleetVehicle = {
            ...sim01Project.fleetVehicles[0],
            annualKm: 0,
            replacementYear: 2027,
            currentHolding: {
                kind: "owned",
                currentValue: 6_000,
                endResidualValue: 0,
            },
        };

        const currentPreset: M1VehiclePreset = {
            ...sim01Project.vehiclePresets[0],
            id: "current",
            purchaseCost: 9_000,
            maintenanceCostPerYear: 0,
            acquisition: {
                kind: "owned",
                endResidualValue: 3_000,
            },
        };

        const targetPreset: M1VehiclePreset = {
            ...sim01Project.vehiclePresets[1],
            id: "target",
            purchaseCost: 12_000,
            maintenanceCostPerYear: 0,
            acquisition: {
                kind: "owned",
                endResidualValue: 4_000,
            },
        };

        vehicle.currentPresetId = currentPreset.id;

        const plan: ScenarioVehiclePlan = {
            targetPresetId: targetPreset.id,
            transitionYear: 2028,
        };

        const analysis: AnalysisSettings = {
            ...sim01Project.analysis,
            startYear: 2026,
            yearCount: 3,
        };

        const results = calculateScenarioVehicleYears(
            vehicle,
            plan,
            [currentPreset, targetPreset],
            analysis,
            0,
        );

        // 2026: no replacement or transition.
        expect(results[0].acquisitionCapex).toBe(0);
        expect(results[0].disposalCredits).toBe(0);
        expect(results[0].netCashCost).toBe(0);

        // 2027: sell the original vehicle and acquire the current preset.
        expect(results[1].acquisitionCapex).toBe(9_000);
        expect(results[1].disposalCredits).toBe(4_000);
        expect(results[1].netCashCost).toBe(5_000);

        // 2028: sell the replacement and acquire the scenario target.
        expect(results[2].acquisitionCapex).toBe(12_000);
        expect(results[2].disposalCredits).toBe(6_000);
        expect(results[2].netCashCost).toBe(6_000);
        expect(results[2].cumulativeCashCost).toBe(11_000);
    });

    it("uses the scenario transition when replacement occurs in the same year", () => {
        const vehicle: FleetVehicle = {
            ...sim01Project.fleetVehicles[0],
            currentPresetId: "current",
            annualKm: 0,
            replacementYear: 2027,
            currentHolding: {
                kind: "owned",
                currentValue: 6_000,
                endResidualValue: 0,
            },
        };

        const currentPreset: M1VehiclePreset = {
            ...sim01Project.vehiclePresets[0],
            id: "current",
            purchaseCost: 9_000,
            maintenanceCostPerYear: 0,
            acquisition: {
                kind: "owned",
                endResidualValue: 3_000,
            },
        };

        const targetPreset: M1VehiclePreset = {
            ...sim01Project.vehiclePresets[1],
            id: "target",
            purchaseCost: 12_000,
            maintenanceCostPerYear: 0,
            acquisition: {
                kind: "owned",
                endResidualValue: 4_000,
            },
        };

        const plan: ScenarioVehiclePlan = {
            targetPresetId: targetPreset.id,
            transitionYear: 2027,
        };

        const analysis: AnalysisSettings = {
            ...sim01Project.analysis,
            startYear: 2026,
            yearCount: 3,
        };

        const results = calculateScenarioVehicleYears(
            vehicle,
            plan,
            [currentPreset, targetPreset],
            analysis,
            0,
        );

        // 2026: the existing vehicle remains active.
        expect(results[0].acquisitionCapex).toBe(0);
        expect(results[0].netCashCost).toBe(0);

        // 2027: transition directly to the target vehicle.
        expect(results[1].acquisitionCapex).toBe(12_000);
        expect(results[1].disposalCredits).toBe(4_000);
        expect(results[1].netCashCost).toBe(8_000);

        // No second acquisition occurs.
        expect(results[2].acquisitionCapex).toBe(0);
        expect(results[2].netCashCost).toBe(0);
        expect(results[2].cumulativeCashCost).toBe(8_000);
    });

    it("charges lease payments and the outgoing lease exit fee", () => {
        const vehicle: FleetVehicle = {
            ...sim01Project.fleetVehicles[0],
            currentPresetId: "leased-current",
            annualKm: 0,
            replacementYear: null,
            currentHolding: {
                kind: "leased",
                annualPayment: 1_000,
                exitFee: 100,
            },
        };

        const currentPreset: M1VehiclePreset = {
            ...sim01Project.vehiclePresets[0],
            id: "leased-current",
            purchaseCost: 0,
            maintenanceCostPerYear: 0,
            acquisition: {
                kind: "leased",
                annualPayment: 1_000,
                exitFee: 100,
            },
        };

        const targetPreset: M1VehiclePreset = {
            ...sim01Project.vehiclePresets[1],
            id: "leased-target",
            purchaseCost: 0,
            maintenanceCostPerYear: 0,
            acquisition: {
                kind: "leased",
                annualPayment: 800,
                exitFee: 0,
            },
        };

        const plan: ScenarioVehiclePlan = {
            targetPresetId: targetPreset.id,
            transitionYear: 2026,
        };

        const analysis: AnalysisSettings = {
            ...sim01Project.analysis,
            startYear: 2026,
            yearCount: 2,
        };

        const results = calculateScenarioVehicleYears(
            vehicle,
            plan,
            [currentPreset, targetPreset],
            analysis,
            0,
        );

        // A lease does not create purchase CAPEX.
        expect(
            results.map((result) => result.acquisitionCapex),
        ).toEqual([0, 0]);

        // A lease does not create owned-vehicle disposal credits.
        expect(
            results.map((result) => result.disposalCredits),
        ).toEqual([0, 0]);

        // The target lease costs $800 per year.
        expect(
            results.map((result) => result.operatingCost),
        ).toEqual([800, 800]);

        // The first year includes the old lease's $100 exit fee.
        expect(
            results.map((result) => result.netCashCost),
        ).toEqual([900, 800]);

        expect(
            results.map((result) => result.cumulativeCashCost),
        ).toEqual([900, 1_700]);
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

describe("simulate", () => {
    it("returns the basic SIM01 result", () => {
        const result = simulate({
            project: sim01Project,
            scenario: sim01Scenario,
        });

        expect(result.modelVersion).toBe("annual-v1");

        expect(result.baseline.tco).toBe(
            sim01Expected.baselineTco,
        );

        expect(result.scenario.tco).toBe(
            sim01Expected.scenarioTco,
        );

        expect(result.savings).toBe(
            sim01Expected.savings,
        );

        expect(result.annual).toHaveLength(4);

        expect(result.payback).toEqual({
            status: "not-reached",
            year: null,
        });
    });

    it("rejects a zero-year analysis period", () => {
        const project = structuredClone(sim01Project);
        const scenario = structuredClone(sim01Scenario);

        project.analysis.yearCount = 0;

        expect(() =>
            simulate({
                project,
                scenario,
            }),
        ).toThrow(
            "Analysis year count must be a positive integer.",
        );
    });

    it("rejects a depot charging share above one", () => {
        const project = structuredClone(sim01Project);
        const scenario = structuredClone(sim01Scenario);

        scenario.assumptions.depotChargingShare = 1.1;

        expect(() =>
            simulate({
                project,
                scenario,
            }),
        ).toThrow(
            "Depot charging share must be between 0 and 1.",
        );
    });

    it("rejects a negative external electricity price", () => {
        const project = structuredClone(sim01Project);
        const scenario = structuredClone(sim01Scenario);

        scenario.assumptions.externalElectricityPricePerKWh =
            -0.25;

        expect(() =>
            simulate({
                project,
                scenario,
            }),
        ).toThrow(
            "External electricity price must be a nonnegative finite number.",
        );
    });

    it("rejects a non-finite depot electricity price", () => {
        const project = structuredClone(sim01Project);
        const scenario = structuredClone(sim01Scenario);

        scenario.assumptions.depotElectricityPricePerKWh =
            Number.NaN;

        expect(() =>
            simulate({
                project,
                scenario,
            }),
        ).toThrow(
            "Depot electricity price must be a nonnegative finite number.",
        );


    });

    it("rejects a preset with zero charging efficiency", () => {
        const project = structuredClone(sim01Project);
        const scenario = structuredClone(sim01Scenario);

        project.vehiclePresets[0].chargingEfficiency = 0;

        expect(() =>
            simulate({
                project,
                scenario,
            }),
        ).toThrow(
            'Preset "sim01-diesel" has an invalid chargingEfficiency.',
        );
    });

    it("rejects a preset with a non-finite purchase cost", () => {
        const project = structuredClone(sim01Project);
        const scenario = structuredClone(sim01Scenario);

        project.vehiclePresets[0].purchaseCost =
            Number.POSITIVE_INFINITY;

        expect(() =>
            simulate({
                project,
                scenario,
            }),
        ).toThrow(
            'Preset "sim01-diesel" has an invalid purchaseCost.',
        );
    });

    it("rejects a vehicle with negative annual distance", () => {
        const project = structuredClone(sim01Project);
        const scenario = structuredClone(sim01Scenario);

        project.fleetVehicles[0].annualKm = -1;

        expect(() =>
            simulate({
                project,
                scenario,
            }),
        ).toThrow(
            'Vehicle "SIM01-VEHICLE" has an invalid annualKm.',
        );
    });

    it("rejects a replacement year outside the analysis", () => {
        const project = structuredClone(sim01Project);
        const scenario = structuredClone(sim01Scenario);

        project.fleetVehicles[0].replacementYear = 2035;

        expect(() =>
            simulate({
                project,
                scenario,
            }),
        ).toThrow(
            'Vehicle "SIM01-VEHICLE" has an invalid replacementYear.',
        );
    });

    it("rejects a scenario target that does not exist", () => {
        const project = structuredClone(sim01Project);
        const scenario = structuredClone(sim01Scenario);

        scenario.vehiclePlans["SIM01-VEHICLE"] = {
            targetPresetId: "missing-preset",
            transitionYear: 2026,
        };

        expect(() =>
            simulate({
                project,
                scenario,
            }),
        ).toThrow(
            'Scenario plan for "SIM01-VEHICLE" references missing preset "missing-preset".',
        );
    });

    it("rejects a transition year outside the analysis", () => {
        const project = structuredClone(sim01Project);
        const scenario = structuredClone(sim01Scenario);

        scenario.vehiclePlans["SIM01-VEHICLE"] = {
            targetPresetId: "sim01-electric",
            transitionYear: 2035,
        };

        expect(() =>
            simulate({
                project,
                scenario,
            }),
        ).toThrow(
            'Scenario plan for "SIM01-VEHICLE" has an invalid transitionYear.',
        );
    });

    it("does not modify its input", () => {
        const input: SimulationInput = {
            project: structuredClone(sim01Project),
            scenario: structuredClone(sim01Scenario),
        };

        const originalInput =
            structuredClone(input);

        simulate(input);

        expect(input).toEqual(originalInput);
    });
});

describe("calculateDisposalValue", () => {
    it("calculates the disposal value of an existing vehicle", () => {
        const value = calculateDisposalValue(
            6_000, // Starting value
            0,     // End residual value
            0,     // Existing at the beginning
            1,     // Disposed during the second year
            3,     // Three-year analysis
        );

        expect(value).toBe(4_000);
    });

    it("calculates the disposal value of a vehicle acquired during the analysis", () => {
        const value = calculateDisposalValue(
            9_000, // Purchase value
            3_000, // End residual value
            1,     // Acquired during the second year
            2,     // Disposed during the third year
            3,     // Three-year analysis
        );

        expect(value).toBe(6_000);
    });

    it("returns identical results for identical inputs", () => {
        const input: SimulationInput = {
            project: structuredClone(sim01Project),
            scenario: structuredClone(sim01Scenario),
        };

        const firstResult = simulate(input);
        const secondResult = simulate(input);

        expect(secondResult).toEqual(firstResult);
    });
});

describe("calculateVehicleTerminalCredit", () => {
    it("returns the target preset residual after a transition", () => {
        const vehicle =
            sim01Project.fleetVehicles[0];

        const credit =
            calculateVehicleTerminalCredit(
                vehicle,
                sim01Scenario.vehiclePlans[vehicle.id],
                sim01Project.vehiclePresets,
                sim01Project.analysis,
            );

        expect(credit).toBe(2_000);
    });

    it("returns the replacement preset residual after baseline replacement", () => {
        const project =
            structuredClone(sim01Project);

        const vehicle =
            project.fleetVehicles[0];

        const preset =
            project.vehiclePresets[0];

        project.analysis.yearCount = 3;
        vehicle.replacementYear = 2027;

        vehicle.currentHolding = {
            kind: "owned",
            currentValue: 6_000,
            endResidualValue: 0,
        };

        preset.purchaseCost = 9_000;
        preset.acquisition = {
            kind: "owned",
            endResidualValue: 3_000,
        };

        const credit =
            calculateVehicleTerminalCredit(
                vehicle,
                undefined,
                project.vehiclePresets,
                project.analysis,
            );

        expect(credit).toBe(3_000);
    });
});

describe("validateEnergyAssumptions", () => {
    it("accepts valid energy assumptions", () => {
        const issues = validateEnergyAssumptions({
            fuelKgCo2PerLitre: 2,
            electricityCo2PerLitre: 0.5,
            chargingEfficiency: 0.9,
        });

        expect(issues).toEqual([]);
    });

    it.each([
        0,
        -0.1,
        1.1,
        Number.NaN,
        Number.POSITIVE_INFINITY,
    ])(
        "rejects invalid charging efficiency %s",
        (chargingEfficiency) => {
            const issues = validateEnergyAssumptions({
                fuelKgCo2PerLitre: 2,
                electricityCo2PerLitre: 0.5,
                chargingEfficiency,
            });

            expect(
                issues.some(
                    (issue) =>
                        issue.field ===
                        "chargingEfficiency",
                ),
            ).toBe(true);
        },
    );
});