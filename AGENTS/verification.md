# Verification and acceptance plan

Technical acceptance criteria for the M1–M6 application. The [weekly plan](../docs/weekly-plan.md) maps these checks to the implementation features in the [feature catalogue](../docs/features/README.md).

## Acceptance scenarios

| ID | Technical scenario and required evidence | Primary features |
|---|---|---|
| AT01 | Create two user-defined vehicle presets and unequal vehicles. Transition A now/B later to selected target presets, reverse/delay the ordering, then clear one transition. Assert annual preset state/counts, cost/emissions changes, 3D state, and save/reload equality. | F02, F03, F04, F05, F07 |
| AT02 | Select individuals, arbitrary combinations, and filtered/grouped categories; apply partial/staged/full transition strategies and verify unscheduled vehicles remain on their current presets. Include empty fleet/selection and mixed target presets. | F02, F04 |
| AT03 | Hold the vehicle schedule fixed and compare depot/external/mixed charging. Verify energy allocation, infrastructure CAPEX, operating cost, charger timing, and comparison deltas. | F09, F10 |
| AT04 | Apply ±20% fuel/electricity price changes and target-preset economic changes. Verify deterministic recalculation and explanation output without mutating transition schedules. | F03, F11, F17 |
| AT05 | Delay/add chargers and change connection capacity. Verify one-time CAPEX, installation-year visibility, power/dwell/readiness issues, and both visual/text overload feedback. | F09, F12, F17 |
| AT06 | Create/rename/duplicate/delete scenarios, edit a duplicate, and prove the original remains unchanged. Verify the final scenario cannot be accidentally deleted. | F07, F08 |
| AT07 | Save/reopen full projects; inject backend unavailability, invalid payloads, oversized bodies, unsupported versions, and stale revisions. Verify working edits survive and the last stored version remains consistent. | F07, F08, F19 |
| AT08 | Author concave sites, self-intersecting rings, repeated vertices, obstacles, rotated bays/chargers, edge contact, and out-of-bound objects. Verify structured issues and no triangulation/render crash. | F13, F14 |
| AT09 | Assign/unassign bays, create/duplicate/delete objects, edit numerically, snap, cancel, undo, and redo. Verify reference restoration plus independent persisted layouts across duplicated scenarios. | F13, F14, F15, F16 |
| AT10 | Select two scenarios and scrub the shared year. Assert charts, annual fleet state, installed chargers, warnings, and each independent 3D scene agree with its own scenario result. | F10, F12, F17 |
| AT11 | Reproduce independent numerical fixtures for TCO, CAPEX, OPEX, payback, energy, and emissions. Include zero denominators, delayed transitions, residual timing, lease/purchase cases, and unreached payback; reject non-finite output. | F03, F21 |
| AT12 | Isolate every suitability factor and feasibility influence; verify deterministic tie ordering, explanation contributions, and advisory-only behavior. | F11, F17 |
| AT13 | Verify keyboard operation, labels/errors, focus visibility, last-valid-result behavior, text warnings, empty/loading/failure states, and that primary panels remain reachable when the layout reflows. | F04, F15, F18 |
| AT14 | Run the reference workload and record simulation/update latency, frame behavior, and repeated scene/project switching without monotonic resource/listener growth after warmup. | F20, F21 |
| AT15 | From a clean clone, install, typecheck, test, build, initialize/upgrade the database, start client/server, persist/reopen a project, and run a production smoke test on required environments. | F19, F22 |

## Verification coverage

| Layer | Evidence |
|---|---|
| Vehicle/domain | Preset references, CRUD, grouping, bulk transition changes, annual state, assignments, suitability determinism |
| Calculations | Independent worked fixtures, annual/cumulative results, invalid/edge values, unchanged inputs, deterministic recomputation |
| Geometry/history | Concave boundaries, intersections, rotated footprints, snapping, cancellation, undo/redo, invalid-shape handling |
| Persistence | Save/load equality, atomic writes, migrations, revision conflicts, failed-write recovery, scenario/layout isolation |
| Interface | Forms, project/scenario flows, responsive panels, selection, editor controls, comparison, invalid/error states |
| Browser/3D | WebGL picking, camera interaction, year-driven asset state, polygon tools, dual scenes, resource lifecycle, performance |

## Reference workload and performance targets

Acceptance workload: 100 individual vehicles, at least 6 user-defined vehicle presets, 10 analysis years, two scenarios shown together, 200 bays, 20 chargers, and 20 obstacles of up to 20 vertices each, at 1920×1080 CSS pixels with device pixel ratio capped at 1 for measurement. This is a reproducible synthetic fixture, not a fleet-size restriction.

After five warmup evaluations, measure 100 committed input changes. Target simulation p95 <= 100 ms and edit-to-visible-results p95 <= 250 ms on the recorded reference machine. During a 60-second orbit/timeline interaction, target median >= 30 FPS with no application-caused stall > 1 second. Record browser/version, OS, CPU, RAM, GPU, power mode, viewport, dataset, and raw samples. Repeated project/scenario/scene switching over 20 cycles must not show unexplained monotonic retained-resource growth after cache warmup.

## Milestone gates

- **M1:** one persisted end-to-end slice using real shared vehicle/preset/simulation/3D data.
- **M2:** complete planning, analytics, and project/scenario persistence.
- **M3:** charging/feasibility, suitability, two-plan comparison, and dual 3D state.
- **M4:** complete freeform depot authoring/history/layout persistence.
- **M5:** all features integrated with performance/UI/backend hardening.
- **M6:** full regression, clean-environment verification, performance targets, and accepted technical release.

## Feature specifications

The implementation contract for each F01–F22 item lives in [`docs/features/`](../docs/features/README.md). Acceptance scenarios above reference those same IDs directly, so no second feature/task mapping is maintained.
