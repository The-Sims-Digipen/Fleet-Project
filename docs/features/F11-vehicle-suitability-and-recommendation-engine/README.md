# F11 — Vehicle suitability and recommendation engine

**Owner:** Zhi Kai  
**Active:** M3 W01–M5 W02

## What this feature must accomplish

Rankings are explainable, reproducible, scenario-aware, and suitable for direct display in planning/comparison views.

## Required behavior

- scoring for range/distance fit, route predictability, depot return, charging access, dwell time, replacement timing, utilisation, economics, and relevant feasibility constraints;
- stable tie handling and deterministic ordering;
- per-factor contribution/reason output for every ranked vehicle;
- recalculation when target preset, charging strategy, transition timing, economic assumptions, or feasibility changes;
- assumption-impact reasons for important cost/emissions changes;
- advisory-only behavior that never mutates scenario transitions automatically;
- domain tests that isolate every scoring factor and edge case.

### Ranking engine
Implement the documented eight-factor score and constrained-first ordering as pure deterministic logic. Consume existing simulation/feasibility helpers instead of creating alternate range/charging/economic formulas.

### Output contract
Return rank order plus candidate ID, total score, constrained state, per-factor input/points/reason, site warnings, and economic basis/limitations. Keep stable vehicle-ID tie break.

### What-if evaluation
For each candidate, hypothetically transition only that candidate at selected year/target preset while retaining all other schedule entries. Do not mutate the scenario during evaluation. Exclude shared charger CAPEX from candidate economics as specified.

### Tests
Isolate every factor, boundaries at 80%/100% range and replacement-year thresholds, stable ties, already-transitioned vehicles, missing access, failed window, external-only behavior, and deterministic repeats.

## Related implementation docs

- [Annual simulation model](../../tech/simulation.md)
