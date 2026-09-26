# T03 — Fleet & Scenario Data Engine

**Owner:** Tan Wei Jun  
**M1 contract:** Required  
**Supports:** F01, F02, F03, F04, F05, F07

## Shared integration contract

Follow and maintain the canonical types in the [M1 integration contract](../tech/m1-integration-contract.md) and `apps/client/src/domain/contracts.ts`. T03 owns `M1VehiclePreset`, `FleetVehicle`, `ScenarioVehiclePlan`, reference-integrity operations, effective-year resolution and transition-event projection inputs.

## Goal

Provide the canonical domain/state engine for real fleet vehicles, preset references and scenario-specific transition plans, replacing mock fleet state and giving every consumer the same authoritative scenario data.

## Responsibilities

- Define/own the M1 domain contracts for `FleetVehicle`, preset references and vehicle transition plans.
- Replace `MockVehicle` as the authoritative fleet source.
- Provide real fleet CRUD/domain operations and stable vehicle IDs.
- Validate vehicle -> preset and scenario -> vehicle/preset references.
- Keep transition year/target preset scenario-owned so editing one Scenario does not mutate another.
- Resolve the effective vehicle/preset state for a requested scenario and selected year.
- Provide deterministic snapshots/events consumed by T04, T05 and the 3D/product views.
- Expose serializable authoritative inputs to T01/T06; do not own browser persistence itself.

## Boundaries

- T03 answers **what fleet/scenario data exists and what a vehicle's effective state is**.
- T04 answers **what year/time is selected**.
- T06 answers **which Project/World/Scenario workspace is active and how it is managed**.

## M1 evidence

Create/edit a real fleet vehicle, assign different target presets/transition years in two Scenarios, switch Scenario/year, and prove the effective state changes correctly without mutating the base fleet or the other Scenario.
