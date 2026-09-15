# F09 — Project Persistence

## Goal

Persist projects, reusable 3D worlds, and world-bound scenarios locally in the browser for the prototype, without requiring a backend database or user account.

## Ownership model

- A **World** owns the persistent 3D depot document.
- A **Scenario** is stored separately and carries the `worldId` it belongs to.
- A **Project** references one world and links scenarios that use the same world.
- A project may reuse an existing saved world.
- A saved scenario may be linked to multiple local projects only when they use that scenario's world.
- The world is never embedded inside a scenario.

## Browser storage

Use IndexedDB database `fleet-transition-planner`, currently version 1, with object stores:

- `worlds`
- `projects`
- `scenarios` with a `worldId` index
- `projectScenarios` with project/world indexes and ordered project-to-scenario links

One **Save Project** action writes all dirty workspace resources in a single IndexedDB transaction. Project/world/scenario revisions detect stale writes from another browser tab.

The persistence implementation sits behind `ProjectRepository`; editor components do not call IndexedDB directly.

## Portable project files

**Export** downloads the live workspace as a versioned `.fleetproject` JSON file containing the project document, shared world, scenarios, and active scenario index. It may include unsaved edits.

**Import** validates the file and creates an independent saved local copy using fresh project/world/scenario IDs. This avoids ID collisions and makes exported files suitable for passing between teammates during the prototype phase.

## Limitations

IndexedDB is local to a browser profile and device. It does not synchronize between teammates. Cloud persistence is intentionally deferred; a future API repository can replace the IndexedDB adapter without changing the domain ownership model.

## Acceptance criteria

- Save/open works without Fastify, PostgreSQL, Neon, or environment variables.
- Projects, worlds, and scenarios remain separate persisted records.
- Only same-world scenarios can be selected/attached to a project.
- Reusing a saved world from a new project works.
- Removing a scenario from a project unlinks it instead of deleting the scenario record.
- A workspace save is atomic.
- Export produces a portable versioned project file.
- Import validates the file and creates an independent local copy.
