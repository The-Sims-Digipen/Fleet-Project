# F19 — Backend reliability, migrations, and platform hardening

**Owner:** Brandon  
**Active:** M5 W02–M6 W02

## What this feature must accomplish

The local backend starts reliably from a clean environment, upgrades existing data safely, and survives expected error/failure cases without project corruption.

## Required behavior

- new-database and upgraded-database migration paths;
- startup/readiness and connection failure behavior;
- payload size/version/revision failure coverage;
- transaction/rollback verification and restart persistence;
- repeated project save/load/delete stress cases;
- clean-clone server setup/build/test on the required backend platform;
- fixes for persistence defects found by full-system regression tests.

### Database lifecycle
Make new database setup and schema upgrades reproducible through Drizzle migrations. Startup/readiness must distinguish server process availability from database readiness.

### Failure behavior
Test/handle invalid version, oversize payload, stale revision, database disconnect/transaction failure, restart persistence, and repeated CRUD operations. Partial writes are forbidden.

### Platform
Verify clean-clone server install/configuration/build/test and migrations on required backend platform (at minimum Ubuntu 24.04), plus documented supported local environments. Credentials stay in environment configuration and never enter logs/errors.

### Regression responsibility
Persistence defects found by full-system regression are fixed at the backend/storage boundary rather than patched in UI consumers.

## Related implementation docs

- [Data model and API](../../tech/contracts.md)
- [Product design](../../design/product-design.md)
