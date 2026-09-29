# Depot editor specification

The version 5 Project owns one physical environment consisting of one Depot and its Project-owned Vehicles. New Projects use the default ordered list of ten world-space spawn transforms. Vehicle creation copies the first unused transform onto the new Vehicle; the list is construction input only, and no parking assignment or spawn-slot identity is persisted.

`Project.environment` is authoritative. The 3D layer derives the Depot and one rendered object per Vehicle using their stored transforms and the effective preset for the active Scenario and selected year. A Vehicle without a baseline Preset uses generic geometry and styling. Rendered objects are not separately persisted.

Development builds expose transform and debug tooling for typed Project objects. Production users create vehicles through Fleet Management and do not manage arbitrary objects or a separate scene lifecycle. The default depot cannot be removed.

M1 has no persisted parking assignments and no Scenario-owned charging assumptions. Future freeform site design may add typed bays, chargers, obstacles, and geometry validation; such physical entities should remain part of the single Project environment. Future charging plans may add Scenario overlays without duplicating the environment.

Deletion of a fleet vehicle removes the Project environment entry and all Scenario plan entries keyed by its stable vehicle ID. Changing `baselinePresetId` preserves the vehicle ID and its Scenario references.
