# Extending the editor

Compose each sidebar feature as an isolated component inside `Sidebar` using `CollapsibleSection`. Supply a title, optional description, `defaultOpen`, and children. Modules with editable controls should pass `commitEdit` to `onBeforeCollapse`. Reuse the controls in `components/controls.tsx`; they receive values, callbacks, and an edit lifecycle and do not depend on Zustand.

Feature components read the canonical document from `useProjectStore(state => state.runtime.document)` and call focused store actions or Project commands. Do not introduce a second feature store for a slice of Project data. Editor-only values belong in `ProjectEditorState`; persisted domain values belong in `ProjectDocument`.

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

Then import the factory in `apps/client/src/scene/catalog.ts` and register a stable definition. Set `vehiclePresetCompatible` to `true` only for geometry selectable by a vehicle preset.

```ts
charger: {
  kind: "procedural",
  name: "Low-poly Charger",
  vehiclePresetCompatible: false,
  createModel: createChargerModel,
  transform: identityTransform(),
},
```

Registering geometry does not create a new domain entity. If a charger, bay, obstacle, or other object needs product behavior or persistence, first add a typed Project-domain concept and its validation/commands, then project it into a `SceneObject` for rendering. Generic arbitrary scene objects are intentionally not a second persistence model.

## Rendering and ownership

`scene/types.ts` contains small render DTOs such as `SceneObject`, `Transform`, and appearance overrides. `createProjectSceneObjects` derives these from the Project environment, active Scenario, and selected year. Render DTOs and Three.js objects are never persisted.

`ObjectDefinition.kind` selects a renderer from the typed registry in `ModelObject.tsx`. Currently only `procedural` is implemented. Add future kinds with explicit renderers alongside their actual behavior. A model supplies presentation; it does not define fleet or planning data.

Every procedural factory call must return newly owned geometry and materials. Do not reuse mutable `Object3D`, geometry, material, or texture instances across calls. `createProceduralInstance` applies appearance, creates selection bounds, and disposes resources when the instance unmounts. Factory failures are isolated by the per-object render boundary.

The viewport uses Three.js `TransformControls` on the selected typed Project object. Interaction mode, transform mode, transform space, snapping, lighting, and camera state are editor-only. Depot and vehicle transforms are persisted and share the Project undo history.

See [editing and history](editing-and-history.md) and [architecture](architecture.md#ownership-boundaries).
