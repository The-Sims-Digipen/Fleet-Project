import { CollapsibleSection } from "./CollapsibleSection";

/** Keeps deferred charging work visible without presenting placeholder outputs as calculations. */
export function PowerFeasibility() {
  return <CollapsibleSection title="Charging & feasibility" description="Later product scope">
    <p className="text-xs leading-relaxed text-secondary">
      Charging strategies, charger placement, and site-power feasibility are planned for a later milestone. They are not assumptions in this Project or its M1 simulation results.
    </p>
  </CollapsibleSection>;
}
