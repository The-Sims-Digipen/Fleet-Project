# F07 — Timeline Control

**M1 priority:** MUST  
**Primary owner:** Jarrel Tay Wee Han

## Current controls

Plan / Depot contains a year slider, transition markers, event list, Play/Pause and Reset.
The analysis period defines the available years.
The active Scenario supplies Vehicle transition events within that period.
A marker selects its event year.

Play advances the selected year.
Pause stops playback.
Reset stops playback and returns to the start year.
Play restarts from the start year when the timeline is at its end.

The current Plan timeline has no numeric year field or year dropdown.

## Workspace state

Plan and Compare retain separate selected years and playback state.
A workspace change pauses its playback.
Each workspace retains its selected year.
An analysis-period change clamps both selected years to that period.

Both Scenario views in Compare use the Compare selected year.
Plan fleet status, 3D state and selected-year analytics use the Plan selected year.

## Integration

The feature follows the [M1 integration contract](../tech/m1-integration-contract.md).
`projectStore` owns timeline state.
`ProjectAnalysisSettings` defines the period.
Timeline components use runtime actions and derived transition events.
They do not duplicate effective-Preset logic.

## Demonstration

1. Select a year before a transition.
2. Select a year after the transition.
3. Inspect fleet and 3D state.
4. Play the timeline.
5. Pause the timeline.
6. Reset the timeline.
7. Inspect the selected year and transition markers.
