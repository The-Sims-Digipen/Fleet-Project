# F04 — Transition & Simulation Settings

**M1 priority:** MUST  
**Primary owner:** Elijah Chua Jye Kang

## Shared integration contract

Follow the [M1 integration contract](../tech/m1-integration-contract.md). F04 commits shared Analysis Settings to the Project and ordered Vehicle transition plans to a Scenario through Project commands; component-local state is for invalid or uncommitted drafts only.

## User capability

Users can choose target vehicle presets and transition years, then set the shared assumptions used by every Scenario calculation.

## User need

Transition decisions and assumptions must be explicit and editable so users can test how different fleet plans affect costs and payback.

## M1 scope

- Select a target preset for a fleet vehicle.
- Select or clear its transition year.
- Support ordered multiple transitions per Vehicle in the Project domain and each Scenario, with distinct years; use Project commands to add, update, remove, or replace a plan.
- Edit the shared analysis period, discount rate, fuel price, one electricity price, and fuel/grid emissions factors.
- Validate numeric inputs and preserve the last valid authoritative value when a draft is invalid.
- Recalculate the baseline and every Scenario when a shared assumption changes.
- Keep each Scenario's Vehicle transition timeline isolated from the other Scenarios.

Charging strategy, depot charging share, charger availability, and separate depot/external tariffs are later scope. They do not appear in the M1 Project contract or UI and are not owned by an M1 Scenario.

## Technical dependencies

- [T02 — Company Design System & UI Component Library](../tech-tasks/T02%20-%20Company%20Design%20System%20and%20UI%20Component%20Library.md)
- [T03 — Fleet & Scenario Data Engine](../tech-tasks/T03%20-%20Fleet%20and%20Scenario%20Data%20Engine.md)
- [T04 — Timeline & Scenario Playback System](../tech-tasks/T04%20-%20Timeline%20and%20Scenario%20Playback%20System.md)
- [T05 — Simulation & Financial Engine](../tech-tasks/T05%20-%20Simulation%20and%20Financial%20Engine.md)
- [T06 — Project & Scenario Workspace Orchestration System](../tech-tasks/T06%20-%20Project%20and%20Scenario%20Workspace%20Orchestration%20System.md)

## M1 evidence

Change a target preset, transition year, or shared assumption and show that the committed Project input is reflected in the canonical effective Vehicle state and derived results for every Scenario.
