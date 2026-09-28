import type { PaybackResult, SimulationResult } from "../domain/contracts";

/** Financial values copied from the authoritative T05 simulation result. */
export type FinancialKpis = {
  tco: number;
  savings: number;
  capex: number;
  opex: number;
  payback: PaybackResult;
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
 * @param simulation Authoritative annual comparison and totals from T05.
 * @param currency ISO 4217 project currency used by the consuming UI.
 * @param selectedYear T04's shared year selection for the contextual summary.
 * @returns KPI, chart-series, payback, and selected-year presentation data.
 */
export function createFinancialViewModel(
  simulation: SimulationResult,
  currency: string,
  selectedYear: number,
): FinancialViewModel {
  const annualSavings = simulation.annual.map((point, index) =>
    point.cumulativeCashSavings -
    (simulation.annual[index - 1]?.cumulativeCashSavings ?? 0),
  );

  const selectedPoint = simulation.annual.find(
    (point) => point.year === selectedYear,
  );
  const selectedIndex = selectedPoint
    ? simulation.annual.indexOf(selectedPoint)
    : -1;

  return {
    currency,
    kpis: {
      tco: simulation.scenario.tco,
      savings: simulation.savings,
      capex: simulation.scenario.acquisitionCapex,
      opex: simulation.scenario.operatingCost,
      payback: simulation.payback,
    },
    chart: {
      years: simulation.annual.map((point) => point.year),
      baselineCumulativeCost: simulation.annual.map(
        (point) => point.baseline.cumulativeCashCost,
      ),
      scenarioCumulativeCost: simulation.annual.map(
        (point) => point.scenario.cumulativeCashCost,
      ),
      annualSavings,
    },
    selectedYear: selectedPoint && selectedIndex >= 0
      ? {
        year: selectedPoint.year,
        baselineCost: selectedPoint.baseline.netCashCost,
        scenarioCost: selectedPoint.scenario.netCashCost,
        annualSavings: annualSavings[selectedIndex],
        cumulativeSavings: selectedPoint.cumulativeCashSavings,
      }
      : null,
    paybackLabel: simulation.payback.year === null
      ? "Not reached"
      : String(simulation.payback.year),
  };
}
