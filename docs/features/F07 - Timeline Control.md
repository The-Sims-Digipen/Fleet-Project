# F07 — Timeline Control

**M1 priority:** MUST  
**Primary owner:** Jarrel Tay Wee Han

## User capability

Users can select a year and play/pause/reset the analysis timeline while time-dependent fleet and 3D views use the same selected-year state.

## User need

Users need to understand when planned transitions occur and how the fleet changes over the analysis period.

## M1 scope

- Display the configured analysis-period years.
- Select/seek to a year.
- Play, pause and reset timeline playback.
- Generate transition markers from real scenario transition data.
- Drive one authoritative selected year through T04.
- Keep dependent fleet/3D/analytics views synchronized to that selected year where applicable.

Charger-installation markers become required when charging infrastructure enters the approved product scope.

## Technical dependencies

- [T02 — Company Design System & UI Component Library](../tech-tasks/T02%20-%20Company%20Design%20System%20and%20UI%20Component%20Library.md)
- [T03 — Fleet & Scenario Data Engine](../tech-tasks/T03%20-%20Fleet%20and%20Scenario%20Data%20Engine.md)
- [T04 — Timeline & Scenario Playback System](../tech-tasks/T04%20-%20Timeline%20and%20Scenario%20Playback%20System.md)
- [T05 — Simulation & Financial Engine](../tech-tasks/T05%20-%20Simulation%20and%20Financial%20Engine.md)
- [T07 — Analytics Results & Visualization System](../tech-tasks/T07%20-%20Analytics%20Results%20and%20Visualization%20System.md)

## M1 evidence

Seek to years before and after a real transition, then play/pause/reset the timeline; the displayed selected year, transition markers and dependent views must agree.
