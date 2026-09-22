# M1 integration contract

This is the shared handoff for replacing the completed UI stubs with one working M1 application. It does not create another task catalogue: feature scope remains in `docs/features/`, and owners remain in `docs/weekly-plan.md`.

All implementation branches should start from a commit containing this contract with `pnpm verify` passing. Old UI-stub branches are reference history, not integration bases.

## Canonical code contract

The importable, framework-independent contract is `apps/client/src/domain/contracts.ts`. The shared SIM01 fixture is `apps/client/src/domain/m1Fixture.ts`.

The contract fixes these decisions:

- Project-owned inputs: vehicle presets, analysis period, currency, common fuel price, and common emissions factors. A vehicle preset is a reusable type shared by every World in the project.
- World-owned inputs: serializable 3D objects and transforms, **and the fleet**. A vehicle is an object placed in one depot, carrying its planning data in `SceneObject.vehicle`, so the fleet shown in Fleet Management is exactly what stands in the World being edited. Placing a preset instantiates a vehicle; deleting the object removes it. Vehicles placed in one World never appear in another.
- Scenario-owned inputs: per-vehicle target preset/transition year and scenario electricity/charging assumptions.
- Editor-only state: selection, camera, transform tool, drafts and undo mechanics.
- Derived state: simulation, analytics and effective-year projections are recomputed and are never authoritative persisted data.
- Transition semantics: current preset before the transition year and target preset from the transition year onward.
- Time semantics: `startYear` through `startYear + yearCount - 1`, inclusive, with T04 owning the selected year.

### Validation and reference invariants

- IDs are stable and immutable after creation; project preset IDs are unique, and fleet vehicle IDs are unique within their World.
- Every numeric domain value is finite. Distances, prices, costs and emissions factors are nonnegative; `yearCount` is a positive integer; utilisation and charging share are within 0–1; charging efficiency is greater than 0 and at most 1.
- Every fleet `currentPresetId` and scenario `targetPresetId` resolves inside the same project. Every `vehiclePlans` key resolves to a vehicle in the World that scenario is bound to.
- A transition year is null/absent or inside the project's inclusive analysis period.
- Deleting a referenced preset is blocked and the UI lists the fleet/scenario references that must first be reassigned or cleared.
- Deleting a fleet vehicle requires confirmation that lists affected scenario plans, then removes the placed object and all of those plan entries as one domain edit. Because a vehicle is a scene object, placing and deleting one are undoable scene edits.
- Scenario duplication deep-copies plans and assumptions. The last scenario for a World cannot be deleted.
- Invalid form drafts remain component-local and never replace the last valid domain value.
- When the analysis period changes, T04 clamps the selected year to the new period and stops playback. Scenario switching retains the selected year because the period is project-owned.

Legacy project document versions 2 and 3, scenario document version 1 and world document version 3 remain readable. The authoritative M1 shapes are project version 4, scenario version 2 and world version 4. Project version 3 stored the fleet on the project; reopening one moves those vehicles into the World that was active, preserving their IDs so scenario plans keep resolving. T01 owns format migration and rejection of unsupported versions; feature components must not implement migrations.

## Ownership and shared-file boundaries

| Area | Owner | Contract boundary | Shared files controlled during integration |
|---|---|---|---|
| T01 persistence | Chew Shee Yang | Save/load/export/import authoritative documents; never persist results | `project/repository.ts`, `project/indexedDbRepository.ts`, `project/portableProject.ts` |
| T02 design system | Dayton Ng Zhi Jie | Presentation primitives only; no product state | `components/controls.tsx`, global tokens in `index.css` |
| T03 domain | Tan Wei Jun | Fleet/preset CRUD, reference integrity, effective-year state | `domain/contracts.ts`, `domain/worldFleet.ts`, the fleet/scenario domain store and selectors |
| T04 timeline | Jarrel Tay Wee Han | Selected year, seek/play/pause/reset, transition-event projection | `state/timelineStore.ts`, `components/TimelineControl.tsx` |
| T05 simulation | Elijah Chua Jye Kang | Pure `SimulationInput -> SimulationResult`; no React/storage/chart imports | the new simulation engine directory |
| T06 workspace | Brandon Koh Kai Yang | Active project/world/scenario, dirty state and valid snapshots | `state/projectStore.ts`, workspace panels |
| T07 analytics | Yap Zhi Kai | Transform `SimulationResult` into KPI/chart view models; no recalculation | the new analytics directory and `components/CostAnalysis.tsx` |
| F05/assembly | Chew Shee Yang | Read T03 + T04 state into 3D; final top-level composition | `App.tsx`, `components/Sidebar.tsx`, 3D integration adapters |

The listed owner coordinates changes to a controlled shared file. Feature owners should keep feature behavior inside isolated modules and request a small composition change instead of independently restructuring `App.tsx`, `Sidebar.tsx`, `projectStore.ts` or `index.css`.

## Required integration sequence

1. **Contract and workspace foundation:** T03 and T06 implement the versioned domain/workspace shape; T01 adds migration and round-trip coverage.
2. **Real fleet persistence:** replace `MockVehicle`, persist project fleet/settings, and prove save/reopen with stable references.
3. **Pure calculation:** T05 implements `annual-v1` using the shared fixture and documented worked examples.
4. **Product inputs:** F01-F04 bind existing forms to the authoritative project/scenario actions. Local component state is limited to uncommitted drafts.
5. **Results:** T07/F06 consume `SimulationResult`; charts never derive independent financial truth.
6. **Shared time:** T04/F07 use the project analysis period and expose the single selected year and real transition events.
7. **3D:** F05 queries T03 for effective state using T04's selected year. It must not reimplement the transition rule.
8. **End-to-end gate:** exercise create/open -> preset/fleet edit -> scenario transition -> simulation -> analytics -> selected-year 3D -> save/reopen.

T02 may progress in parallel when changes remain inside reusable primitives. F08 may remain an explicitly labelled indicative/mock panel during M1; it must not present mock values as calculated output.

## Known stub truth to remove

- ~~`state/fleetStore.ts`: `MockVehicle` and `initialVehicles`~~ — removed; the fleet is derived from the active World.
- `project/analysisPeriod.ts` and `state/timelineStore.ts`: fixed analysis years.
- `components/TimelineControl.tsx`: sample charger events and component-owned playback state.
- `components/SimulationSettings.tsx`: local authoritative assumptions and local calculator.
- `components/CostAnalysis.tsx`: hard-coded cost arrays and payback.
- `components/CompareWorkspace.tsx`: demo plans and its independent selected year.

Do not replace these with another temporary authoritative store. During migration, an adapter may read legacy stub data, but new domain writes must go through T03/T06.

## Shared acceptance fixture and merge gate

All systems reuse SIM01 from `domain/m1Fixture.ts`; T05 supplements it with SIM02-SIM05 from `docs/tech/simulation.md`. At minimum, integration coverage proves:

- stable vehicle/preset references across save/reopen;
- scenario duplication is a deep copy and edits remain isolated;
- before/at/after transition-year state agrees in fleet, timeline and 3D;
- payback reached and not-reached are represented without invented values;
- unsupported versions and stale revisions fail without losing working edits;
- empty and zero cases never emit `NaN` or `Infinity`.

Every pull request runs `pnpm verify`. A change to the canonical contract must name all affected consumers and include their owner reviews before dependent branches update.
