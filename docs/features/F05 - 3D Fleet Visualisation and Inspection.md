# F05 — 3D Fleet Visualisation & Inspection

**M1 priority:** MUST  
**Primary owner:** Chew Shee Yang

## Shared integration contract

Follow the [M1 integration contract](../tech/m1-integration-contract.md). F05 reads T03 `EffectiveVehicleState` using T04's selected year and renders it without independently applying transition rules or mutating scenario/simulation state.

## User capability

Users can view the depot/fleet in 3D, navigate the scene, select relevant objects or vehicles, inspect information, and see the displayed fleet state respond to the active scenario and selected year.

## User need

The 3D view provides a spatial representation of the plan and lets users verify that scenario/timeline changes are reflected visually rather than existing only in forms and charts.

## M1 scope

- Render the current 3D World.
- Support the existing navigation and selection/inspection interactions required by the M1 build.
- Render fleet vehicles from real project/scenario state rather than an independent hard-coded fleet source.
- Use the shared selected year from T04.
- Display the current preset/state before a transition and the target preset/state from the transition year onward.
- Keep rendering read-only with respect to authoritative simulation/scenario state.

Detailed depot authoring, production asset polish and charging-layout feasibility are later milestone scope.

## Technical dependencies

- [T02 — Company Design System & UI Component Library](../tech-tasks/T02%20-%20Company%20Design%20System%20and%20UI%20Component%20Library.md)
- [T03 — Fleet & Scenario Data Engine](../tech-tasks/T03%20-%20Fleet%20and%20Scenario%20Data%20Engine.md)
- [T04 — Timeline & Scenario Playback System](../tech-tasks/T04%20-%20Timeline%20and%20Scenario%20Playback%20System.md)

## M1 evidence

Select a scenario and move the timeline across a vehicle's transition year; the 3D representation must use the same selected year and show the appropriate pre/post-transition vehicle state.
