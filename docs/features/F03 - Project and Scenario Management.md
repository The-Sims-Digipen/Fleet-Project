# F03 — Project & Scenario Management

**M1 priority:** MUST  
**Primary owner:** Brandon Koh Kai Yang

## Current Project controls

| Control | Behavior |
|---|---|
| New | Create an unsaved Project |
| Open | Select a Project saved in the current browser |
| Import | Validate a portable file and save an independent local Project |
| Export | Download the complete Project, including unsaved edits |
| Save | Save one complete Project to IndexedDB |
| Project name | Rename the current Project |

New Projects contain the default Depot, an empty fleet, five synthetic Presets and Plan A.
The default period is 2026–2035 inclusive, with SGD as the currency.
New Vehicles receive transforms from predefined positions.
The Project does not store that position list.

## Scenario controls

Users can create, select, rename, duplicate and remove Scenarios.
Each Project owns one physical environment.
Its Scenarios own independent Vehicle Plans over the shared fleet.

Scenario duplication copies Vehicle Plans without shared mutable state.
A Scenario switch preserves unsaved Project edits.
The active Scenario is persisted and contributes to dirty state.
The last Scenario cannot be removed.

Removal of the active Scenario selects the remaining Scenario at the same list index.
If that index is unavailable, it selects the last Scenario.
The normalizer rejects an invalid `activeScenarioId`.

## Save and error behavior

Save writes the environment, Presets, assumptions, active Scenario and all Vehicle Plans together.
Reopen restores these relationships.
A successful save records the saved document as the dirty-state baseline.
Edits made during a save remain unsaved.
A failed save preserves the working document.
The interface provides Retry Save.
Revision checks reject stale writes.

New and Open dialogs warn before they replace unsaved edits.
Import requires confirmation when the current Project has unsaved edits.
Browser close uses the native unsaved-change warning.

## Integration

The feature follows the [M1 integration contract](../tech/m1-integration-contract.md).
`projectStore` owns the editable Project runtime.
`ProjectRepository` handles complete-Project persistence.
UI code uses the repository boundary.

`appStore` owns the derived Project catalogue, repository status, Project dialogs, workspace mode and sidebar preferences.
It does not contain another editable Project document.

Camera state, selection, timeline playback, undo history and calculated results are not persisted.

## Demonstration

1. Create a Project.
2. Add a Vehicle.
3. Create a Scenario.
4. Set a transition.
5. Duplicate the Scenario.
6. Change the copied transition.
7. Save the Project.
8. Reload the application.
9. Reopen the Project.
10. Inspect the environment, active Scenario and independent Vehicle Plans.
