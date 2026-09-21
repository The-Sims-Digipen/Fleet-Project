# F03 — Project & Scenario Management

**M1 priority:** MUST  
**Primary owner:** Brandon Koh Kai Yang

## User capability

Users can create, open, save and reopen projects; manage reusable Worlds; create, rename, duplicate, remove and switch Scenarios; and retain project/scenario data after reloading the application.

## User need

Users need a structured workspace for exploring transition plans without losing work or accidentally mixing state between scenarios.

## Workspace semantics

- A Project contains one or more reusable Worlds and the Scenarios linked to those Worlds.
- World and Scenario editing is in-memory first.
- Switching Worlds or Scenarios must not discard unsaved workspace state.
- Duplicating a Scenario copies its planning inputs without sharing mutable scenario state.
- Every World must retain at least one Scenario.
- Removing a World removes its linked Scenarios from the in-memory project workspace and is persisted only on Save Project.
- Save Project is the persistence boundary and writes a consistent workspace snapshot through T01.

## M1 scope

- New/Open/Save Project.
- Create/switch/rename/duplicate/remove World and Scenario where supported by the current workspace design.
- Maintain valid active Project/World/Scenario selections.
- Preserve dirty/unsaved state until Save Project.
- Reopen a saved project with its workspace relationships intact.

## Technical dependencies

- [T01 — Project Persistence & Serialization Library](../tech-tasks/T01%20-%20Project%20Persistence%20and%20Serialization%20Library.md)
- [T03 — Fleet & Scenario Data Engine](../tech-tasks/T03%20-%20Fleet%20and%20Scenario%20Data%20Engine.md)
- [T06 — Project & Scenario Workspace Orchestration System](../tech-tasks/T06%20-%20Project%20and%20Scenario%20Workspace%20Orchestration%20System.md)

F03 must not access IndexedDB directly; storage is owned by T01.

## M1 evidence

Create/switch/duplicate scenarios, make different transition edits, save the project, reload/reopen it, and verify the same valid workspace and scenario-specific state is restored.
