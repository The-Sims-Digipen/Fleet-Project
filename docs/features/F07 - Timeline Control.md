# F07 — Timeline Control

**M1 priority:** MUST  
**Primary owner:** Jarrel Tay Wee Han

## Shared integration contract

Follow the [M1 integration contract](../tech/m1-integration-contract.md). F07 uses the current workspace's selected year and playback state in `projectStore`, Project `AnalysisSettings`, and derived events for every Scenario Vehicle transition. Plan and Compare have independent Project-scoped timelines; components inside either workspace must use that workspace's canonical clock and must not duplicate effective-preset logic.

## User capability

Users can select a year and play/pause/reset the analysis timeline while time-dependent fleet and 3D views use the same selected-year state.

## User need

Users need to understand when planned transitions occur and how the fleet changes over the analysis period.

## M1 scope

- Display the configured analysis-period years.
- Select/seek to a year.
- Play, pause and reset timeline playback.
- Generate transition markers from real scenario transition data.
- Drive the selected year through the Project runtime action.
- Keep dependent fleet/3D/analytics views synchronized to that selected year where applicable.

Charger-installation markers become required when charging infrastructure enters the approved product scope.

## M1 evidence

Seek to years before and after a real transition, then play/pause/reset the timeline; the displayed selected year, transition markers and dependent views must agree.
