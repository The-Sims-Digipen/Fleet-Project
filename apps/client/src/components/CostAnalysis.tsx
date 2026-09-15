import { useState } from "react";
import { CollapsibleSection } from "./CollapsibleSection";

const years = [2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036];
const baseline = [0, 110, 220, 335, 450, 565, 680, 800, 920, 1040];
const transition = [0, 140, 290, 420, 520, 585, 610, 630, 650, 670];
const chartWidth = 920;
const chartHeight = 390;
const plot = { left: 68, right: 22, top: 28, bottom: 54 };
const maxValue = 1100;
const breakEvenIndex = 6;

function points(values: number[]) {
  return values.map((value, index) => {
    const x = plot.left + (index / (years.length - 1)) * (chartWidth - plot.left - plot.right);
    const y = plot.top + (1 - value / maxValue) * (chartHeight - plot.top - plot.bottom);
    return `${x},${y}`;
  }).join(" ");
}

function xFor(index: number) {
  return plot.left + (index / (years.length - 1)) * (chartWidth - plot.left - plot.right);
}

function yFor(value: number) {
  return plot.top + (1 - value / maxValue) * (chartHeight - plot.top - plot.bottom);
}

export function CostAnalysis() {
  const [zoom, setZoom] = useState(1);
  const breakEvenX = xFor(breakEvenIndex);
  const breakEvenY = yFor(transition[breakEvenIndex]);
  const endSavings = baseline[baseline.length - 1] - transition[transition.length - 1];
  return <CollapsibleSection title="Cost over time" description="Mocked fleet cost comparison. Lower is better." defaultOpen>
      <div className="grid gap-3">
        <article className="rounded-lg border border-line bg-panel p-4"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary">Payback year</p><p className="mt-2 text-2xl font-semibold text-accent">2033</p><p className="mt-1 text-xs text-secondary">Transition becomes cheaper</p></article>
        <article className="rounded-lg border border-line bg-panel p-4"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary">10-year saving</p><p className="mt-2 text-2xl font-semibold">$370k</p><p className="mt-1 text-xs text-secondary">Compared with no transition</p></article>
        <article className="rounded-lg border border-line bg-panel p-4"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary">Planning status</p><p className="mt-2 text-2xl font-semibold">Profitable</p><p className="mt-1 text-xs text-secondary">Based on mocked assumptions</p></article>
      </div>

      <div className="mt-4 rounded-lg border border-line bg-panel p-3">
        <div className="mb-3 grid gap-3">
          <div><h3 className="text-base font-semibold">Cumulative operating cost</h3><p className="mt-1 text-xs text-secondary">Lower is better · USD thousands</p></div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="grid gap-2 text-xs text-secondary" aria-label="Chart legend"><span className="flex items-center gap-2"><i className="size-2.5 rounded-full bg-[#a7b8b2]" aria-hidden="true" />Current fleet baseline</span><span className="flex items-center gap-2"><i className="size-2.5 rounded-full bg-accent" aria-hidden="true" />EV transition plan</span></div>
            <div className="flex items-center gap-1" aria-label="Chart zoom controls">
              <button type="button" className="grid size-8 place-items-center rounded-md border border-line-strong text-base font-semibold text-secondary hover:border-[#668078] hover:text-primary disabled:cursor-default disabled:opacity-40" onClick={() => setZoom((value) => Math.max(1, value - 0.25))} disabled={zoom === 1} aria-label="Zoom out">−</button>
              <span className="min-w-12 text-center text-[0.68rem] font-semibold text-secondary">{Math.round(zoom * 100)}%</span>
              <button type="button" className="grid size-8 place-items-center rounded-md border border-line-strong text-base font-semibold text-secondary hover:border-[#668078] hover:text-primary disabled:cursor-default disabled:opacity-40" onClick={() => setZoom((value) => Math.min(2, value + 0.25))} disabled={zoom === 2} aria-label="Zoom in">+</button>
              <button type="button" className="ml-1 rounded-md px-2 py-1.5 text-[0.68rem] font-bold text-secondary hover:text-primary disabled:cursor-default disabled:opacity-40" onClick={() => setZoom(1)} disabled={zoom === 1}>Reset</button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto rounded-md border border-line bg-surface">
          <svg className="h-auto min-w-full" style={{ width: `${zoom * 100}%` }} viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-labelledby="cost-chart-title cost-chart-description">
            <title id="cost-chart-title">Cumulative cost comparison from 2027 to 2036</title>
            <desc id="cost-chart-description">The transition plan costs more through 2032, then becomes cheaper than the current fleet baseline in 2033 and saves 370 thousand dollars by 2036.</desc>
            {[0, 250, 500, 750, 1000].map((value) => <g key={value}><line x1={plot.left} x2={chartWidth - plot.right} y1={yFor(value)} y2={yFor(value)} stroke="#273a35" strokeWidth="1" /><text x={plot.left - 12} y={yFor(value) + 4} textAnchor="end" fill="#b1c3bd" fontSize="12">${value}k</text></g>)}
            <line x1={breakEvenX} x2={breakEvenX} y1={plot.top} y2={chartHeight - plot.bottom} stroke="#55d6be" strokeDasharray="5 5" strokeWidth="1.5" />
            <rect x={breakEvenX - 48} y={plot.top - 22} width="96" height="22" rx="5" fill="#55d6be" />
            <text x={breakEvenX} y={plot.top - 7} textAnchor="middle" fill="#06231d" fontSize="11" fontWeight="700">PAYBACK 2033</text>
            <polyline points={points(baseline)} fill="none" stroke="#a7b8b2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={points(transition)} fill="none" stroke="#55d6be" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {baseline.map((value, index) => <circle key={`baseline-${years[index]}`} cx={xFor(index)} cy={yFor(value)} r="4" fill="#a7b8b2"><title>{`${years[index]} current fleet: $${value}k`}</title></circle>)}
            {transition.map((value, index) => <circle key={`transition-${years[index]}`} cx={xFor(index)} cy={yFor(value)} r="4" fill="#55d6be"><title>{`${years[index]} transition plan: $${value}k`}</title></circle>)}
            <circle cx={breakEvenX} cy={breakEvenY} r="6" fill="#55d6be" stroke="#07100f" strokeWidth="3" />
            <text x={xFor(years.length - 1) - 8} y={yFor(transition[transition.length - 1]) - 13} textAnchor="end" fill="#55d6be" fontSize="12" fontWeight="700">${endSavings}k saved</text>
            {years.map((year, index) => <text key={year} x={xFor(index)} y={chartHeight - 20} textAnchor="middle" fill="#b1c3bd" fontSize="12">{year}</text>)}
            <text x="16" y={chartHeight / 2} transform={`rotate(-90 16 ${chartHeight / 2})`} textAnchor="middle" fill="#b1c3bd" fontSize="12">Cumulative cost (USD)</text>
          </svg>
        </div>
        <p className="mt-2 border-t border-line pt-4 text-xs leading-relaxed text-secondary"><strong className="text-accent">How to read this:</strong> The plan costs more during the transition, crosses below the current fleet in 2033, and saves ${endSavings}k by 2036. Hover a data point for its annual value. Values are illustrative and will be replaced by simulation results.</p>
      </div>
  </CollapsibleSection>;
}