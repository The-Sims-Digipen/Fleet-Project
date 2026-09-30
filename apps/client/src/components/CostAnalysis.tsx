import { useMemo } from "react";
import ReactECharts from "echarts-for-react";

import { createFinancialViewModel } from "../analytics/financialViewModel";
import { simulateProject } from "../domain/simulation";
import { useProjectStore } from "../state/projectStore";
import { CollapsibleSection } from "./CollapsibleSection";

const number = new Intl.NumberFormat("en-SG", { maximumFractionDigits: 1 });

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="rounded-lg border border-line bg-panel p-4">
    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary">{label}</p>
    <p className="mt-2 text-xl font-semibold text-primary">{value}</p>
    <p className="mt-1 text-xs text-secondary">{detail}</p>
  </article>;
}

export function CostAnalysis() {
  const document = useProjectStore((state) => state.runtime.document);
  const selectedYear = useProjectStore((state) => state.runtime.editor.plan.selectedYear);
  const simulation = useMemo(() => simulateProject(document), [document]);
  const scenario = simulation.scenarios[document.activeScenarioId];
  const viewModel = useMemo(() => createFinancialViewModel(simulation, document.activeScenarioId, document.analysis.currency, selectedYear),
    [simulation, document.activeScenarioId, document.analysis.currency, selectedYear]);
  const selectedYearResult = viewModel?.selectedYear;
  const formatCurrency = (value: number) => `${document.analysis.currency} ${value.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatOptionalCurrency = (value: number | null) => value === null ? "Unavailable" : formatCurrency(value);
  const annual = scenario?.annual.find((row) => row.year === selectedYear);
  const tcoLabel = document.analysis.discountRate > 0 ? "Present value TCO" : "TCO";

  const cumulativeOption = useMemo(() => ({
    animation: false,
    tooltip: { trigger: "axis", valueFormatter: (value: number) => formatCurrency(value) },
    legend: { textStyle: { color: "#b1c3bd" }, bottom: 0 },
    grid: { left: 68, right: 22, top: 16, bottom: 58, containLabel: true },
    xAxis: { type: "category", data: simulation.years, axisLine: { lineStyle: { color: "#405a53" } }, axisLabel: { color: "#b1c3bd" } },
    yAxis: { type: "value", axisLabel: { color: "#b1c3bd", formatter: (value: number) => formatCurrency(value) }, splitLine: { lineStyle: { color: "#273a35" } } },
    series: [
      { name: "Current fleet baseline", type: "line", smooth: false, symbol: "circle", data: viewModel?.chart.baselineCumulativeCost ?? [], lineStyle: { width: 3, color: "#4f7cff" }, itemStyle: { color: "#4f7cff" } },
      { name: scenario?.scenarioName ?? "Active Scenario", type: "line", smooth: false, symbol: "circle", data: viewModel?.chart.scenarioCumulativeCost ?? [], lineStyle: { width: 3, color: "#55d6be" }, itemStyle: { color: "#55d6be" }, markLine: {
        silent: true, symbol: ["none", "none"], label: { show: false }, lineStyle: { color: "#b1c3bd", type: "dashed" },
        data: [
          { xAxis: selectedYear },
          ...(scenario?.paybackStatus === "reached" && scenario.paybackYear !== null
            ? [{ xAxis: scenario.paybackYear, lineStyle: { color: "#55d6be" }, label: { show: true, formatter: `Payback ${scenario.paybackYear}`, position: "insideEndTop" } }]
            : []),
        ],
      } },
    ],
  }), [simulation, scenario, viewModel, selectedYear, document.analysis.currency]);

  const annualOption = useMemo(() => ({
    animation: false,
    tooltip: { trigger: "axis", valueFormatter: (value: number) => formatCurrency(value) },
    legend: { textStyle: { color: "#b1c3bd" }, bottom: 0 },
    grid: { left: 68, right: 22, top: 16, bottom: 58, containLabel: true },
    xAxis: { type: "category", data: simulation.years, axisLine: { lineStyle: { color: "#405a53" } }, axisLabel: { color: "#b1c3bd" } },
    yAxis: { type: "value", axisLabel: { color: "#b1c3bd", formatter: (value: number) => formatCurrency(value) }, splitLine: { lineStyle: { color: "#273a35" } } },
    series: [
      { name: "Current fleet baseline", type: "bar", data: simulation.baseline.annual.map((row) => row.netCashCost), itemStyle: { color: "#4f7cff" } },
      { name: scenario?.scenarioName ?? "Active Scenario", type: "bar", data: scenario?.annual.map((row) => row.netCashCost) ?? [], itemStyle: { color: "#55d6be" } },
    ],
  }), [simulation, scenario, document.analysis.currency]);

  const savingsOption = useMemo(() => ({
    animation: false,
    tooltip: { trigger: "axis", valueFormatter: (value: number) => formatCurrency(value) },
    grid: { left: 68, right: 22, top: 16, bottom: 32, containLabel: true },
    xAxis: { type: "category", data: simulation.years, axisLine: { lineStyle: { color: "#405a53" } }, axisLabel: { color: "#b1c3bd" } },
    yAxis: { type: "value", axisLabel: { color: "#b1c3bd", formatter: (value: number) => formatCurrency(value) }, splitLine: { lineStyle: { color: "#273a35" } } },
    series: [{ name: "Annual net saving", type: "bar", barMaxWidth: 24,
      data: viewModel?.chart.annualSavings.map((value) => ({ value, itemStyle: { color: value >= 0 ? "#55d6be" : "#d58b79" } })) ?? [],
    }],
  }), [simulation.years, viewModel, document.analysis.currency]);

  return <CollapsibleSection panelId="cost-analysis" title="Cost & emissions" description="Derived from Project Vehicles, Presets, Scenario transitions, and shared Analysis Settings.">
    {!scenario ? <p role="status" className="text-xs text-secondary">No Scenario results are available for this Project.</p> : <>
      <div className="grid grid-cols-2 gap-3">
        <Metric label={tcoLabel} value={formatCurrency(scenario.totals.tco)} detail={`${scenario.scenarioName} · ${document.analysis.discountRate > 0 ? "discounted " : ""}Project costs`} />
        <Metric label="Savings vs baseline" value={formatOptionalCurrency(scenario.totals.savings)} detail="Positive values mean the plan costs less." />
        <Metric label="Scenario − baseline cost difference" value={formatOptionalCurrency(scenario.totals.costDifference)} detail="Positive values mean the Scenario costs more." />
        <Metric label="Payback year" value={scenario.paybackYear === null ? "Not reached" : String(scenario.paybackYear)} detail={scenario.paybackStatus === "initial-parity" ? "No upfront premium; cash savings stay nonnegative." : scenario.paybackStatus === "reached" ? "Cumulative cash savings remain nonnegative." : "Cash savings do not remain nonnegative through the analysis period."} />
        <Metric label="Transition CAPEX" value={formatCurrency(scenario.totals.transitionCapex)} detail="Owned vehicle acquisitions for planned transitions." />
        <Metric label="OPEX" value={formatCurrency(scenario.totals.operatingCost)} detail="Nominal fuel, electricity, maintenance, and lease payments over the analysis period." />
        <Metric label="Fleet cost / km" value={formatOptionalCurrency(scenario.totals.costPerKm)} detail="Scenario TCO divided by total fleet kilometres." />
        <Metric label="Mean fleet cost / vehicle" value={formatOptionalCurrency(scenario.totals.costPerVehicle)} detail="Scenario TCO divided by fleet size; excludes shared charger costs." />
        <Metric label="Fuel used" value={`${number.format(scenario.totals.totalFuelLitres)} L`} detail={`Baseline: ${number.format(simulation.baseline.totals.totalFuelLitres)} L`} />
        <Metric label="Fuel displaced" value={`${number.format(scenario.totals.fuelDisplacedLitres)} L`} detail="Baseline minus Scenario fuel use; negative means more fuel is used." />
        <Metric label="Electricity used" value={`${number.format(scenario.totals.totalElectricityKWh)} kWh`} detail={`Baseline: ${number.format(simulation.baseline.totals.totalElectricityKWh)} kWh`} />
        <Metric label="Emissions" value={`${number.format(scenario.totals.emissionsKgCo2e)} kg CO₂e`} detail={`${number.format(scenario.totals.emissionsReductionKgCo2e ?? 0)} kg reduction vs baseline`} />
        <Metric label="Emissions reduction" value={scenario.totals.emissionsReductionPercentage === null ? "N/A" : `${number.format(scenario.totals.emissionsReductionPercentage)}%`} detail={`${number.format(scenario.totals.emissionsReductionKgCo2e ?? 0)} kg vs baseline; negative means emissions increased.`} />
        <Metric label={`${selectedYear} net cash cost`} value={formatCurrency(annual?.netCashCost ?? 0)} detail={`${annual?.transitionCount ?? 0} transition${annual?.transitionCount === 1 ? "" : "s"} in this year.`} />
      </div>

      {selectedYearResult && <section aria-label="Selected year financial results" className="mt-4 rounded-lg border border-line bg-panel p-4">
        <h3 className="text-base font-semibold">Selected year: {selectedYearResult.year}</h3>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div><dt className="text-secondary">Baseline cost</dt><dd className="mt-1 font-semibold">{formatCurrency(selectedYearResult.baselineCost)}</dd></div>
          <div><dt className="text-secondary">Plan cost</dt><dd className="mt-1 font-semibold">{formatCurrency(selectedYearResult.scenarioCost)}</dd></div>
          <div><dt className="text-secondary">Annual savings</dt><dd className="mt-1 font-semibold">{formatCurrency(selectedYearResult.annualSavings)}</dd></div>
          <div><dt className="text-secondary">Cumulative savings</dt><dd className="mt-1 font-semibold">{formatCurrency(selectedYearResult.cumulativeSavings)}</dd></div>
        </dl>
      </section>}

      <div className="mt-4 rounded-lg border border-line bg-panel p-2">
        <h3 className="px-2 pt-1 text-base font-semibold">Cumulative Project cost</h3>
        <p className="px-2 pt-1 text-xs text-secondary">Nominal cash cost by year, including acquisition and disposal cash flows.</p>
        <div className="mt-2 h-[320px] w-full" role="img" aria-label={`Cumulative cost comparison for ${scenario.scenarioName}`}>
          <ReactECharts option={cumulativeOption} style={{ height: "100%", width: "100%" }} notMerge lazyUpdate opts={{ renderer: "svg" }} />
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-line bg-panel p-2">
        <h3 className="px-2 pt-1 text-base font-semibold">Annual net cash cost</h3>
        <p className="px-2 pt-1 text-xs text-secondary">Each Scenario uses the same Project-level assumptions.</p>
        <div className="mt-2 h-[280px] w-full" role="img" aria-label={`Annual cash cost comparison for ${scenario.scenarioName}`}>
          <ReactECharts option={annualOption} style={{ height: "100%", width: "100%" }} notMerge lazyUpdate opts={{ renderer: "svg" }} />
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-line bg-panel p-2">
        <h3 className="px-2 pt-1 text-base font-semibold">Annual net savings</h3>
        <p className="px-2 pt-1 text-xs text-secondary">Baseline minus plan cash cost. Positive bars mean the plan costs less that year.</p>
        <div className="relative mt-2 h-[280px] w-full" role="img" aria-label={`Annual savings for ${scenario.scenarioName}`}>
          <ReactECharts option={savingsOption} style={{ height: "100%", width: "100%" }} notMerge lazyUpdate opts={{ renderer: "svg" }} />
          {viewModel?.chart.annualSavings.every((value) => value === 0) && <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-secondary">The active plan matches the baseline each year.</p>}
        </div>
      </div>
      <div className="mt-4 overflow-x-auto rounded-lg border border-line bg-panel">
        <table className="w-full min-w-[620px] text-left text-xs">
          <caption className="px-3 py-3 text-left text-base font-semibold">Annual financial results</caption>
          <thead className="border-y border-line bg-control text-secondary"><tr>
            {["Year", "Baseline cost", "Plan cost", "Annual savings", "Cumulative savings"].map((label) =>
              <th key={label} scope="col" className="px-3 py-2 font-semibold">{label}</th>)}
          </tr></thead>
          <tbody>{scenario.annual.map((point, index) => <tr key={point.year} aria-current={point.year === selectedYear ? "true" : undefined} className="border-b border-line last:border-b-0 aria-current:bg-accent/10">
            <th scope="row" className="px-3 py-2 font-semibold">{point.year}</th>
            <td className="px-3 py-2">{formatCurrency(simulation.baseline.annual[index].netCashCost)}</td>
            <td className="px-3 py-2">{formatCurrency(point.netCashCost)}</td>
            <td className={`px-3 py-2 ${point.annualCashSavings >= 0 ? "text-accent" : "text-[#d58b79]"}`}>{formatCurrency(point.annualCashSavings)}</td>
            <td className={`px-3 py-2 ${point.cumulativeCashSavings >= 0 ? "text-accent" : "text-[#d58b79]"}`}>{formatCurrency(point.cumulativeCashSavings)}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </>}
  </CollapsibleSection>;
}
