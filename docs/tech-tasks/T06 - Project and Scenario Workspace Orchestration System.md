# T06 — Project & Scenario Workspace Orchestration System

**Owner:** Brandon Koh Kai Yang  
**M1 contract:** Required  
**Supports:** F03, F04

## Shared integration contract

Follow the [M1 integration contract](../tech/m1-integration-contract.md). `projectStore` owns the in-memory lifecycle of the open Project, its active Scenario, editor state, dirty state, and history. `ProjectRepository` stores complete Project aggregates; no separate Scenario documents or workspace snapshots are authoritative.

## Goal

Provide Project-store commands for the lifecycle and invariants of Projects and Scenarios, including active Scenario selection, duplication/removal, dirty state, and complete aggregate persistence.

## Responsibilities

- Create/open an in-memory Project through `projectStore` and the repository contract.
- Maintain the active Scenario inside the Project document and Project runtime.
- Create, rename, duplicate, switch and remove Scenarios according to product invariants.
- Ensure every Project retains at least one Scenario and one physical environment.
- Preserve unsaved changes while switching within the workspace.
- Keep Scenario duplication independent rather than sharing mutable planning state.
- Track dirty/unsaved state in Project runtime and persist the complete Project document through `ProjectRepository`.
- Restore valid active selections after remove/load operations.

## Boundaries

- `projectStore` owns **the open Project, Project-scoped runtime state, and undo history**.
- Project commands and domain selectors own **Project and Scenario invariants and derived state**.
- `ProjectRepository` owns **complete aggregate storage, revisions, and serialization**; `appStore` owns cross-Project workspace preferences.

## M1 evidence

Create/switch/duplicate/remove workspace entities, make different unsaved edits in Scenarios, save through T01, reload/reopen, and verify the same valid workspace and active relationships are restored.
