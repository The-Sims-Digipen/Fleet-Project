# Depot editor specification

The product Project owns one physical environment. New Projects always contain the default depot and ten parking lots. For the current release, fleet vehicles are assigned automatically to the first available lot and the fleet is limited to ten vehicles.

`Project.fleet` is authoritative. The 3D layer derives one rendered vehicle per fleet entry using its parking-lot transform and effective preset for the active Scenario and selected year. A vehicle without a preset uses generic geometry and styling. Rendered vehicle entities are not separately persisted.

Generic scene-object creation, deletion, transform, appearance, and debug panels are development tooling. They remain available in development builds for extending and validating Three.js models, but production users do not manage arbitrary objects or a separate scene lifecycle. The default depot cannot be removed.

Future freeform site design may add typed bays, chargers, obstacles, and geometry validation. Those objects should remain part of the single Project environment. Scenario overlays may vary by year without duplicating that environment.

Deletion of a fleet vehicle removes the Project fleet entry and all Scenario plan entries keyed by its stable vehicle ID. Changing `presetId` preserves the vehicle ID and its Scenario references.
