# Project world source-of-truth acceptance report

**Run date:** 2026-09-30
**Contract:** Project document format version 1; IndexedDB internal revision 5

## Verified

- Project-store, repository, portable import/export, simulation, comparison, chart-series, timeline, Inspector, and typed world-projection tests pass. The multi-transition fixtures confirm that selected-year costs/emissions, graph series, timeline markers, Inspector effective state, and Depot/Vehicle projections follow the same ordered transition plans.
- Client typecheck passes; client tests pass: 20 files, 116 tests. Client production build passes.
- Server typecheck passes; server tests pass: 3 files and 17 tests. The PostgreSQL migration integration file and its 2 tests are present but skipped without `TEST_DATABASE_URL`. Server production TypeScript build passes.
- Shared UI typecheck and build pass; UI tests pass: 16 files, 86 tests. UI documentation typecheck and production build pass.
- Browser acceptance on the production build created a Vehicle, picked it from the Three.js viewport, and verified the selected Fleet row and visible selection outline. Production UI did not expose the development Inspector or gizmo controls.
- Browser acceptance on the development build verified typed Vehicle gizmo attachment, a transform drag, and one Undo restoring the drag's starting transform.
- Automated gizmo-controller regression coverage verifies that Escape restores the pre-drag transform, discards the active edit without adding an Undo entry, re-enables camera controls, and prevents the following pointer-up from committing the cancelled drag.
- Browser IndexedDB repository tests cover fresh initialization, unsupported prerelease data remaining untouched, aggregate save/load equality, import identity, unsupported formats, stale revisions, and write-failure recovery.
- PostgreSQL migration integration coverage applies the exact migration SQL to both a fresh schema and a schema containing the prerelease `projects` and `scenarios` tables, then verifies the aggregate `projects` table shape.

## Not verified in this environment

- Escape cancellation while the gizmo pointer is still held remains pending manual browser acceptance at the user's request. The automated controller regression covers the required state and history semantics, but it does not replace validation of native pointer capture, Three.js `TransformControls`, and camera interaction in a real held-pointer gesture.
- The PostgreSQL migration integration cases were not run against a live database. `TEST_DATABASE_URL` is unset, `psql` is unavailable, and the Docker daemon is not running. The server repository contract tests use their test repository seam and are not evidence of a live PostgreSQL migration.

## Commands and totals

The installed local TypeScript, Vitest, and Vite entrypoints were invoked directly; the top-level `pnpm verify` command was not run.

| Workspace | Verification | Result |
|---|---|---|
| `apps/client` | `tsc -b --pretty false`; `vitest run`; `vite build` | Pass; 116 tests |
| `apps/server` | `tsc -p tsconfig.json --pretty false`; `vitest run`; `tsc -p tsconfig.build.json` | Pass; 17 tests, 2 PostgreSQL integration tests skipped |
| `packages/ui` | `tsc -b --pretty false`; `vitest run`; `tsc -b` | Pass; 86 tests |
| `apps/ui-docs` | `tsc -b --pretty false`; `vite build` | Pass |

The client build reported that its main minified chunk exceeds 500 kB; the build succeeded.
