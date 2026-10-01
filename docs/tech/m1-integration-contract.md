# M1 integration contract

This contract defines the shared interfaces for M1 feature integration. Feature scope remains in `docs/features/`. Owners remain in `docs/weekly-plan.md`.

## Canonical code contract

The aggregate in `apps/client/src/domain/project.ts` does not depend on a framework. Its version 1 `ProjectDocument` owns one environment, Vehicle Presets, Scenarios, active Scenario identity, and shared Analysis Settings. Code uses unversioned Project and domain names. The format field identifies the serialized contract. Normalizers reject unsupported formats.

The contract defines these boundaries:

- Project inputs include the Depot, authoritative Vehicles and transforms, Presets, analysis period, prices, emissions factors, and discount rate.
- Scenario inputs contain ordered Vehicle transition plans only. M1 does not persist charging strategy, Depot charging share, infrastructure, or feasibility assumptions per Scenario.
- Project editor state contains selection, independent Plan and Compare timelines, Compare Scenario A/B choices, camera, lighting, transform tools, drafts, and undo state.
- Application state contains workspace mode, Project catalogue/list status, global Project dialogs, and sidebar expansion. This state remains in `appStore` across Project changes.
- Save status belongs to the open Project runtime.
- Simulation, analytics, event lists, and render objects are derived. They are recalculated and never authoritative persisted data.
- The baseline Preset applies before the first transition. The latest transition at or before the selected year then applies.
- The analysis period includes `startYear` through `startYear + yearCount - 1`.

An Effective Vehicle interprets the Vehicle baseline and one Scenario's transitions at a selected year. This interpretation is derived and read-only. Timeline, simulation, graphs, Inspector state, comparison metrics, and `createProjectWorld` must use the same interpretation across all ordered transitions.

## Validation and reference invariants

- IDs are stable and unique in their scope.
- Numeric domain values are finite and within their documented ranges.
- Every Vehicle baseline Preset and Scenario target Preset references a Preset inside the same Project.
- Every Scenario plan key references a Project Vehicle.
- Every Vehicle owns a valid world transform. A Project contains at most ten Vehicles.
- Vehicle transition years are unique and in ascending order.
- The system blocks deletion of a referenced Preset.
- A Vehicle deletion command removes all Scenario plan entries for that Vehicle in the same command.
- Scenario duplication makes an independent copy of plans. The system blocks deletion of the last Scenario.
- Invalid form drafts stay in the component. They never replace the last valid domain value.
- An analysis-period change clamps the selected year in both workspaces.
- A workspace exit pauses its playback. It preserves the selected year and Scenario choices.

`normalizeProject` enforces these invariants at creation, mutation, repository, and import boundaries.

## State and integration boundaries

`useProjectStore` is the application interface. It owns one `ProjectRuntime` with these fields:

- The canonical `ProjectDocument`.
- Repository metadata and the saved baseline for dirty-state checks.
- Editor state.
- One undo/redo history for all Project edits.

Feature components must not copy Project data into another authoritative store. Continuous controls use `beginEdit`, preview commands, `commitEdit`, and `cancelEdit`. Discrete actions issue one Project command.

Viewport views, object selection, and Inspector routes use `createProjectWorld` and typed Depot/Vehicle references. They do not persist a second scene document. Vehicle creation copies a default spawn transform from the ordered list. This construction list is fixed in code. Vehicles do not store a parking-slot identity.

## Persistence boundary

`ProjectRepository` lists, loads, creates, and updates complete Project records with revision checks. IndexedDB and the existing API adapter implement this interface. The default browser repository uses IndexedDB. It does not use the API adapter.

Portable export contains the complete Project document. Import validates this document and creates a fresh Project ID. Nested entity IDs and the active Scenario identity remain unchanged within the new Project. Runtime editor state and calculated results never cross the persistence boundary.

## Merge gate

Integration tests must prove these behaviors:

- Vehicle and Preset references remain stable across save/reopen.
- Scenario duplication makes an independent copy. Changes to the copy do not change the original.
- Timeline and 3D projections agree before, at, and after each transition year.
- Vehicle deletion removes dependent plans atomically.
- The system blocks deletion of referenced Presets.
- Unsupported versions and stale revisions fail without loss of current edits.
- Empty and zero cases never produce `NaN` or `Infinity`.

Every pull request runs `pnpm verify`. Identify all affected consumers for a `ProjectDocument` change. Update each affected consumer.
