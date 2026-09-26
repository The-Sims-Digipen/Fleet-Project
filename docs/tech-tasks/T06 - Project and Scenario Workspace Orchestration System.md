# T06 — Project & Scenario Workspace Orchestration System

**Owner:** Brandon Koh Kai Yang  
**M1 contract:** Required  
**Supports:** F03, F04

## Shared integration contract

Follow the [M1 integration contract](../tech/m1-integration-contract.md). T06 owns the in-memory lifecycle of versioned project/scenario documents, active selections, dirty state and complete workspace snapshots; T01 remains the only storage boundary and T03 remains the domain-operation owner.

## Goal

Manage the in-memory lifecycle and invariants of Projects, Worlds and Scenarios, including active selections, switching, duplication/removal, dirty state and the workspace snapshots passed to persistence.

## Responsibilities

- Create/open an in-memory Project workspace from repository data.
- Maintain active Project/World/Scenario selections.
- Create, rename, duplicate, switch and remove Worlds/Scenarios according to product invariants.
- Ensure every World retains at least one Scenario.
- Preserve unsaved changes while switching within the workspace.
- Keep Scenario duplication independent rather than sharing mutable planning state.
- Track dirty/unsaved state and construct a complete valid workspace snapshot for T01.
- Restore valid active selections after remove/load operations.

## Boundaries

- T06 owns **workspace lifecycle and invariants**.
- T03 owns **fleet/transition domain data inside scenarios**.
- T01 owns **storage, transactions and serialization**.

## M1 evidence

Create/switch/duplicate/remove workspace entities, make different unsaved edits in Scenarios, save through T01, reload/reopen, and verify the same valid workspace and active relationships are restored.
