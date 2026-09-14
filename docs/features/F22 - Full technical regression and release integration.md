# F22 — Full technical regression and release integration

**Active:** M6 W01-W04

## What this feature must accomplish

The integrated release can be reproduced from a clean clone and all critical technical acceptance checks pass on the final code rather than isolated prototypes.

## Required behavior

- automated regression of project/scenario persistence, vehicle/preset transitions, simulation, charging, suitability, depot geometry/history, 3D interaction, comparison, and responsive UI;
- the five required end-to-end scenarios plus geometry, failure-recovery, and edge-value cases;
- clean clone/install/typecheck/test/build on required development platforms;
- production build/runtime smoke test with database initialization and restart persistence;
- verification that no old hard-coded ICE→EV assumptions remain in the generic transition path;
- final performance measurements using the standard reference workload;
- release build/tag only after affected regression suites pass.

### Release regression scope
Run integrated checks for project/scenario persistence, generic preset transitions, annual simulation, charging/feasibility, suitability, depot geometry/history/assignments, 3D interaction, comparison, responsive/error recovery, migrations, and performance.

### Required end-to-end cases
Use the five product acceptance scenarios plus invalid geometry, backend/save failure, stale revision, zero/empty values, duplicate scenario isolation, and clean restart. Verify no residual hard-coded ICE->EV-only assumptions in the transition path.

### Reproducibility
From a clean clone: install locked dependencies, initialize/migrate DB, typecheck, run unit/integration/browser checks, build production client/server, start production server, and smoke-test persisted reopen.

### Release gate
Only tag/accept the engineering release after the affected regression suites pass on the final integrated code and final performance measurements are recorded.

## Related implementation docs

- [Data model and API](../tech/contracts.md)
- [Product design](../design/product-design.md)
