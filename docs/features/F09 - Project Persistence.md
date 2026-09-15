# F09 — Project Persistence

**Owner:** Tan Wei Jun

## Goal

Persist projects, reusable 3D worlds, and world-bound scenarios in PostgreSQL while keeping one Save Project workflow.

## Persisted resources

- `worlds`: reusable 3D world documents and their revisions.
- `projects`: project-level inputs (currently vehicle presets) plus a `world_id`.
- `scenarios`: independent scenario documents, each permanently bound to one `world_id`.
- `project_scenarios`: links scenarios to projects and stores project ordering.

A project may reuse an existing world. A saved scenario may be linked to multiple projects only when all of them use that scenario's world. PostgreSQL composite foreign keys enforce this invariant in addition to API validation.

## User workflow

- **Save Project** atomically saves the project, current world, and linked scenarios.
- **New Project** can create a fresh world or reuse a saved world.
- **Add Existing Scenario** lists only scenarios whose `world_id` matches the open project.
- Removing a scenario from a project unlinks it; it does not delete the independently saved scenario record.
- Switching scenarios never swaps or duplicates the 3D world.

## API

- `GET /api/v1/projects`
- `GET /api/v1/projects/:id/workspace`
- `POST /api/v1/workspaces`
- `PUT /api/v1/projects/:id/workspace`
- `GET /api/v1/worlds`
- `GET /api/v1/worlds/:id`
- `GET /api/v1/worlds/:id/scenarios`
- `GET /api/v1/ready`

Workspace saves use PostgreSQL transactions and optimistic revision checks. A failed save rolls back the whole workspace write and leaves local edits intact.

## Deployment

Production uses Vercel + Neon. The Neon Marketplace integration provides the pooled `DATABASE_URL`. `pnpm vercel-build` applies committed PostgreSQL migrations automatically for Production before building the client/server. Preview migrations are disabled unless `RUN_MIGRATIONS=1` is explicitly enabled for an isolated preview database.

## Done when

- A new Neon database can be provisioned and initialized from a Vercel production deployment.
- Projects can create/open/update persistent workspaces.
- Worlds can be reused by multiple projects.
- Scenarios remain separate records but cannot be linked across different worlds.
- One workspace save is atomic and revision checked.
