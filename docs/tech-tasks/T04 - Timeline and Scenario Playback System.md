# T04 — Timeline & Scenario Playback System

**Owner:** Jarrel Tay Wee Han  
**M1 contract:** Required  
**Supports:** F04, F05, F07

## Shared integration contract

Follow the [M1 integration contract](../tech/m1-integration-contract.md). T04 consumes project `AnalysisSettings` plus T03 transition events, owns the single selected year and playback lifecycle, and must not independently resolve effective vehicle presets.

## Goal

Own the analysis clock: selected year, seeking and playback lifecycle, plus projection of real scenario events so every time-dependent view uses one shared time source.

## Responsibilities

- Maintain the authoritative selected analysis year for the active planning context.
- Clamp seeking/playback to the configured analysis period.
- Implement play, pause and reset behavior.
- Project vehicle-transition markers/events from T03 scenario data.
- Publish selected-year changes to dependent Fleet/3D/Analytics views.
- Keep event projection separate from transition business rules; T03 remains authoritative for effective vehicle state.
- Provide deterministic behavior suitable for unit/integration tests.

## M1 boundaries

T04 must not reimplement `year >= transitionYear` rules in UI components. It owns time/playback; consumers query T03/T05 using that shared time context.

## M1 evidence

Seek and play across the analysis period, show real transition events at the configured year, and verify Fleet/3D views agree on the same selected year while play/pause/reset behave consistently.
