# F03 — Project and Scenario Controls

**Owner:** Brandon Koh Kai Yang

## Goal

Create the frontend UI for managing projects and multiple scenarios or transition plans inside each project.

## What this feature should accomplish

- Provide New Project, Open Project, and Save Project controls.
- Allow the project name to be displayed and edited.
- Show which project is currently open.
- Allow one project to contain multiple scenarios or transition plans.
- Provide UI to create and select scenarios.
- Make the active scenario clear.

The UI should leave room for scenario rename, duplicate, and delete actions later.

## Stub behavior

- Project and scenario actions may be non-functional.
- Use placeholder projects/scenarios where needed.
- Do not implement backend persistence as part of this frontend feature.

## Dependency

[F09 — Project Persistence](./F09%20-%20Project%20Persistence.md) should be implemented after this UI is established so the backend API matches the project/scenario workflow the frontend needs.

## Done when

The intended project and multi-scenario workflow is visible and understandable from the UI.
