# Depot editor specification

The version 1 Project format owns one physical environment. This environment contains one Depot and its Project Vehicles. New Projects use the default ordered list of ten spawn transforms in world coordinates. Vehicle creation copies the first unused transform onto the new Vehicle. This list is construction input only. Persistence excludes parking assignments and spawn-slot identities.

`Project.environment` is authoritative. The 3D layer derives the Depot and one render object per Vehicle from stored transforms. It uses the effective Preset for the active Scenario and selected year. A Vehicle without a baseline Preset uses generic geometry and styles. Render objects are not separately persisted.

Development builds expose transform and debug tools for typed Project objects. Production users create Vehicles through Fleet Management. They do not manage arbitrary objects or a separate scene lifecycle. The default Depot cannot be removed.

M1 has no persisted parking assignments or Scenario charging assumptions. The current environment contains the Depot and Vehicles only.

A Vehicle deletion command removes the Vehicle from the Project environment. It also removes all Scenario plan entries with that stable Vehicle ID. A change to `baselinePresetId` preserves the Vehicle ID and its Scenario references.
