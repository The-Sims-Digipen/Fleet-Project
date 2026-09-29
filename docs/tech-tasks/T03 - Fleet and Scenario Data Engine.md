# T03 — Fleet & Scenario Data Engine

**Owner:** Tan Wei Jun  
**M1 contract:** Required  
**Supports:** F01, F02, F03, F04, F05, F07

## Shared integration contract

Follow and maintain the canonical types in the [M1 integration contract](../tech/m1-integration-contract.md). Project Presets, Vehicles, and Scenario transition plans are persisted together in `ProjectDocument`; T03's pure domain operations and selectors define their invariants, reference integrity, effective-year resolution, and transition-event inputs. `projectStore` remains the sole runtime owner.

## Goal

Provide the canonical domain operations and selectors for real fleet vehicles, preset references, and Scenario-specific transition plans, replacing mock fleet state and giving every consumer the same Project-owned data.

## Responsibilities

- Define the M1 domain contracts for Project Vehicles, Presets, and vehicle transition plans.
- Replace `MockVehicle` as the authoritative fleet source.
- Provide real fleet CRUD/domain operations and stable vehicle IDs.
- Validate vehicle -> preset and scenario -> vehicle/preset references.
- Keep transition year/target preset scenario-owned so editing one Scenario does not mutate another.
- Resolve the effective vehicle/preset state for a requested scenario and selected year.
- Provide deterministic snapshots/events consumed by T04, T05 and the 3D/product views.
- Expose Project-document operations and derived values to the Project store and consumers; do not create a separate authoritative store or persistence model.

## Boundaries

- T03 defines **fleet/Scenario domain rules and effective-state selectors over Project data**.
- `projectStore` owns **the open Project and its editor runtime state, including selected year**.
- `ProjectRepository` owns **complete Project persistence**; `appStore` owns cross-Project workspace preferences.

## M1 evidence

Create/edit a real fleet vehicle, assign different target presets/transition years in two Scenarios, switch Scenario/year, and prove the effective state changes correctly without mutating the base fleet or the other Scenario.
