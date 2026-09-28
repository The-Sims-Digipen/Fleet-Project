import type { PaybackResult, SimulationResult } from "../domain/contracts";

export type FinancialKpis = {
  tco: number;
  savings: number;
  capex: number;
  opex: number;
  payback: PaybackResult;
};

export type FinancialChartViewModel = {
  years: number[];
  baselineCumulativeCost: number[];
  scenarioCumulativeCost: number[];
  annualSavings: number[];
};

export type SelectedYearFinancialViewModel = {
  year: number;
  baselineCost: number;
  scenarioCost: number;
  annualSavings: number;
  cumulativeSavings: number;
};

export type FinancialViewModel = {
  currency: string;
  kpis: FinancialKpis;
  chart: FinancialChartViewModel;
  selectedYear: SelectedYearFinancialViewModel | null;
  paybackLabel: string;
};

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
