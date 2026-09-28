# M1 integration contract

This is the shared handoff for integrating the milestone-one features into one working application. Feature scope remains in `docs/features/`, and owners remain in `docs/weekly-plan.md`.

## Canonical code contract

The framework-independent aggregate is `apps/client/src/domain/project.ts`. A `ProjectDocument` owns the environment, vehicle presets, Scenarios, active Scenario, and shared analysis settings. Its `version` field is a serialization detail; consumers use unversioned Project names.

The contract fixes these decisions:

- Project-owned inputs: depot, authoritative vehicles and transforms, presets, analysis period, prices, emissions factors, and discount rate.
- Scenario-owned inputs: ordered per-vehicle preset transitions.
- Editor-only state: selection, selected year, camera, lighting, transform tools, drafts, and undo mechanics.
- Derived state: simulation, analytics, event lists, and render objects are recomputed and never authoritative persisted data.
- Transition semantics: the baseline preset applies before the first transition, then the latest transition at or before the selected year applies.
- Time semantics: `startYear` through `startYear + yearCount - 1`, inclusive.

## Validation and reference invariants

- IDs are stable and unique in their scope.
- Numeric domain values are finite and respect their documented ranges.
- Every vehicle baseline preset and Scenario target preset resolves inside the same Project.
- Every Scenario plan key resolves to a Project vehicle.
- Every vehicle owns a valid world transform, and a Project contains at most ten vehicles.
- Vehicle transition years are unique and ascending.
- Deleting a referenced preset is blocked.
- Deleting a vehicle removes all of its Scenario plan entries in the same command.
- Scenario duplication deep-copies plans. The last Scenario cannot be deleted.
- Invalid form drafts remain component-local and never replace the last valid domain value.
- Changing the analysis period clamps the editor's selected year.

`normalizeProject` enforces these invariants at creation, mutation, repository, and import boundaries.

## State and integration boundaries

`useProjectStore` is the application-facing module. It owns one `ProjectRuntime` containing:

- the canonical `ProjectDocument`;
- repository metadata and the saved dirty-state baseline;
- editor-only state;
- one undo/redo history for all Project edits.

Feature components must not mirror Project slices into another store. Continuous controls use `beginEdit`, preview commands, `commitEdit`, and `cancelEdit`. Discrete actions issue one Project command. Scene rendering uses `createProjectSceneObjects`; it does not persist a second scene document.

## Persistence boundary

`ProjectRepository` lists, loads, creates, and revision-checks complete Project records. IndexedDB and the future API adapter implement that interface. Portable export carries the complete Project document; import validates it and creates a fresh Project identity. Runtime editor state and calculated results never cross this boundary.

## Merge gate

At minimum, integration coverage proves:

- stable vehicle and preset references across save/reopen;
- Scenario duplication is a deep copy and edits remain isolated;
- before/at/after transition-year state agrees in timeline and 3D projections;
- vehicle deletion removes dependent plans atomically;
- referenced preset deletion is blocked;
- unsupported versions and stale revisions fail without losing working edits;
- empty and zero cases never emit `NaN` or `Infinity`.

Every pull request runs `pnpm verify`. A change to `ProjectDocument` must name and update all affected consumers.
