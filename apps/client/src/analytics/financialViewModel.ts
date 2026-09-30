import type { ProjectSimulation, ScenarioSimulation } from "../domain/simulation";

/** Financial values copied from the authoritative T05 simulation result. */
export type FinancialKpis = {
  tco: number;
  savings: number | null;
  capex: number;
  opex: number;
  payback: { year: number | null; status: ScenarioSimulation["paybackStatus"] };
};

/** Parallel series consumed by the financial charts. Values remain unformatted for charting. */
export type FinancialChartViewModel = {
  years: number[];
  baselineCumulativeCost: number[];
  scenarioCumulativeCost: number[];
  annualSavings: number[];
};

/** Financial comparison for the year currently selected by T04. */
export type SelectedYearFinancialViewModel = {
  year: number;
  baselineCost: number;
  scenarioCost: number;
  annualSavings: number;
  cumulativeSavings: number;
};

/** Display-ready financial projection for F06 and the selected-year context from F07. */
export type FinancialViewModel = {
  currency: string;
  kpis: FinancialKpis;
  chart: FinancialChartViewModel;
  selectedYear: SelectedYearFinancialViewModel | null;
  paybackLabel: string;
};

/**
 * Projects T05 financial output into the typed T07 presentation contract.
 *
 * This function only selects and reshapes values already calculated by the
 * simulation engine. It must not calculate costs, savings, payback, or other
 * financial truth independently.
 *
 * @param simulation Authoritative Project baseline and Scenario results.
 * @param scenarioId Scenario whose financial results are displayed.
 * @param currency ISO 4217 project currency used by the consuming UI.
 * @param selectedYear T04's shared year selection for the contextual summary.
 * @returns KPI, chart-series, payback, and selected-year presentation data.
 */
export function createFinancialViewModel(
  simulation: ProjectSimulation,
  scenarioId: string,
  currency: string,
  selectedYear: number,
): FinancialViewModel | null {
  const scenario = simulation.scenarios[scenarioId];
  if (!scenario) return null;
  const selectedIndex = scenario.annual.findIndex((point) => point.year === selectedYear);
  const selectedPoint = scenario.annual[selectedIndex];

  return {
    currency,
    kpis: {
      tco: scenario.totals.tco,
      savings: scenario.totals.savings,
      capex: scenario.totals.transitionCapex,
      opex: scenario.totals.operatingCost,
      payback: { year: scenario.paybackYear, status: scenario.paybackStatus },
    },
    chart: {
      years: simulation.years,
      baselineCumulativeCost: simulation.baseline.annual.map(
        (point) => point.cumulativeCashCost,
      ),
      scenarioCumulativeCost: scenario.annual.map(
        (point) => point.cumulativeCashCost,
      ),
      annualSavings: scenario.annual.map((point) => point.annualCashSavings),
    },
    selectedYear: selectedPoint && selectedIndex >= 0
      ? {
        year: selectedPoint.year,
        baselineCost: simulation.baseline.annual[selectedIndex].netCashCost,
        scenarioCost: selectedPoint.netCashCost,
        annualSavings: selectedPoint.annualCashSavings,
        cumulativeSavings: selectedPoint.cumulativeCashSavings,
      }
      : null,
    paybackLabel: scenario.paybackYear === null
      ? "Not reached"
      : String(scenario.paybackYear),
  };
}
