# F02 — Fleet Management

**M1 priority:** MUST  
**Primary owner:** Jarrel Tay Wee Han

## Shared integration contract

Follow the [M1 integration contract](../tech/m1-integration-contract.md). F02 reads Project-owned Vehicle baselines and edits them through Project commands. Ordered transition years and target Presets belong to the Scenario's Vehicle Plan and must not be written into the shared Vehicle baseline.

## User capability

Users can view the Project's authoritative fleet and add or edit generic Vehicle instances, their optional baseline Preset, world transform, annual distance, and other M1 planning attributes.

## User need

The transition model must use fleet data that represents the vehicles being planned rather than hard-coded mock rows.

## M1 scope

- Display the real project fleet.
- Add a generic fleet Vehicle at the first available default spawn transform.
- Edit the fields required by transition planning and M1 calculations.
- Delete a vehicle with defined handling for scenario references.
- Assign or change an optional vehicle preset without changing vehicle identity.
- Preserve stable vehicle IDs across edits, scenarios and persistence.
- Enforce unique default spawn positions and the current ten-Vehicle depot capacity.
- Derive rendered Vehicles from the Project fleet instead of persisting scene objects or parking assignments.

Filtering, sorting and bulk planning may be expanded after the minimum real CRUD/data flow is stable.

## M1 evidence

Create a generic Vehicle, verify it receives an unused spawn transform and renders in 3D, assign/change its preset without changing its ID, use the Vehicle in a Scenario transition, save/reopen the Project, then delete it and verify every Scenario plan keyed by its ID is removed.
