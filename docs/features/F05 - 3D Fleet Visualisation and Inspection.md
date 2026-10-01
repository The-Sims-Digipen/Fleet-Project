# F05 — 3D Fleet Visualisation & Inspection

**M1 priority:** MUST  
**Primary owner:** Chew Shee Yang

## Current behavior

The 3D view renders the default Depot and Project Vehicles.
Each object uses its stored Project transform.
Vehicle geometry and colour follow the Effective Vehicle for the selected Scenario and year.

Bright green identifies an effective Preset that differs from the baseline Preset.
Vehicles without a Preset use generic geometry and styling.
The current Vehicle model is Low-poly Van.

Camera controls support orbit, pan and zoom.
Vehicle selection connects the viewport and fleet panel.
An outline highlights the selected Vehicle.

## Production and development controls

Production includes camera controls, Vehicle selection and highlights.
Development builds also expose typed object transforms, Inspector and debug controls.
Development transform edits use Project commands and Project history.
They do not create independent scene objects.

Compare renders two Scenario views of the same Project environment.
Each comparison view has independent camera controls.

## Integration

The feature follows the [M1 integration contract](../tech/m1-integration-contract.md).
`createProjectWorld` derives typed Depot and Vehicle views from the Project.
The projection uses the selected Scenario and year.
It shares the Effective Vehicle interpretation used by calculations.
The renderer does not persist a second scene document.

## Demonstration

1. Select a Scenario.
2. Select a year before a Vehicle transition.
3. Inspect its baseline or earlier effective state.
4. Select the transition year.
5. Inspect its target state.
6. Select the Vehicle in the viewport.
7. Inspect the corresponding fleet selection.
