# F21 — Simulation and application performance engineering

**Active:** M5 W02-M6 W03

## What this feature must accomplish

Repeated edits and year scrubbing stay within the recorded latency budget and optimization does not change deterministic results.

## Required behavior

- repeated calculation/update profiling with the reference fleet and two scenarios;
- elimination of unnecessary recomputation, duplicated derived state, and excessive React subscription/update fan-out;
- chart/list rendering optimization for frequent timeline/input changes;
- save snapshot behavior that does not block or incorrectly clear newer dirty edits;
- performance regression tests/measurements for simulation p95 and edit-to-visible-result latency;
- integration fixes uncovered by load/performance testing.

### Reference workload
Define/record a deterministic fleet/scenario dataset and repeated operations: assumption edits, bulk schedule change, selected-year scrub, chart/list update, comparison recalculation, and save snapshot creation.

### Profiling targets
Measure simulation evaluation, derived-state recomputation, React/Zustand subscription fan-out, ECharts updates, large fleet list rendering, comparison delta calculation, and edit-to-visible-result latency. Optimize based on measured hotspots.

### Architectural constraints
Keep one canonical derived calculation path; do not cache editable results as authoritative state. Memoization/cache keys must include every dependency and must not produce stale cross-scenario output. Save snapshotting cannot clear newer edits.

### Verification
Compare optimized outputs with reference deterministic results. Add performance regression measurements for critical paths and rerun functional suites after each structural optimization.

## Related implementation docs

- [Annual simulation model](../tech/simulation.md)
- [Product design](../design/product-design.md)
