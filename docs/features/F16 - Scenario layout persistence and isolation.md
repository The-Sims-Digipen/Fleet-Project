# F16 — Scenario layout persistence and isolation

**Owner:** Brandon  
**Active:** M4 W01-W04

## What this feature must accomplish

Two scenarios can carry different complex depot layouts through save/load and comparison without reference corruption or shared mutable data.

## Required behavior

- versioned storage/validation for boundaries, obstacles, bays, chargers, assignments, and geometry-related references;
- atomic save/reopen of layout changes with the rest of the scenario;
- scenario duplication with independent copied layouts and references;
- migration behavior for older stored project versions;
- rejection of structurally invalid payloads while allowing geometrically infeasible but editable layouts to be saved for later repair;
- save/reopen tests covering undo-history boundaries, deletion/restoration references, migration failures, and no cross-scenario mutation.

### Stored layout contract
Extend scenario serialization/validation for site boundary, obstacles, bays, charger instances/configuration, vehicle assignments, and stable object references. Preserve versioning/migration compatibility with older project documents.

### Atomic scenario behavior
Layout saves with the rest of the project snapshot; no second independent layout persistence path. Duplicate scenario deep-copies layout/assignments while keeping shared fleet references correct.

### Validation boundary
Reject malformed/structurally invalid payloads (non-finite values, impossible minimum counts, broken references). Allow structurally valid but geometrically infeasible layouts so users can repair them.

### Tests
Round-trip complex layouts, invalid-but-savable geometry, duplicate/edit isolation, migration from prior schema, deletion/restoration references, restart persistence, and no persisted undo history/transient scene state.

## Related implementation docs

- [Data model and API](../tech/contracts.md)
- [Depot editor](../tech/depot-editor.md)
- [Editing and history](../tech/editing-and-history.md)
