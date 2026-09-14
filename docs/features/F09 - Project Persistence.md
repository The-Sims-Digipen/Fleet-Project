# F09 — Project Persistence

## Goal

Implement backend persistence for projects after the Project/Scenario Controls frontend stub is complete.

## What this feature should accomplish

- Add the PostgreSQL schema required to store projects.
- Add Drizzle schema definitions and database migrations.
- Implement the `/api/v1/projects` API.
- Support project CRUD operations:
  - Create.
  - List.
  - Read.
  - Update.
  - Delete.

## Dependency

Do this after [F03 — Project and Scenario Controls](./F03%20-%20Project%20and%20Scenario%20Controls.md) is established so the persisted shape and API support the actual frontend project/scenario workflow.

## Scope for now

- Focus on project persistence only.
- Authentication, accounts, permissions, collaboration, background jobs, and production hosting are not required.
- Keep the backend structure flexible enough for a project to contain multiple scenarios/transition plans.

## Done when

The database migrations run successfully and `/api/v1/projects` can create, list, read, update, and delete projects.
