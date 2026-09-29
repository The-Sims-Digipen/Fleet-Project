# Project world source-of-truth acceptance report

**Run date:** 2026-09-29
**Contract:** Project document format version 1; IndexedDB internal revision 5

## Verified

- Project-store, repository, portable import/export, simulation, comparison, chart-series, timeline, Inspector, and typed world-projection tests pass. The multi-transition fixtures confirm that selected-year costs/emissions, graph series, timeline markers, Inspector effective state, and Depot/Vehicle projections follow the same ordered transition plans.
- Client typecheck passes; client tests pass: 19 files, 109 tests. Client production build passes.
- Server typecheck passes; server tests pass: 3 files, 17 tests. Server production TypeScript build passes.
- Shared UI typecheck and build pass; UI tests pass: 16 files, 86 tests. UI documentation typecheck and production build pass.
- Browser acceptance on the production build created a Vehicle, picked it from the Three.js viewport, and verified the selected Fleet row and visible selection outline. Production UI did not expose the development Inspector or gizmo controls.
- Browser acceptance on the development build verified typed Vehicle gizmo attachment, a transform drag, and one Undo restoring the drag's starting transform.
- Browser IndexedDB repository tests cover fresh initialization, unsupported prerelease data remaining untouched, aggregate save/load equality, import identity, unsupported formats, stale revisions, and write-failure recovery.

## Not verified in this environment

- Escape cancellation while the gizmo pointer is still held, and camera recovery immediately after that cancellation, were not verified in the browser. The available browser-control API sends a complete drag gesture and does not expose an interruptible held-pointer action. Project-store tests cover active-edit cancellation; they do not replace this browser check.
- The PostgreSQL migration and clean server database initialization were not run. `DATABASE_URL` is unset, `psql` is unavailable, and the Docker daemon is not running. The server repository contract tests use their test repository seam and are not evidence of a live PostgreSQL migration.

## Commands and totals

The installed local TypeScript, Vitest, and Vite entrypoints were invoked directly; the top-level `pnpm verify` command was not run.

| Workspace | Verification | Result |
|---|---|---|
| `apps/client` | `tsc -b --pretty false`; `vitest run`; `vite build` | Pass; 109 tests |
| `apps/server` | `tsc -p tsconfig.json --pretty false`; `vitest run`; `tsc -p tsconfig.build.json` | Pass; 17 tests |
| `packages/ui` | `tsc -b --pretty false`; `vitest run`; `tsc -b` | Pass; 86 tests |
| `apps/ui-docs` | `tsc -b --pretty false`; `vite build` | Pass |

The client build reported that its main minified chunk exceeds 500 kB; the build succeeded.
