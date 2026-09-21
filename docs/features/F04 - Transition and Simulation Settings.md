# F04 — Transition & Simulation Settings

**M1 priority:** MUST  
**Primary owner:** Elijah Chua Jye Kang

## User capability

Users can choose a replacement/target vehicle preset, transition year and the economic assumptions used by the active scenario calculation.

## User need

Transition decisions and assumptions must be explicit and editable so users can test how different fleet plans affect costs and payback.

## M1 scope

- Select a target preset for a fleet vehicle.
- Select or clear its transition year.
- Edit the M1 financial assumptions consumed by the simulation model, such as fuel/electricity prices and the analysis period where applicable.
- Validate numeric inputs and preserve the last valid authoritative value when a draft is invalid.
- Recalculate dependent results when committed inputs change.
- Keep scenario-owned transition inputs isolated between scenarios.

Charging strategy and full power feasibility settings are later scope unless required by an approved M1 change.

## Technical dependencies

- [T02 — Company Design System & UI Component Library](../tech-tasks/T02%20-%20Company%20Design%20System%20and%20UI%20Component%20Library.md)
- [T03 — Fleet & Scenario Data Engine](../tech-tasks/T03%20-%20Fleet%20and%20Scenario%20Data%20Engine.md)
- [T04 — Timeline & Scenario Playback System](../tech-tasks/T04%20-%20Timeline%20and%20Scenario%20Playback%20System.md)
- [T05 — Simulation & Financial Engine](../tech-tasks/T05%20-%20Simulation%20and%20Financial%20Engine.md)
- [T06 — Project & Scenario Workspace Orchestration System](../tech-tasks/T06%20-%20Project%20and%20Scenario%20Workspace%20Orchestration%20System.md)

## M1 evidence

Change a target preset, transition year or economic assumption and show that the same committed input is reflected in the scenario state, selected-year behavior and financial results.
