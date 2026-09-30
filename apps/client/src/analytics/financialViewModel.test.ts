import { describe, expect, it } from "vitest";

import { createProjectFixture } from "../domain/projectFixture";
import { simulateProject } from "../domain/simulation";
import { createFinancialViewModel } from "./financialViewModel";

describe("financial analytics view model", () => {
  it("preserves authoritative financial output rather than calculating it again", () => {
    const simulation = simulateProject(createProjectFixture());
    const scenario = simulation.scenarios["plan-a"];
    // Deliberately distinct values prove the projection copies the engine's output.
    scenario.totals.tco = 650;
    scenario.totals.savings = 250;
    scenario.totals.transitionCapex = 500;
    scenario.totals.replacementCapex = 900;
    scenario.totals.operatingCost = 150;
    scenario.paybackYear = 2028;
    scenario.paybackStatus = "reached";
    scenario.annual[1].annualCashSavings = -125;
    scenario.annual[1].cumulativeCashSavings = -350;

    const viewModel = createFinancialViewModel(simulation, "plan-a", "SGD", 2027)!;

    expect(viewModel.kpis).toEqual({ tco: 650, savings: 250, capex: 500, opex: 150, payback: { status: "reached", year: 2028 } });
    expect(viewModel.chart.years).toEqual(simulation.years);
    expect(viewModel.chart.baselineCumulativeCost).toEqual(simulation.baseline.annual.map((row) => row.cumulativeCashCost));
    expect(viewModel.chart.scenarioCumulativeCost).toEqual(scenario.annual.map((row) => row.cumulativeCashCost));
    expect(viewModel.chart.annualSavings[1]).toBe(-125);
    expect(viewModel.selectedYear).toEqual({
      year: 2027,
      baselineCost: simulation.baseline.annual[1].netCashCost,
      scenarioCost: scenario.annual[1].netCashCost,
      annualSavings: -125,
      cumulativeSavings: -350,
    });
  });

  it("represents no payback and absent Scenario/year results explicitly", () => {
    const simulation = simulateProject(createProjectFixture());
    simulation.scenarios["plan-a"].paybackYear = null;
    simulation.scenarios["plan-a"].paybackStatus = "not-reached";
    const viewModel = createFinancialViewModel(simulation, "plan-a", "SGD", 2040)!;

    expect(viewModel.kpis.payback).toEqual({ status: "not-reached", year: null });
    expect(viewModel.paybackLabel).toBe("Not reached");
    expect(viewModel.selectedYear).toBeNull();
    expect(createFinancialViewModel(simulation, "missing", "SGD", 2026)).toBeNull();
  });
});
