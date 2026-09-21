# T05 — Simulation & Financial Engine

**Owner:** Elijah Chua Jye Kang  
**M1 contract:** Required  
**Supports:** F04, F06, F07

## Goal

Provide a deterministic, UI-independent calculation engine for baseline and transition scenarios that produces the real financial/energy outputs consumed by the M1 product.

## Responsibilities

- Accept typed fleet, preset, scenario and analysis-setting inputs.
- Resolve annual scenario operation using T03 domain state/contracts.
- Calculate M1 energy/fuel use and operating costs.
- Calculate acquisition CAPEX, OPEX, cumulative cash cost and TCO according to the documented annual model.
- Calculate scenario savings and payback/breakeven, including `not reached`.
- Produce annual outputs suitable for T07 charts/KPIs.
- Produce identical output for identical input and never emit NaN/Infinity for supported edge cases.
- Implement the applicable worked fixtures from `docs/tech/simulation.md` as automated tests.

## M1 boundaries

Implement as pure TypeScript with no React, charting or persistence dependency. Charging/power feasibility and suitability remain later-scope engines even though the simulation specification documents their eventual model.

## M1 evidence

Change a target preset, transition year or economic assumption and show the calculated results change. Re-run identical inputs and verify identical output; demonstrate key worked fixture tests passing.
