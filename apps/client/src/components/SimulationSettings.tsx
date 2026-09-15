import { useRef, useState, type ReactNode } from "react";
import { CollapsibleSection } from "./CollapsibleSection";
import { NumberControl, type EditLifecycle } from "./controls";

type Assumptions = {
  years: number; annualRouteDistance: number; dieselPrice: number; dieselPriceChange: number;
  dieselLitresPer100Km: number; electricityPrice: number; electricityPriceChange: number;
  electricKwhPer100Km: number; sitePowerLimit: number;
};
type YearRow = { year: number; dieselPrice: number; electricityPrice: number; dieselCost: number; electricityCost: number };
type Result = { distance: number; dieselLitres: number; electricityKwh: number; rows: YearRow[] };

const initialAssumptions: Assumptions = {
  years: 5, annualRouteDistance: 25_000, dieselPrice: 2.15, dieselPriceChange: 0,
  dieselLitresPer100Km: 10, electricityPrice: 0.3, electricityPriceChange: 0,
  electricKwhPer100Km: 25, sitePowerLimit: 250,
};
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const currency = (value: number) => `$${value.toFixed(2)}`;

function InputGroup({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <fieldset className="grid gap-4 rounded-lg border border-line bg-surface p-4"><legend className="sr-only">{title}</legend>
    <div><h4 className="text-sm font-semibold text-primary">{title}</h4><p className="mt-1 text-xs leading-relaxed text-secondary">{description}</p></div>
    <div className="grid gap-4">{children}</div>
  </fieldset>;
}

function createResult(assumptions: Assumptions): Result {
  const annualDieselLitres = assumptions.annualRouteDistance * assumptions.dieselLitresPer100Km / 100;
  const annualElectricityKwh = assumptions.annualRouteDistance * assumptions.electricKwhPer100Km / 100;
  const rows = Array.from({ length: assumptions.years }, (_, index) => {
    const dieselPrice = assumptions.dieselPrice * Math.pow(1 + assumptions.dieselPriceChange / 100, index);
    const electricityPrice = assumptions.electricityPrice * Math.pow(1 + assumptions.electricityPriceChange / 100, index);
    return { year: index + 1, dieselPrice, electricityPrice, dieselCost: annualDieselLitres * dieselPrice, electricityCost: annualElectricityKwh * electricityPrice };
  });
  return { distance: assumptions.annualRouteDistance * assumptions.years, dieselLitres: annualDieselLitres * assumptions.years, electricityKwh: annualElectricityKwh * assumptions.years, rows };
}

export function SimulationSettings() {
  const [assumptions, setAssumptions] = useState(initialAssumptions);
  const [result, setResult] = useState<Result | null>(null);
  const baseline = useRef<Assumptions | null>(null);
  const update = (patch: Partial<Assumptions>) => { setResult(null); setAssumptions((current) => ({ ...current, ...patch })); };
  const edit: EditLifecycle = {
    beginEdit: () => { baseline.current ??= assumptions; },
    commitEdit: () => { baseline.current = null; },
    cancelEdit: () => { if (baseline.current) setAssumptions(baseline.current); baseline.current = null; },
  };

  return <CollapsibleSection title="Simulation" defaultOpen description="Enter route and energy assumptions manually, then run a year-by-year diesel versus electric comparison.">
    <div className="grid gap-5">
      <InputGroup title="Simulation setup" description="Choose the period and route distance for this van.">
        <NumberControl label="Simulation length (years)" value={assumptions.years} min={1} step={1} edit={edit} onChange={(years) => { if (Number.isInteger(years)) update({ years }); }} />
        <NumberControl label="Manual route distance (km/year)" value={assumptions.annualRouteDistance} min={0} step={100} edit={edit} onChange={(annualRouteDistance) => update({ annualRouteDistance })} />
      </InputGroup>
      <InputGroup title="Diesel assumptions" description="Set the current diesel price, expected annual change, and van consumption.">
        <NumberControl label="Diesel price ($/L)" value={assumptions.dieselPrice} min={0} step={0.01} edit={edit} onChange={(dieselPrice) => update({ dieselPrice })} />
        <NumberControl label="Annual diesel price change (%)" value={assumptions.dieselPriceChange} min={-100} step={0.1} edit={edit} onChange={(dieselPriceChange) => update({ dieselPriceChange })} />
        <NumberControl label="Diesel consumption (L/100 km)" value={assumptions.dieselLitresPer100Km} min={0} step={0.1} edit={edit} onChange={(dieselLitresPer100Km) => update({ dieselLitresPer100Km })} />
      </InputGroup>
      <InputGroup title="Electric assumptions" description="Use the comparable electric vehicle's tariff and energy consumption.">
        <NumberControl label="Electricity price ($/kWh)" value={assumptions.electricityPrice} min={0} step={0.01} edit={edit} onChange={(electricityPrice) => update({ electricityPrice })} />
        <NumberControl label="Annual electricity price change (%)" value={assumptions.electricityPriceChange} min={-100} step={0.1} edit={edit} onChange={(electricityPriceChange) => update({ electricityPriceChange })} />
        <NumberControl label="Electric consumption (kWh/100 km)" value={assumptions.electricKwhPer100Km} min={0} step={0.1} edit={edit} onChange={(electricKwhPer100Km) => update({ electricKwhPer100Km })} />
      </InputGroup>
      <InputGroup title="Site constraint" description="This will be used by the future charging-feasibility calculation.">
        <NumberControl label="Site power limit (kW)" value={assumptions.sitePowerLimit} min={0} step={1} edit={edit} onChange={(sitePowerLimit) => update({ sitePowerLimit })} />
      </InputGroup>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" className="min-h-12 rounded-lg bg-accent px-4 text-sm font-bold text-accent-ink hover:brightness-110" onClick={() => setResult(createResult(assumptions))}>Finalize simulation</button>
        <button type="button" className="min-h-12 rounded-lg border border-line-strong px-4 text-sm font-bold text-secondary hover:border-[#668078] hover:text-primary" onClick={() => { baseline.current = null; setAssumptions(initialAssumptions); setResult(null); }}>Reset sample</button>
      </div>
      <p className="text-xs leading-relaxed text-secondary">Indicative estimate only. Results use your manually entered route, energy, and price assumptions; they are not an engineering or tariff quote.</p>
      {result && <SimulationResults result={result} />}
    </div>
  </CollapsibleSection>;
}

function SimulationResults({ result }: { result: Result }) {
  const dieselTotal = result.rows.reduce((sum, row) => sum + row.dieselCost, 0);
  const electricityTotal = result.rows.reduce((sum, row) => sum + row.electricityCost, 0);
  const difference = dieselTotal - electricityTotal;
  return <section className="grid gap-4" aria-labelledby="simulation-results-title">
    <div className="overflow-x-auto rounded-lg border border-line-strong"><table className="w-full min-w-[520px] border-collapse text-left text-xs"><caption className="border-b border-line bg-control px-4 py-3 text-left font-semibold text-primary">Year-by-year energy cost comparison</caption>
      <thead className="bg-surface text-secondary"><tr><th className="px-4 py-3">Year</th><th className="px-4 py-3">Diesel price</th><th className="px-4 py-3">Diesel cost</th><th className="px-4 py-3">Electric cost</th><th className="px-4 py-3">Difference</th></tr></thead>
      <tbody>{result.rows.map((row) => <tr key={row.year} className="border-t border-line"><td className="px-4 py-3 font-semibold text-primary">{row.year}</td><td className="px-4 py-3 text-secondary">{currency(row.dieselPrice)}/L</td><td className="px-4 py-3 text-secondary">{currency(row.dieselCost)}</td><td className="px-4 py-3 text-secondary">{currency(row.electricityCost)}</td><td className="px-4 py-3 text-primary">{currency(Math.abs(row.dieselCost - row.electricityCost))} {row.dieselCost >= row.electricityCost ? "saving" : "extra"}</td></tr>)}</tbody>
    </table></div>
    <div className="rounded-lg border border-line-strong bg-control p-4" role="status"><div className="flex items-center justify-between gap-3"><h4 id="simulation-results-title" className="text-sm font-semibold text-primary">Overall summary</h4><span className="rounded-full border border-accent/50 bg-accent/10 px-2 py-1 text-[0.62rem] font-bold text-accent">Simulation complete</span></div>
      <p className="mt-2 text-xs leading-relaxed text-secondary">Power assessment pending charger-demand data.</p>
      <ul className="mt-3 grid gap-2 text-xs leading-relaxed text-secondary">
        <li><span className="font-semibold text-primary">Total distance:</span> {number.format(result.distance)} km</li>
        <li><span className="font-semibold text-primary">Diesel required:</span> {number.format(result.dieselLitres)} L</li>
        <li><span className="font-semibold text-primary">Electricity required:</span> {number.format(result.electricityKwh)} kWh</li>
        <li><span className="font-semibold text-primary">Diesel cost:</span> {currency(dieselTotal)}</li>
        <li><span className="font-semibold text-primary">Electric cost:</span> {currency(electricityTotal)}</li>
        <li><span className="font-semibold text-primary">Energy-cost difference:</span> {currency(Math.abs(difference))} {difference >= 0 ? "lower with electric" : "higher with electric"}</li>
      </ul>
      <CostChart dieselTotal={dieselTotal} electricityTotal={electricityTotal} />
    </div>
  </section>;
}

function CostChart({ dieselTotal, electricityTotal }: { dieselTotal: number; electricityTotal: number }) {
  const maximum = Math.max(dieselTotal, electricityTotal, 1);
  return <div className="mt-5 border-t border-line pt-4" role="img" aria-label="Cumulative diesel and electric energy cost chart">
    <p className="text-xs font-semibold text-primary">Cumulative cost at final year</p>
    <div className="mt-3 grid gap-3 text-xs">
      <div><div className="mb-1 flex justify-between gap-3 text-secondary"><span>Diesel</span><span>{currency(dieselTotal)}</span></div><div className="h-2 overflow-hidden rounded-full bg-surface"><div className="h-full rounded-full bg-[#d68b55]" style={{ width: `${dieselTotal / maximum * 100}%` }} /></div></div>
      <div><div className="mb-1 flex justify-between gap-3 text-secondary"><span>Electric</span><span>{currency(electricityTotal)}</span></div><div className="h-2 overflow-hidden rounded-full bg-surface"><div className="h-full rounded-full bg-accent" style={{ width: `${electricityTotal / maximum * 100}%` }} /></div></div>
    </div>
  </div>;
}
