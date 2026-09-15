# F03 — Project and Scenario Controls

## Goal

Manage a project's in-memory Worlds and the Scenarios that belong to each World without losing unsaved work when switching between them.

## UI

The header provides New Project, Open Project, Import, Export, and Save Project.

A single **World & Scenarios** collapsible owns both choosers:

- **Worlds** is a visible list, not a dropdown.
- New creates a fresh in-memory World with Plan A.
- Duplicate copies the active 3D World into a fresh World ID but does not copy its Scenarios.
- The active World can be renamed.
- Selecting another World switches the scene editor to that World's in-memory `SceneDocument`; it does not discard or persist anything.
- **Scenarios** lists only the Scenarios belonging to the selected World.
- New and Duplicate create in-memory Scenarios bound to the selected `worldId`.
- Rename edits the active Scenario in memory.
- Remove deletes the Scenario from the in-memory project immediately; the deletion reaches IndexedDB only on Save Project.
- Every World must retain at least one Scenario.

## Workspace semantics

Worlds and Scenarios are **working-memory state first**. Scene edits update the active World's in-memory document immediately. Switching Worlds stashes/restores those in-memory documents and their Scenario lists.

**Save Project** is the persistence boundary. It snapshots every in-memory World and every Scenario in the project and writes them atomically through F09.

[F09 — Project Persistence](./F09%20-%20Project%20Persistence.md) owns storage. F03 must not access IndexedDB directly.
