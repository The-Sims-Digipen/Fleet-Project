# F03 — Project and Scenario Controls

**Owner:** Brandon Koh Kai Yang

## Goal

Create the frontend UI for managing projects and choosing the reusable 3D world plus world-bound scenarios used by the current workspace.

## Current behavior

- The header provides New Project, Open Project, Import, Export, and Save Project controls.
- The project name is editable and save state is visible.
- A single **World & Scenarios** collapsible in the sidebar makes the dependency explicit:
  - choose the current 3D world first;
  - the scenario list shows only scenarios whose `worldId` matches that world;
  - scenarios already linked to the project are marked **Linked**;
  - other locally saved scenarios for the world are marked **Saved** and are attached when selected;
  - New Scenario automatically binds the scenario to the selected world.
- Duplicate and Remove operate on the active linked scenario. Remove only unlinks an already-saved scenario; it remains available under its world.
- Switching away from a saved project's world starts a new unsaved workspace instead of mutating the saved project's world reference. This protects its existing scenario links.

## Persistence dependency

[F09 — Project Persistence](./F09%20-%20Project%20Persistence.md) owns IndexedDB storage. F03 consumes the project/world/scenario repository through the project store and must not access IndexedDB directly.

## Done when

The UI makes the relationship `Project → World → world-compatible Scenarios` obvious, and selecting another world never exposes scenarios from an incompatible world.
