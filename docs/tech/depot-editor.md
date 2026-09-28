# Depot editor specification

The product Project owns one physical environment. New Projects contain the default depot and support ten initial vehicle positions. Fleet vehicles receive an authoritative world transform when created and the fleet is limited to ten vehicles.

`Project.environment` is authoritative. The 3D layer derives the depot and one rendered object per vehicle using their stored transforms and the effective preset for the active Scenario and selected year. A vehicle without a preset uses generic geometry and styling. Rendered objects are not separately persisted.

Development builds expose transform and debug tooling for typed Project objects. Production users create vehicles through Fleet Management and do not manage arbitrary objects or a separate scene lifecycle. The default depot cannot be removed.

Future freeform site design may add typed bays, chargers, obstacles, and geometry validation. Those objects should remain part of the single Project environment. Scenario overlays may vary by year without duplicating that environment.

Deletion of a fleet vehicle removes the Project environment entry and all Scenario plan entries keyed by its stable vehicle ID. Changing `baselinePresetId` preserves the vehicle ID and its Scenario references.
