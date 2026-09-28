import { describe, expect, it } from "vitest";
import type { SimulationResult } from "../domain/contracts";
import { createFinancialViewModel } from "./financialViewModel"

const simulation: SimulationResult = {
  modelVersion: "annual-v1",
  baseline: {
    acquisitionCapex: 0,
    operatingCost: 300,
    disposalCredits: 0,
    terminalCredits: 0,
    tco: 900,
    fuelLitres: 0,
    electricityKWh: 0,
    emissionsKgCo2e: 0,
  },
  scenario: {
    acquisitionCapex: 500,
    operatingCost: 150,
    disposalCredits: 0,
    terminalCredits: 0,
    tco: 650,
    fuelLitres: 0,
    electricityKWh: 0,
    emissionsKgCo2e: 0,
  },
  savings: 250,
  scenarioMinusBaseline: -250,
  payback: { status: "reached", year: 2028 },
  annual: [
    {
      year: 2026,
      baseline: { acquisitionCapex: 0, operatingCost: 300, disposalCredits: 0, netCashCost: 300, cumulativeCashCost: 300, fuelLitres: 0, electricityKWh: 0, emissionsKgCo2e: 0 },
      scenario: { acquisitionCapex: 500, operatingCost: 300, disposalCredits: 0, netCashCost: 800, cumulativeCashCost: 800, fuelLitres: 0, electricityKWh: 0, emissionsKgCo2e: 0 },
      cumulativeCashSavings: -500,
    },
    {
      year: 2027,
      baseline: { acquisitionCapex: 0, operatingCost: 300, disposalCredits: 0, netCashCost: 300, cumulativeCashCost: 600, fuelLitres: 0, electricityKWh: 0, emissionsKgCo2e: 0 },
      scenario: { acquisitionCapex: 0, operatingCost: 150, disposalCredits: 0, netCashCost: 150, cumulativeCashCost: 950, fuelLitres: 0, electricityKWh: 0, emissionsKgCo2e: 0 },
      cumulativeCashSavings: -350,
    },
    {
      year: 2028,
      baseline: { acquisitionCapex: 0, operatingCost: 300, disposalCredits: 0, netCashCost: 300, cumulativeCashCost: 900, fuelLitres: 0, electricityKWh: 0, emissionsKgCo2e: 0 },
      scenario: { acquisitionCapex: 0, operatingCost: 150, disposalCredits: 0, netCashCost: 150, cumulativeCashCost: 1100, fuelLitres: 0, electricityKWh: 0, emissionsKgCo2e: 0 },
      cumulativeCashSavings: -200,
    },
  ],
};

describe("financial analytics view model", () => {
  it("projects typed KPIs, chart series, and selected-year values without recalculating simulation truth", () => {
    const viewModel = createFinancialViewModel(simulation, "SGD", 2027);

    expect(viewModel.kpis).toEqual({
      tco: 650,
      savings: 250,
      capex: 500,
      opex: 150,
      payback: { status: "reached", year: 2028 },
    });
    expect(viewModel.chart.years).toEqual([2026, 2027, 2028]);
    expect(viewModel.chart.baselineCumulativeCost).toEqual([300, 600, 900]);
    expect(viewModel.chart.scenarioCumulativeCost).toEqual([800, 950, 1100]);
    expect(viewModel.chart.annualSavings).toEqual([-500, 150, 150]);
    expect(viewModel.selectedYear).toEqual({
      year: 2027,
      baselineCost: 300,
      scenarioCost: 150,
      annualSavings: 150,
      cumulativeSavings: -350,
    });
  });

  it("represents no payback explicitly", () => {
    const viewModel = createFinancialViewModel({ ...simulation, payback: { status: "not-reached", year: null } }, "SGD", 2026);

    expect(viewModel.kpis.payback).toEqual({ status: "not-reached", year: null });
    expect(viewModel.paybackLabel).toBe("Not reached");
  });
});
