# F07 — Project/scenario persistence backend

**Owner:** Brandon  
**Active:** M1 W01-M2 W04

## What this feature must accomplish

A complete project round-trips losslessly through the server and a failed or conflicting save cannot corrupt the last valid stored document.

## Required behavior

- versioned database schema/migrations and application startup initialization;
- create/list/read/update/delete project APIs with validated request/response bodies;
- atomic storage of the complete versioned project document so fleet/scenario/layout state cannot partially diverge;
- scenario duplication/deletion persistence behavior;
- revision-based stale-write protection for multiple tabs;
- payload/version validation, useful error responses, failed-write rollback, and restart persistence;
- API/integration tests covering empty database, create/save/reopen, duplicate/edit isolation, invalid data, stale revisions, and database failures.

### Server/storage implementation
Use Fastify + Zod + PostgreSQL/Drizzle. Provide the local JSON API under `/api/v1`:
- `GET /api/v1/projects`
- `POST /api/v1/projects`
- `GET /api/v1/projects/:id`
- `PUT /api/v1/projects/:id`
- `DELETE /api/v1/projects/:id`
- `GET /api/v1/ready`

Validate requests/responses at the boundary and follow the project-document contract in `docs/tech/contracts.md`. Store each complete validated project as one versioned document/record with server revision metadata so project subtrees cannot be partially committed. Errors expose stable codes/readable messages rather than database internals.

### Concurrency/integrity
`PUT` and `DELETE` require expected revision. Update is transactional/atomic and returns 409 on stale revision. Validation/version/size checks happen before committing. Database failures roll back cleanly.

### Persistence tests
Cover first-run/empty DB, create/list/read/update/delete, save/reopen equivalence, duplicate-scenario isolation, invalid/unsupported document, 10 MiB limit, stale revision, DB failure rollback, and server restart persistence.

## Related implementation docs

- [Data model and API](../../tech/contracts.md)
- [Product design](../../design/product-design.md)
