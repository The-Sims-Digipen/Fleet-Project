import ReactECharts from "echarts-for-react";
import { useEffect, useMemo, useState } from "react";
import { ComparisonViewport, type DemoPlanKey } from "./ComparisonViewport";

const currency = new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("en-SG", { maximumFractionDigits: 0 });

type DemoPlan = {
  key: DemoPlanKey;
  slot: "A" | "B";
  name: string;
  summary: string;
  tco: number;
  capex: number;
  opex: number;
  roadmap: number[];
  cumulativeCost: number[];
};

const YEARS = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035] as const;
const START_YEAR = YEARS[0];
const END_YEAR = YEARS[YEARS.length - 1];
const INITIAL_YEAR = 2030;
const SITE_CAPACITY_KW = 800;

const PLANS: [DemoPlan, DemoPlan] = [
  {
    key: "gradual",
    slot: "A",
    name: "Gradual Transition",
    summary: "Lower upfront spend with vehicles replaced progressively as they reach replacement age.",
    tco: 4_180_000,
    capex: 1_050_000,
    opex: 465_000,
    roadmap: [1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
    cumulativeCost: [420, 830, 1240, 1660, 2070, 2490, 2910, 3330, 3760, 4180],
  },
  {
    key: "accelerated",
    slot: "B",
    name: "Accelerated Electrification",
    summary: "More vehicles replaced early to reduce fuel use and operating emissions sooner.",
    tco: 3_860_000,
    capex: 1_520_000,
    opex: 344_000,
    roadmap: [2, 2, 1, 1, 2, 1, 1, 0, 0, 0],
    cumulativeCost: [660, 1170, 1600, 1970, 2310, 2640, 2950, 3260, 3560, 3860],
  },
];

function electricCountAtYear(plan: DemoPlan, year: number) {
  const yearIndex = Math.max(0, Math.min(YEARS.length - 1, year - START_YEAR));
  return Math.min(10, plan.roadmap.slice(0, yearIndex + 1).reduce((total, count) => total + count, 0));
}

function metricsAtYear(plan: DemoPlan, year: number) {
  const electric = electricCountAtYear(plan, year);
  const diesel = 10 - electric;
  const chargers = electric;
  const peakPower = 200 + electric * 70;
  const annualEmissions = Math.max(120, 500 - electric * 35);
  const capacityMargin = SITE_CAPACITY_KW - peakPower;

  return {
    electric,
    diesel,
    chargers,
    peakPower,
    annualEmissions,
    feasibility: capacityMargin >= 100 ? "Within site capacity" : capacityMargin >= 0 ? "Near site capacity" : "Site upgrade required",
    feasibilityDetail: capacityMargin >= 100
      ? `${number.format(capacityMargin)} kW of spare electrical headroom remains.`
      : capacityMargin >= 0
        ? `Only ${number.format(capacityMargin)} kW of headroom remains at the overnight peak.`
        : `Peak demand exceeds the current site limit by ${number.format(Math.abs(capacityMargin))} kW.`,
  };
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="rounded-lg border border-line bg-control px-3 py-3">
    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-secondary">{label}</p>
    <p className="mt-1 text-lg font-semibold text-primary">{value}</p>
    {detail && <p className="mt-1 text-[11px] leading-relaxed text-secondary">{detail}</p>}
  </div>;
}

function PlanColumn({ plan, selectedYear }: { plan: DemoPlan; selectedYear: number }) {
  const [cameraReset, setCameraReset] = useState(0);
  const metrics = metricsAtYear(plan, selectedYear);
  const feasibilityWarning = metrics.peakPower > SITE_CAPACITY_KW;

  return <article className="min-w-[520px] flex-1 overflow-hidden rounded-xl border border-line-strong bg-panel shadow-[0_18px_70px_rgba(0,0,0,0.18)]">
    <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-accent">Plan {plan.slot}</p>
          <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-secondary">{selectedYear} view</span>
        </div>
        <h3 className="mt-1 truncate text-xl font-semibold" title={plan.name}>{plan.name}</h3>
        <p className="mt-1 max-w-[620px] text-xs leading-relaxed text-secondary">{plan.summary}</p>
      </div>
      <button type="button" className="min-h-9 shrink-0 rounded border border-line-strong px-3 text-xs font-bold text-secondary hover:border-accent hover:text-primary" onClick={() => setCameraReset((value) => value + 1)}>Reset view</button>
    </div>

    <div className="relative h-[350px] border-b border-line bg-surface">
      <ComparisonViewport plan={plan.key} year={selectedYear} reset={cameraReset} />
      <div className="pointer-events-none absolute left-3 top-3 flex gap-2">
        <span className="rounded border border-line-strong bg-panel/90 px-2 py-1 font-mono text-[10px] text-secondary backdrop-blur">Sample depot</span>
        <span className="rounded border border-line-strong bg-panel/90 px-2 py-1 font-mono text-[10px] text-secondary backdrop-blur">10 parked vehicles</span>
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-3 rounded border border-line-strong bg-panel/90 px-3 py-2 text-[10px] text-secondary backdrop-blur">
        <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#3b82f6]" /> Electric</span>
        <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#22c55e]" /> Diesel</span>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-2 p-4">
      <Metric label="Fleet mix" value={`${metrics.electric} electric`} detail={`${metrics.diesel} diesel`} />
      <Metric label="Chargers" value={String(metrics.chargers)} detail={`Installed by ${selectedYear}`} />
      <Metric label="Peak power" value={`${number.format(metrics.peakPower)} kW`} detail={`${SITE_CAPACITY_KW} kW site capacity`} />
      <Metric label="10-year TCO" value={currency.format(plan.tco)} detail="Illustrative whole-fleet cost" />
      <Metric label="Transition CAPEX" value={currency.format(plan.capex)} detail="Vehicles + charging infrastructure" />
      <Metric label="Annual OPEX" value={currency.format(plan.opex)} detail="Illustrative steady-state operating cost" />
      <Metric label="Annual emissions" value={`${number.format(metrics.annualEmissions)} tCO₂e`} detail={`Illustrative fleet state in ${selectedYear}`} />
      <Metric label="Vehicles transitioned" value={`${metrics.electric} / 10`} detail={`By ${selectedYear}`} />
      <div className={`rounded-lg border px-3 py-3 ${feasibilityWarning ? "border-[#7a4c42] bg-[#261814]" : "border-[#355149] bg-[#0f211d]"}`}>
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-secondary">Feasibility</p>
        <p className={`mt-1 text-sm font-semibold ${feasibilityWarning ? "text-[#f4a68d]" : "text-accent"}`}>{metrics.feasibility}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-secondary">{metrics.feasibilityDetail}</p>
      </div>
    </div>
  </article>;
}

function Delta({ label, a, b, format }: { label: string; a: number; b: number; format: (value: number) => string }) {
  const delta = b - a;
  return <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-line py-3 last:border-b-0">
    <div>
      <p className="text-sm font-semibold text-primary">{label}</p>
      <p className="mt-0.5 text-[11px] text-secondary">Plan B compared with Plan A</p>
    </div>
    <span className="font-mono text-sm font-semibold tabular-nums text-primary">{delta === 0 ? "No change" : `${delta > 0 ? "+" : "−"}${format(Math.abs(delta))}`}</span>
  </div>;
}

function TimelineScrubber({ selectedYear, setSelectedYear }: { selectedYear: number; setSelectedYear: (year: number) => void }) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setSelectedYear(Math.min(END_YEAR, selectedYear + 1));
      if (selectedYear >= END_YEAR - 1) setPlaying(false);
    }, 900);
    return () => window.clearInterval(timer);
  }, [playing, selectedYear, setSelectedYear]);

  return <article className="rounded-xl border border-line-strong bg-panel px-5 py-4">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent">Shared timeline</p>
        <h3 className="mt-1 text-lg font-semibold">Scrub both plans together</h3>
        <p className="mt-1 text-xs text-secondary">Move through the transition years to see both depot views update at the same time.</p>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className="min-h-9 rounded border border-line-strong px-3 text-xs font-bold text-secondary hover:border-accent hover:text-primary" onClick={() => {
          if (!playing && selectedYear === END_YEAR) setSelectedYear(START_YEAR);
          setPlaying((value) => !value);
        }}>{playing ? "Pause" : "Play"}</button>
        <button type="button" className="min-h-9 rounded border border-line-strong px-3 text-xs font-bold text-secondary hover:border-accent hover:text-primary" onClick={() => { setPlaying(false); setSelectedYear(START_YEAR); }}>Reset</button>
        <output htmlFor="comparison-year" className="min-w-[74px] rounded-lg border border-line bg-control px-3 py-2 text-center font-mono text-lg font-semibold text-primary">{selectedYear}</output>
      </div>
    </div>
    <div className="mt-5">
      <input
        id="comparison-year"
        aria-label="Comparison year"
        type="range"
        min={START_YEAR}
        max={END_YEAR}
        step={1}
        value={selectedYear}
        onChange={(event) => { setPlaying(false); setSelectedYear(Number(event.target.value)); }}
        className="w-full cursor-pointer accent-accent"
      />
      <div className="mt-2 grid grid-cols-10 font-mono text-[10px] text-secondary">
        {YEARS.map((year) => <button key={year} type="button" onClick={() => { setPlaying(false); setSelectedYear(year); }} className={`text-center hover:text-primary ${year === selectedYear ? "font-bold text-accent" : ""}`}>{year}</button>)}
      </div>
    </div>
  </article>;
}

