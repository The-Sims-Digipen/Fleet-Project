# F06 — Financial & Payback Results

**M1 priority:** MUST  
**Primary owner:** Yap Zhi Kai

## Shared integration contract

Follow the [M1 integration contract](../tech/m1-integration-contract.md). F06 renders view models derived from `SimulationResult`; KPI cards and charts use the canonical effective Vehicle interpretation and must not contain fallback financial calculations or hard-coded authoritative values.

## User capability

Users can view recalculated financial results, including baseline-versus-transition costs and payback/breakeven information, after changing scenario decisions or economic assumptions.

## User need

Users need clear, traceable financial feedback to understand the cost impact of a transition plan rather than relying on hard-coded demonstration numbers.

## M1 scope

- Display real simulation output rather than mock chart arrays or fixed KPI values.
- Show baseline and active-scenario cost series over the analysis period.
- Show relevant M1 KPI values such as TCO, savings and payback/breakeven.
- Show scenario-minus-baseline cost difference, fleet cost per km and per vehicle, fuel displaced, and emissions-reduction percentage when baseline emissions are nonzero. Preserve negative cost and emissions results with clear signs, and label zero-denominator values as unavailable.
- Handle `payback not reached` explicitly.
- Use consistent units, legends and formatting.
- Support selected-year indicators where appropriate without recalculating financial logic inside the UI layer.

## M1 evidence

Change a real Scenario transition or economic assumption and show the KPI/chart values update from simulation outputs, including a tested payback or no-payback case with no hard-coded result values.
