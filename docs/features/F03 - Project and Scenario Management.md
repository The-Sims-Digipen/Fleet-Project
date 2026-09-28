# F03 — Project & Scenario Management

**M1 priority:** MUST  
**Primary owner:** Brandon Koh Kai Yang

## Shared integration contract

Follow the [M1 integration contract](../tech/m1-integration-contract.md). F03 uses T06 workspace actions and T01 repository operations for versioned `M1ProjectDocument`/`M1ScenarioDocument` data; UI code must not access IndexedDB or implement migrations directly.

## User capability

Users can create, open, save and reopen Projects; create, rename, duplicate, remove and switch Scenarios; and retain the Project environment, fleet, presets, assumptions and Scenario data after reloading.

## User need

Users need a structured workspace for exploring transition plans without losing work or accidentally mixing state between scenarios.

## Workspace semantics

- A Project represents exactly one physical planning environment and owns its Scenarios.
- Project and Scenario editing is in-memory first.
- Switching Scenarios must not discard unsaved Project state.
- Duplicating a Scenario copies its planning inputs without sharing mutable scenario state.
- Every Project must retain at least one Scenario.
- New Projects automatically contain the default depot and parking lots.
- Save Project is the persistence boundary and writes a consistent workspace snapshot through T01.

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

Create/switch/duplicate Scenarios over one Project fleet, make different transition edits, save the Project, reload/reopen it, and verify the one environment and Scenario-specific state are restored.
