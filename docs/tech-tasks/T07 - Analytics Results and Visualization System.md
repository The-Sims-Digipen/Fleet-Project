# T07 — Analytics Results & Visualization System

**Owner:** Yap Zhi Kai  
**M1 contract:** Required  
**Supports:** F06, F07

## Shared integration contract

Follow the [M1 integration contract](../tech/m1-integration-contract.md). T07 consumes `SimulationResult` and the T04 selected year to produce display-ready KPI/chart models; it must not recalculate financial, energy or emissions truth.

## Goal

Provide the typed presentation layer that converts T05 simulation outputs into consistent KPI/chart models for the financial/payback and timeline-oriented result views.

## Responsibilities

- Consume T05 `SimulationResult` output without independently recalculating financial values.
- Build baseline and transition-series view models for cost-over-time charts.
- Build KPI view models for TCO, savings and payback/breakeven.
- Represent `payback not reached`, empty/no-data and invalid-result states explicitly.
- Apply consistent units, formatting, legends and axis/domain logic.
- Support selected-year indicators/context where useful while keeping T04 as the authoritative clock.
- Remove hard-coded result arrays/summary values from the primary M1 financial views.

## M1 boundaries

T05 owns numerical truth; T07 owns result transformation/presentation. This boundary should allow later scenario comparison to reuse the same simulation outputs and visualization conventions.

## M1 evidence

Change a real scenario/economic input and show T05 output propagating into real KPI cards and charts, including baseline/scenario series and a tested payback or no-payback state with no hard-coded result values.
