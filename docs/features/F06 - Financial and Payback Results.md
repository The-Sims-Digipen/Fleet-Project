# F06 — Financial & Payback Results

**M1 priority:** MUST  
**Primary owner:** Yap Zhi Kai

## User capability

Users can view recalculated financial results, including baseline-versus-transition costs and payback/breakeven information, after changing scenario decisions or economic assumptions.

## User need

Users need clear, traceable financial feedback to understand the cost impact of a transition plan rather than relying on hard-coded demonstration numbers.

## M1 scope

- Display real output from T05 rather than mock chart arrays or fixed KPI values.
- Show baseline and active-scenario cost series over the analysis period.
- Show relevant M1 KPI values such as TCO, savings and payback/breakeven.
- Handle `payback not reached` explicitly.
- Use consistent units, legends and formatting.
- Support selected-year indicators where appropriate without recalculating financial logic inside the UI layer.

## Technical dependencies

- [T02 — Company Design System & UI Component Library](../tech-tasks/T02%20-%20Company%20Design%20System%20and%20UI%20Component%20Library.md)
- [T05 — Simulation & Financial Engine](../tech-tasks/T05%20-%20Simulation%20and%20Financial%20Engine.md)
- [T07 — Analytics Results & Visualization System](../tech-tasks/T07%20-%20Analytics%20Results%20and%20Visualization%20System.md)

## M1 evidence

Change a real scenario transition or economic assumption and show the KPI/chart values update from T05 outputs, including a tested payback or no-payback case with no hard-coded result values.
