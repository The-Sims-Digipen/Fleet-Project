# Project world source-of-truth acceptance report

**Run date:** 2026-09-30
**Contract:** Project document format version 1; IndexedDB internal revision 5

This historical report records the run on 2026-09-30. It does not report a current verification run.

## Verified

- Project-store, repository, portable import/export, simulation, comparison, chart-series, timeline, Inspector, and typed world-projection tests passed. Multi-transition fixtures confirmed consistent ordered transitions across selected-year costs/emissions, graph series, timeline markers, Inspector state, and Depot/Vehicle projections.
- Client typecheck passed. Client tests passed: 20 files, 116 tests. Client production build passed.
- Server typecheck passed. Server tests passed: 3 files and 17 tests. The PostgreSQL migration integration file contained 2 tests. These tests were skipped without `TEST_DATABASE_URL`. Server production TypeScript build passed.
- Shared UI typecheck and build passed. UI tests passed: 16 files, 86 tests. UI documentation typecheck and production build passed.
- Production browser acceptance created a Vehicle and selected it from the Three.js viewport. The selected Fleet row and visible selection outline matched. Production UI did not expose the development Inspector or gizmo controls.
- Development browser acceptance verified typed Vehicle gizmo attachment and a transform drag. One Undo restored the initial transform of that drag.
- Automated gizmo-controller regression tests verify Escape cancellation. Escape restores the initial transform and discards the active edit without an Undo entry. It enables camera controls again. The next pointer-up cannot commit the cancelled drag.
- Browser IndexedDB repository tests cover fresh initialization, untouched unsupported prerelease data, aggregate save/load equality, import identity, unsupported formats, stale revisions, and write-failure recovery.
- PostgreSQL migration integration tests apply the exact migration SQL to a fresh schema and a schema with prerelease `projects` and `scenarios` tables. They then verify the aggregate `projects` table structure. The live database cases remain unverified as stated below.

## Not verified in this environment

- Manual browser acceptance for Escape cancellation while the user holds the gizmo pointer remains pending at the user's request. Automated controller tests cover the required state and history behavior. They do not validate native pointer capture, Three.js `TransformControls`, or camera interaction during a held-pointer gesture.
- The PostgreSQL migration integration cases did not run against a live database. `TEST_DATABASE_URL` is unset. `psql` is unavailable. The Docker daemon does not run. Server repository contract tests use a test repository interface. They do not prove a live PostgreSQL migration.

## Commands and totals

Verification used the installed local TypeScript, Vitest, and Vite entrypoints directly. It did not run the root `pnpm verify` command.

| Workspace | Verification | Result |
|---|---|---|
| `apps/client` | `tsc -b --pretty false`; `vitest run`; `vite build` | Pass; 116 tests |
| `apps/server` | `tsc -p tsconfig.json --pretty false`; `vitest run`; `tsc -p tsconfig.build.json` | Pass; 17 tests, 2 PostgreSQL integration tests skipped |
| `packages/ui` | `tsc -b --pretty false`; `vitest run`; `tsc -b` | Pass; 86 tests |
| `apps/ui-docs` | `tsc -b --pretty false`; `vite build` | Pass |

The client build reported a main minified chunk above 500 kB. The build succeeded.
