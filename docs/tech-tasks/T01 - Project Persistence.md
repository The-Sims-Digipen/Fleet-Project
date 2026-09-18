# T01 — Project Persistence

## Goal

Persist the complete prototype workspace locally in the browser without requiring PostgreSQL, Neon, accounts, or manual database setup.

## Domain ownership

- A **Project** can contain multiple reusable 3D Worlds.
- Each **World** has its own persistent `SceneDocument` and stable `worldId`.
- Each **Scenario** is stored separately and is permanently bound to exactly one `worldId`.
- A Scenario never contains the World document.
- The Project records which Worlds and Scenarios belong to it; the Project record also remembers which World was active on the last save.

## In-memory first

Creating, duplicating, renaming, switching, or editing Worlds and Scenarios changes only the in-memory project workspace.

Nothing is written to IndexedDB until **Save Project**.

Save Project captures all in-memory Worlds and all Scenarios in one consistent snapshot. Failed saves leave the in-memory workspace untouched.

## IndexedDB

Database: `fleet-transition-planner`, version 2.

Object stores:

- `projects`
- `worlds`
- `scenarios` with `worldId` index
- `projectWorlds` with ordered Project → World links
- `projectScenarios` with ordered Project → Scenario links and `worldId`

One Save Project operation uses a single read/write transaction across all stores. Project, World, and Scenario revisions detect stale writes from another browser tab.

Removing a Scenario removes its Project link on the next Save Project. Its backing Scenario record is deleted when no other Project links it.

## Export/import

Export captures the entire live workspace, including all Worlds, their Scenarios, and unsaved edits, in a versioned `.fleetproject` file.

Import validates the file, assigns fresh Project/World/Scenario IDs, and saves the imported copy locally. Version 1 single-World exports remain importable; new exports use version 2.

## Limitations

IndexedDB is local to one browser profile and origin. Teammates do not automatically share projects. Use Export/Import for the prototype. A future PostgreSQL repository can implement the same workspace contract later.
