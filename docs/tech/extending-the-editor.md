# Extending the editor

Compose each sidebar feature as an isolated component inside `Sidebar` using `CollapsibleSection`. Register a stable panel ID and its initial expansion value in `appStore`, then supply that ID, a title, an optional description, and children. Modules with editable controls should pass the appropriate document or runtime-editor `commitEdit` to `onBeforeCollapse`. Reuse the controls in `components/controls.tsx`; they receive values, callbacks, and an edit lifecycle and do not depend on Zustand.

Feature components read the canonical document from `useProjectStore(state => state.runtime.document)` and call focused store actions or Project commands. Do not introduce a second feature store for a slice of Project data. Project-scoped editor values belong in `ProjectEditorState`; persisted domain values belong in `ProjectDocument`; cross-Project workspace mode and sidebar expansion belong in `appStore`.

## Register a procedural model

Scene models are TypeScript factories in `apps/client/src/models/`. Each factory returns a new, self-contained `THREE.Group`. Models use metres, Y-up, and the XZ ground plane. Put the model origin at its ground-contact centre when practical, and name meshes so tests and debugging can identify meaningful parts.

Create a factory such as:

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

Then import the factory in `apps/client/src/scene/catalog.ts` and register a stable model ID. Set `vehiclePresetCompatible` to `true` only for geometry selectable by a Vehicle Preset.

```ts
charger: {
  name: "Low-poly Charger",
  vehiclePresetCompatible: false,
  createModel: createChargerModel,
},
```

Registering geometry only makes a renderer available. If a charger, bay, obstacle, or other object needs product behavior or persistence, first add a typed Project-domain concept and its validation/commands, then add that type to the read-only Project world projection. The model catalogue cannot create a separately persisted scene instance.

## Rendering and ownership

`domain/spatial.ts` owns the transform type used by persisted Project entities. `createProjectWorld` derives read-only Depot and Vehicle views from the Project environment, active Scenario, and selected year. Those views and Three.js objects are never persisted.

The model catalogue maps each stable model ID to its procedural factory and Vehicle Preset compatibility. A model supplies presentation; it does not define fleet or planning data.

Every procedural factory call must return newly owned geometry and materials. Do not reuse mutable `Object3D`, geometry, material, or texture instances across calls. `createProceduralInstance` applies the tint derived by the Project world projection, creates selection bounds, and disposes resources when the instance unmounts. Factory failures are isolated by the per-object render boundary.

The viewport uses Three.js `TransformControls` on the selected typed Project object. Interaction mode, transform mode, transform space, snapping, lighting, and camera state are editor-only. Depot and vehicle transforms are persisted and share the Project undo history.

See [editing and history](editing-and-history.md) and [architecture](architecture.md#ownership-boundaries).
