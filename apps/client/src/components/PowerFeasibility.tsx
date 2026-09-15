import { useState } from "react";
import { CollapsibleSection } from "./CollapsibleSection";

// Inputs to the panel: the site's grid connection ceiling and the plan's peak
// charging load, both in kW. Currently only MOCK scenarios feed these until the
// charging/feasibility model supplies real data via the `data` prop.
export type PowerFeasibilityInput = { siteLimitKw: number; peakDemandKw: number };
export type PowerFeasibilityResult = { availableKw: number; exceeded: boolean };

// Pure feasibility logic, independent of rendering.
export function evaluateFeasibility({ siteLimitKw, peakDemandKw }: PowerFeasibilityInput): PowerFeasibilityResult {
  return {
    availableKw: siteLimitKw - peakDemandKw,
    exceeded: peakDemandKw > siteLimitKw,
  };
}

// F08 stub: mock values only. No charging, demand, or feasibility calculations
// are performed. When the charging/feasibility model lands, these mock scenarios
// and the demo toggle are removed and values are fed to the `data` prop from the
// real model instead.
const scenarios: Record<"within" | "exceeded", PowerFeasibilityInput> = {
  within: { siteLimitKw: 250, peakDemandKw: 180 },
  exceeded: { siteLimitKw: 250, peakDemandKw: 320 },
};

const formatKw = (value: number) => `${value.toLocaleString("en-SG")} kW`;

function Metric({ label, value, description }: { label: string; value: string; description: string }) {
  return <div className="grid gap-1">
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[0.72rem] font-semibold text-secondary">{label}</span>
      <span className="font-mono text-sm font-semibold text-primary tabular-nums">{value}</span>
    </div>
    <p className="text-[0.68rem] leading-relaxed text-secondary">{description}</p>
  </div>;
}

export function PowerFeasibility({ data }: { data?: PowerFeasibilityInput }) {
  const [scenario, setScenario] = useState<"within" | "exceeded">("within");
  // Real data drives the panel when provided, otherwise fall back to the mock
  // scenario selected by the demo toggle.
  const values = data ?? scenarios[scenario];
  const { siteLimitKw, peakDemandKw } = values;
  const { availableKw, exceeded } = evaluateFeasibility(values);

  return <CollapsibleSection title="Power & Feasibility" description="Whether the selected plan fits within the site's available electrical capacity. Values are placeholders until the charging and feasibility model is connected.">
    <div className="grid gap-5">
      <div
        role={exceeded ? "alert" : "status"}
        className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 ${
          exceeded ? "border-[#b3563f] bg-[#2a1512] text-[#f0a58f]" : "border-[#355149] bg-[#0f211d] text-accent"
        }`}
      >
        <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center text-sm font-bold">{exceeded ? "▲" : "✓"}</span>
        <span className="text-sm font-semibold">{exceeded ? "Power Limit Exceeded" : "Within Capacity"}</span>
      </div>

      <div className="grid gap-4">
        <Metric label="Site connection limit" value={formatKw(siteLimitKw)} description="Maximum power the site's grid connection can supply." />
        <Metric label="Estimated peak demand" value={formatKw(peakDemandKw)} description="Highest simultaneous charging load the plan is expected to draw." />
        <Metric
          label="Available capacity"
          value={formatKw(availableKw)}
          description={exceeded
            ? "Demand exceeds the connection limit; the shortfall is shown as a negative value."
            : "Headroom remaining under the connection limit (site limit minus peak demand)."}
        />
      </div>

      {!data && <fieldset className="m-0 grid gap-2.5 border-0 p-0">
        <legend className="mb-1 text-[0.62rem] font-bold tracking-[0.1em] text-secondary uppercase">Demo preview (mock data)</legend>
        <div className="grid grid-cols-2 gap-2.5" role="group" aria-label="Preview feasibility state">
          {(["within", "exceeded"] as const).map((option) => <button
            key={option}
            type="button"
            aria-pressed={scenario === option}
            onClick={() => setScenario(option)}
            className={`min-h-11 rounded-lg border px-3 text-xs font-bold transition-colors duration-150 motion-reduce:transition-none ${
              scenario === option ? "border-accent text-primary" : "border-line-strong text-secondary hover:border-[#668078] hover:text-primary"
            }`}
          >{option === "within" ? "Within capacity" : "Over limit"}</button>)}
        </div>
      </fieldset>}
    </div>
  </CollapsibleSection>;
}
