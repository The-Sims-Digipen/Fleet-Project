# Extend the editor

Compose each sidebar feature as an isolated component inside `Sidebar`. Use `CollapsibleSection` for the feature panel. Register a stable panel ID in `appStore`. Set the initial expansion value for that ID. Supply the ID, title, optional description, and children to the panel.

Pass the applicable document or runtime-editor `commitEdit` callback to `onBeforeCollapse` for editable controls. Reuse controls from `components/controls.tsx`. These controls receive values, callbacks, and an edit lifecycle. They do not depend on Zustand.

Feature components read the version 1 canonical document from `useProjectStore(state => state.runtime.document)`. They call focused store actions or Project commands. Do not add another authoritative store for part of the Project data.

Project editor values belong in `ProjectEditorState`. Persisted domain values belong in `ProjectDocument`. Application values that survive a change to the open Project belong in `appStore`. These values include the read-only Project catalogue, repository list/open status, global Project dialogs, workspace mode, and sidebar expansion.

## Register a procedural model

Scene models are TypeScript factories in `apps/client/src/models/`. Each factory returns a new, independent `THREE.Group`. Models use metres, Y-up, and the XZ ground plane. Put the model origin at its ground-contact centre where possible. Give each mesh a name that identifies its function for tests and debug tools.

Create a factory as shown in this example:

```ts
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from "three";

export function createChargerModel() {
  const group = new Group();
  group.name = "Low-poly charger";
  const material = new MeshStandardMaterial({ color: "#55d6be" });
  const body = new Mesh(new BoxGeometry(0.4, 1.4, 0.3), material);
  body.name = "Charger body";
  body.position.y = 0.7;
  group.add(body);
  return group;
}
```

Import the factory in `apps/client/src/scene/catalog.ts`. Register a stable model ID. Set `vehiclePresetCompatible` to `true` only for geometry that a Vehicle Preset can select.

```ts
charger: {
  name: "Low-poly Charger",
  vehiclePresetCompatible: false,
  createModel: createChargerModel,
},
```

Geometry registration makes a renderer available. It does not add product behavior or persistence. Add a typed Project-domain concept first when a Charger, Bay, Obstacle, or other object needs this behavior. Add validation and commands for the concept. Add the type to the read-only Project world projection. The model catalogue cannot create a separately persisted scene instance.

## Render views and ownership

`domain/spatial.ts` owns the transform type for persisted Project entities. `createProjectWorld` derives read-only typed Depot and Vehicle views from the Project environment, active Scenario, and selected year. Typed references contain the Project entity kind and stable ID. Persistence excludes these views and Three.js objects.

M1 does not persist parking assignments or Scenario charging assumptions. Add a typed Project entity before its renderer. Add the applicable Project command before that renderer.

The model catalogue maps each stable model ID to its procedural factory and Vehicle Preset compatibility. A model supplies its visual representation. It does not define fleet or plan data.

Each procedural factory call must return new geometry and materials that the instance owns. Do not share mutable `Object3D`, geometry, material, or texture instances across calls. `createProceduralInstance` applies the tint from the Project world projection. It creates selection bounds and disposes resources when the instance unmounts. A render boundary isolates a factory failure to that object.

The viewport uses Three.js `TransformControls` on the selected typed Project object. Interaction mode, transform mode, transform space, snapping, lighting, and camera state belong to the editor only. Depot and Vehicle transforms are persisted. They share the Project undo history.

See [edit lifecycle and history](editing-and-history.md) and [architecture](architecture.md#ownership-boundaries).
