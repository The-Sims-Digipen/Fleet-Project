# F02 — Fleet Management

**M1 priority:** MUST  
**Primary owner:** Jarrel Tay Wee Han

## User capability

Users can view the fleet and add or edit vehicle information such as vehicle identity, assigned/current preset, annual distance and other M1 planning attributes.

## User need

The transition model must use fleet data that represents the vehicles being planned rather than hard-coded mock rows.

## M1 scope

- Display the real project fleet.
- Add a fleet vehicle.
- Edit the fields required by transition planning and M1 calculations.
- Delete a vehicle with defined handling for scenario references.
- Assign a current vehicle preset.
- Preserve stable vehicle IDs across edits, scenarios and persistence.
- Scale the presentation to more than a fixed demo set of vehicles.

Filtering, sorting and bulk planning may be expanded after the minimum real CRUD/data flow is stable.

## Technical dependencies

- [T01 — Project Persistence & Serialization Library](../tech-tasks/T01%20-%20Project%20Persistence%20and%20Serialization%20Library.md)
- [T02 — Company Design System & UI Component Library](../tech-tasks/T02%20-%20Company%20Design%20System%20and%20UI%20Component%20Library.md)
- [T03 — Fleet & Scenario Data Engine](../tech-tasks/T03%20-%20Fleet%20and%20Scenario%20Data%20Engine.md)

## M1 evidence

Create/edit a real fleet vehicle, assign its current preset, use the same vehicle in a scenario transition, save/reopen the project, and verify the vehicle and references are restored.
