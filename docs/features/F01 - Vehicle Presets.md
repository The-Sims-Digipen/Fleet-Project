# F01 — Vehicle Presets

**M1 priority:** MUST  
**Primary owner:** Tan Wei Jun

## Shared integration contract

Follow the [M1 integration contract](../tech/m1-integration-contract.md). F01 edits Project-owned Vehicle Presets through Project commands, preserves stable IDs, and uses Project reference-integrity rules before deletion. Presets supply baseline or transition state for Project Vehicles; they do not create independent scene objects.

## User capability

Users can view, create and edit reusable vehicle presets and select a target vehicle preset for replacement planning.

## User need

Vehicle presets provide a consistent source of vehicle specifications for fleet management, transition planning, simulation and 3D representation.

## M1 scope

- List available vehicle presets.
- Create and edit a preset.
- Delete a preset only when reference integrity is preserved or the user is shown the affected references.
- Configure the fields required by M1 annual calculations and visualisation, including propulsion/energy source, consumption, efficiency, purchase cost, and 3D model selection where applicable. Charging strategy, depot/external split, charger inventory, and charging feasibility are later scope.
- Use stable preset IDs so fleet/scenario references survive edits and persistence.
- Allow scenario transition planning to select a target preset.

## M1 evidence

Create or edit a preset, assign it to a fleet/scenario transition, save/reopen the project, and show that the same preset data is used by the transition and simulation workflow.
