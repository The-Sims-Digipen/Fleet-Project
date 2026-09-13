# F17 — End-to-end feasibility and recommendation integration

**Owner:** Shee Yang  
**Active:** M5 W01–W03

## What this feature must accomplish

No subsystem can report a plan as feasible while another reports the same underlying state as infeasible because of divergent logic or stale data.

## Required behavior

- shared feasibility/result aggregation so cost, charging, space, operational constraints, recommendations, charts, and 3D overlays reference the same issue/result IDs;
- removal of duplicate or contradictory client-side feasibility logic;
- propagation of layout edits and transition changes through recommendation/comparison results;
- handling of partially invalid input while retaining the last valid integrated result;
- integration tests for the five source acceptance scenarios plus combined constraint cases.

### Unified derived state
Create one integration layer/result graph so simulation values, F09 feasibility, F13 geometry issues, F11 suitability, F10 comparison summaries, and F12 overlays reference consistent issue/result IDs and selected-year state.

### Remove divergent logic
Search for duplicate client-side range/power/feasibility checks and replace them with shared typed results/selectors. A plan must not be “feasible” in one view and “infeasible” in another for the same input snapshot.

### Invalid draft behavior
When UI drafts are incomplete, keep the last valid integrated result and explicitly mark it as based on last valid inputs. Do not partially mix new invalid values into some subsystems.

### Integration tests
Implement the five product acceptance scenarios plus combined conflicts (e.g. attractive economics + insufficient dwell + layout overlap + site overload) and assert consistent warnings in Plan, Compare, ranking, and 3D.

## Related implementation docs

- [Annual simulation model](../../tech/simulation.md)
- [Product design](../../design/product-design.md)