export function CompareWorkspace() {
  const [planA, planB] = PLANS;
  const [selectedYear, setSelectedYear] = useState(INITIAL_YEAR);
  const metricsA = useMemo(() => metricsAtYear(planA, selectedYear), [planA, selectedYear]);
  const metricsB = useMemo(() => metricsAtYear(planB, selectedYear), [planB, selectedYear]);

  const chartOption = useMemo(() => ({
    animation: false,
    tooltip: { trigger: "axis" },
    legend: { show: false },
    grid: { left: 58, right: 22, top: 18, bottom: 52, containLabel: true },
    xAxis: {
      type: "category",
      data: YEARS,
      boundaryGap: false,
      axisLine: { lineStyle: { color: "#405a53" } },
      axisTick: { alignWithLabel: true },
      axisLabel: { color: "#b1c3bd", margin: 14, hideOverlap: true },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#b1c3bd", formatter: (value: number | string) => `$${Number(value) / 1000}m`, margin: 10 },
      splitLine: { lineStyle: { color: "#273a35" } },
    },
    series: [
      {
        name: planA.name,
        type: "line",
        smooth: true,
        symbolSize: 6,
        data: planA.cumulativeCost,
        lineStyle: { width: 3, color: "#4f7cff" },
        itemStyle: { color: "#4f7cff" },
        markLine: {
          silent: true,
          symbol: ["none", "none"],
          label: { show: false },
          lineStyle: { color: "#7d938c", type: "dashed", width: 1 },
          data: [{ xAxis: selectedYear }],
        },
      },
      {
        name: planB.name,
        type: "line",
        smooth: true,
        symbolSize: 6,
        data: planB.cumulativeCost,
        lineStyle: { width: 3, color: "#d8ff28" },
        itemStyle: { color: "#d8ff28" },
      },
    ],
  }), [planA, planB, selectedYear]);

  return <section id="compare-workspace" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto bg-surface px-[clamp(16px,2.5vw,34px)] py-5">
    <div className="mx-auto grid w-full max-w-[1680px] gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-line-strong bg-panel px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent">Scenario comparison</p>
            <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-secondary">Client demo</span>
          </div>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.025em]">Two possible fleet transition plans</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-secondary">Both plans use the same depot and fleet. The comparison shows how different transition speeds could affect cost, emissions, charging demand, and the physical depot layout.</p>
        </div>
        <div className="rounded-lg border border-line bg-control px-4 py-3 text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-secondary">Selected year</p>
          <p className="mt-0.5 font-mono text-xl font-semibold text-primary">{selectedYear}</p>
        </div>
      </header>

      <TimelineScrubber selectedYear={selectedYear} setSelectedYear={setSelectedYear} />

      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max gap-4 xl:min-w-0">
          <PlanColumn plan={planA} selectedYear={selectedYear} />
          <PlanColumn plan={planB} selectedYear={selectedYear} />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-xl border border-line-strong bg-panel p-5">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent">Difference</p>
          <h3 className="mt-1 text-lg font-semibold">Plan B minus Plan A</h3>
          <p className="mt-1 text-xs text-secondary">The fleet-state values below update with the selected year; whole-plan cost values remain illustrative 10-year figures.</p>
          <div className="mt-4">
            <Delta label="10-year TCO" a={planA.tco} b={planB.tco} format={(value) => currency.format(value)} />
            <Delta label="Transition CAPEX" a={planA.capex} b={planB.capex} format={(value) => currency.format(value)} />
            <Delta label="Annual OPEX" a={planA.opex} b={planB.opex} format={(value) => currency.format(value)} />
            <Delta label={`${selectedYear} annual emissions`} a={metricsA.annualEmissions} b={metricsB.annualEmissions} format={(value) => `${number.format(value)} tCO₂e`} />
            <Delta label={`${selectedYear} peak demand`} a={metricsA.peakPower} b={metricsB.peakPower} format={(value) => `${number.format(value)} kW`} />
            <Delta label={`${selectedYear} chargers`} a={metricsA.chargers} b={metricsB.chargers} format={(value) => number.format(value)} />
          </div>
        </article>

        <article className="rounded-xl border border-line-strong bg-panel p-5">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent">Cost over time</p>
          <h3 className="mt-1 text-lg font-semibold">Cumulative fleet cost</h3>
          <p className="mt-1 text-xs text-secondary">The accelerated plan starts with higher investment, then benefits from lower ongoing operating cost.</p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-secondary" aria-label="Cost chart legend">
            <span className="flex items-center gap-2"><i className="h-0.5 w-6 rounded bg-[#4f7cff]" />{planA.name}</span>
            <span className="flex items-center gap-2"><i className="h-0.5 w-6 rounded bg-[#d8ff28]" />{planB.name}</span>
            <span className="flex items-center gap-2"><i className="h-0 w-6 border-t border-dashed border-[#7d938c]" />Selected year: {selectedYear}</span>
          </div>
          <div className="mt-2 h-[330px]"><ReactECharts option={chartOption} style={{ height: "100%", width: "100%" }} notMerge lazyUpdate opts={{ renderer: "svg" }} /></div>
        </article>
      </div>

      <article className="rounded-xl border border-line-strong bg-panel p-5">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent">Transition roadmap</p>
          <h3 className="mt-1 text-lg font-semibold">Vehicles replaced each year</h3>
          <p className="mt-1 text-xs text-secondary">An example of how the transition timing could differ even when both plans start from the same fleet.</p>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-xs">
            <thead><tr><th className="border-b border-line p-2 text-left text-secondary">Scenario</th>{YEARS.map((year) => <th key={year} className={`border-b border-line p-2 text-center ${year === selectedYear ? "bg-control text-accent" : "text-secondary"}`}>{year}</th>)}</tr></thead>
            <tbody>
              {PLANS.map((plan) => <tr key={plan.key}><th className="border-b border-line p-2 text-left font-semibold text-primary">{plan.name}</th>{plan.roadmap.map((count, index) => <td key={YEARS[index]} className={`border-b border-line p-2 text-center font-mono ${YEARS[index] === selectedYear ? "bg-control font-bold text-accent" : count ? "text-primary" : "text-secondary"}`}>{count || "—"}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  </section>;
}
