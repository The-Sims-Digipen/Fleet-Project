# F01 — Vehicle Presets

**M1 priority:** MUST  
**Primary owner:** Tan Wei Jun

## User capability

Users can view, create and edit reusable vehicle presets and select a target vehicle preset for replacement planning.

## User need

Vehicle presets provide a consistent source of vehicle specifications for fleet management, transition planning, simulation and 3D representation.

## M1 scope

- List available vehicle presets.
- Create and edit a preset.
- Delete a preset only when reference integrity is preserved or the user is shown the affected references.
- Configure the fields required by M1 calculations and visualisation, including propulsion/energy source, efficiency, purchase cost, battery/charging attributes and 3D model selection where applicable.
- Use stable preset IDs so fleet/scenario references survive edits and persistence.
- Allow scenario transition planning to select a target preset.

## Technical dependencies

- [T01 — Project Persistence & Serialization Library](../tech-tasks/T01%20-%20Project%20Persistence%20and%20Serialization%20Library.md)
- [T02 — Company Design System & UI Component Library](../tech-tasks/T02%20-%20Company%20Design%20System%20and%20UI%20Component%20Library.md)
- [T03 — Fleet & Scenario Data Engine](../tech-tasks/T03%20-%20Fleet%20and%20Scenario%20Data%20Engine.md)
- [T05 — Simulation & Financial Engine](../tech-tasks/T05%20-%20Simulation%20and%20Financial%20Engine.md)

## M1 evidence

Create or edit a preset, assign it to a fleet/scenario transition, save/reopen the project, and show that the same preset data is used by the transition and simulation workflow.
