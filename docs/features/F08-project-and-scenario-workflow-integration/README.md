# F08 — Project and scenario workflow integration

**Owner:** Dayton  
**Active:** M2 W01–W04

## What this feature must accomplish

The user can manage real persisted projects/scenarios from the browser without losing edits or confusing one scenario's state with another.

## Required behavior

- new project and synthetic sample creation;
- saved project list/open/delete flow;
- scenario create/rename/duplicate/select/delete controls;
- dirty-state tracking, save-in-progress, server-acknowledged success, failed-save retry, and stale-revision recovery UI;
- protection against deleting the final scenario and accidental destructive actions;
- scenario switch/duplication behavior that preserves independent state;
- integration tests covering project/scenario actions and save/load recovery.

### Client project workflow
Implement Home and workspace-level project/scenario commands on top of F07 APIs and canonical state. New sample creates a new unsaved project. Opening replaces current workspace only after the requested project is successfully loaded/validated.

### Dirty/save state
Track document revision/snapshot identity, not merely “request pending”. A save acknowledgement clears only edits included in that snapshot. Failure or 409 retains local edits and gives retry/recovery UI.

### Scenario commands
Create/rename/duplicate/select/delete; final scenario cannot be deleted. Duplication deep-copies all scenario-owned input data. Destructive operations list impact where references are removed.

### Tests
Cover save while editing, failed save retry, stale conflict paths, unsaved navigation warning, scenario duplicate/edit isolation, delete-final rejection, and open/reopen behavior.

## Related implementation docs

- [Data model and API](../../tech/contracts.md)
- [Product design](../../design/product-design.md)
