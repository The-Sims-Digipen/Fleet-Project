# F02 — Fleet Management

**M1 priority:** MUST  
**Primary owner:** Jarrel Tay Wee Han

## Current behavior

The Fleet Management panel displays the Project's Vehicles.
It selects one Vehicle at a time.
Users can add, edit and delete Vehicles.
The panel shows each Vehicle's ID, world position and selected-year status.

A new Project starts with an empty fleet.
A new Vehicle receives the first unused predefined world transform.
The Project limit is ten Vehicles.
Predefined positions are construction inputs.
They are not persisted parking assignments or position-slot records.

## Editable values

| Group | Values |
|---|---|
| Identity | Name and optional baseline Preset |
| Use | Annual distance, daily distance, operating days and utilisation |
| Operation | Route pattern, Depot dwell, Depot return and external charging access |
| Replacement | Baseline replacement year |
| Owned holding | Current value and end residual value |
| Leased holding | Annual payment and exit fee |

The selected Vehicle also has target-Preset and transition-year controls.
These edit its first transition in the active Scenario.
The panel preserves later transitions already in its Vehicle Plan.
Filters, sort controls and bulk selection are not present.

## Integration

The panel follows the [M1 integration contract](../tech/m1-integration-contract.md).
It edits Project-owned Vehicle baselines through Project commands.
A baseline-Preset change preserves Vehicle identity.
Scenario Vehicle Plans contain target Presets and transition years.

Vehicle deletion lists affected Scenarios before confirmation.
The deletion removes the Vehicle and every Scenario plan for its ID.
The 3D view derives Vehicles from the Project fleet.
Development tools provide transform edits.

## Demonstration

1. Add a Vehicle.
2. Inspect its initial position in 3D.
3. Edit its baseline Preset.
4. Inspect its unchanged ID.
5. Set a Scenario transition.
6. Save the Project.
7. Reopen the Project.
8. Inspect the Vehicle and transition.
9. Delete the Vehicle.
10. Inspect the remaining Scenario plans.
