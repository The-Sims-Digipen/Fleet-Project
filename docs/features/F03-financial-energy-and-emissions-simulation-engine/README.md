# F03 — Financial, energy, and emissions simulation engine

**Owner:** Elijah  
**Active:** M1 W01-M2 W04

## What this feature must accomplish

The UI can edit assumptions and schedules repeatedly and every displayed result is reproducible from the scenario inputs alone.

## Required behavior

- annual baseline and scenario calculations over the selected analysis period;
- purchase/lease, residual, maintenance, fuel/energy, and infrastructure cost treatment;
- TCO, CAPEX, OPEX, cost delta, per-vehicle/per-km values, cumulative savings, and payback;
- annual/total energy, fuel displacement, electricity consumption, and emissions;
- immediate recalculation from scenario inputs with no hidden stored-result state;
- detailed breakdown structures consumed by charts and explanations;
- non-finite/zero denominator protection and invalid-draft handling contract;
- independent numerical fixtures for normal and boundary cases.

### Engine shape
Prefer pure deterministic functions taking validated project/scenario inputs and returning typed annual/horizon results. Do not read React state or database state inside the engine.

### Formula contract
Implement the annual-v1 timing/cost/residual/payback/emissions rules documented in `docs/tech/simulation.md`. Charger CAPEX/energy/feasibility data is integrated through typed inputs/results rather than recomputed by charts.

### Result model
Expose breakdowns at fleet, year, vehicle where needed, and baseline/scenario levels so every chart/KPI can be derived without recalculating formulas in UI components. Include null/status forms for undefined ratios/payback.

### Verification
Use independent arithmetic reference fixtures and compare full precision with tolerance. Add regression tests for replacement-before-transition, same-year replacement/transition, owned/lease exit, residual disposal, empty fleet, zero denominators, negative emissions reduction, and repeatability.

## Related implementation docs

- [Annual simulation model](../../tech/simulation.md)
