# F03 — Project & Scenario Management

**M1 priority:** MUST  
**Primary owner:** Brandon Koh Kai Yang

## Shared integration contract

Follow the [M1 integration contract](../tech/m1-integration-contract.md). F03 uses `projectStore` and aggregate `ProjectRepository` for one complete version 1 Project document; UI code must not access IndexedDB or implement migrations directly. `appStore` is limited to cross-Project interface preferences.

## User capability

Users can create, open, save and reopen Projects; create, rename, duplicate, remove and switch Scenarios; and retain the Project environment, fleet, presets, assumptions and Scenario data after reloading.

## User need

Users need a structured workspace for exploring transition plans without losing work or accidentally mixing state between scenarios.

## Workspace semantics

- A Project represents exactly one physical planning environment and owns its Scenarios.
- Project and Scenario editing is in-memory first.
- Switching Scenarios must not discard unsaved Project state.
- Save and reopen restores the active Scenario; if it no longer exists, the first ordered Scenario becomes active.
- Switching the active Scenario is an unsaved Project change because that selection is persisted.
- Duplicating a Scenario copies its planning inputs without sharing mutable scenario state.
- Every Project must retain at least one Scenario.
- New Projects automatically contain the default depot and ordered Vehicle spawn positions.
- Save Project is the persistence boundary and writes one complete Project aggregate through `ProjectRepository`.
- Scenario owns transition plans only; M1 has no Scenario-owned charging strategy, charger inventory, or parking assignment.

## M1 scope

- New/Open/Save Project.
- Create/switch/rename/duplicate/remove Scenarios.
- Maintain valid active Project/Scenario selections.
- Preserve dirty/unsaved state until Save Project.
- Reopen a saved project with its workspace relationships intact.

## Technical dependencies

- [T01 — Project Persistence & Serialization Library](../tech-tasks/T01%20-%20Project%20Persistence%20and%20Serialization%20Library.md)
- [T03 — Fleet & Scenario Data Engine](../tech-tasks/T03%20-%20Fleet%20and%20Scenario%20Data%20Engine.md)
- [T06 — Project & Scenario Workspace Orchestration System](../tech-tasks/T06%20-%20Project%20and%20Scenario%20Workspace%20Orchestration%20System.md)

F03 must not access IndexedDB directly; storage is owned by T01.

## M1 evidence

Create/switch/duplicate Scenarios over one Project fleet, make different transition edits, save the Project, reload/reopen it, and verify the one environment, active Scenario, and Scenario-specific state are restored from the aggregate.
