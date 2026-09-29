# T04 — Timeline & Scenario Playback System

**Owner:** Jarrel Tay Wee Han  
**M1 contract:** Required  
**Supports:** F04, F05, F07

## Shared integration contract

Follow the [M1 integration contract](../tech/m1-integration-contract.md). T04 consumes Project `AnalysisSettings` and derived Scenario transition events. `projectStore` owns selected-year runtime state; T04 defines playback behavior through its runtime actions and must not independently resolve effective Vehicle Presets.

## Goal

Provide timeline seeking, playback behavior, and projection of real Scenario events using the selected year in Project runtime state, so every time-dependent view uses one shared time source.

## Responsibilities

- Read and update the Project runtime's selected analysis year for the active planning context; do not maintain a parallel clock.
- Clamp seeking/playback to the configured analysis period.
- Implement play, pause and reset behavior.
- Project vehicle-transition markers/events from T03 scenario data.
- Let dependent Fleet/3D/Analytics views observe selected-year changes through Project selectors.
- Keep event projection separate from transition business rules; T03 remains authoritative for effective vehicle state.
- Provide deterministic behavior suitable for unit/integration tests.

## M1 boundaries

T04 must not reimplement `year >= transitionYear` rules in UI components. Timeline controls update Project runtime state; consumers query the canonical effective-Vehicle selector using that shared time context.

## M1 evidence

Seek and play across the analysis period, show real transition events at the configured year, and verify Fleet/3D views agree on the same selected year while play/pause/reset behave consistently.
