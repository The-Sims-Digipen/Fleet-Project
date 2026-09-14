# Adding a module or object type

Compose another `CollapsibleSection` in `Sidebar`, supplying a title, optional description, `defaultOpen`, and children. Its accessible disclosure preserves mounted child state. Modules with editable controls should pass `commitEdit` to `onBeforeCollapse`. Reuse the controls in `components/controls.tsx`, passing values, change callbacks, and edit lifecycle callbacks; the controls themselves do not depend on Zustand. Keep feature logic in an isolated component and let `Sidebar` compose panels.

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

Then import the factory in `apps/client/src/scene/catalog.ts` and register a stable definition:

```ts
charger: {
  kind: "procedural",
  name: "Low-poly Charger",
  createModel: createChargerModel,
  transform: identityTransform(),
},
```

No viewport, World Objects, or Inspector change is required for another generic procedural model. Click **Add Object** in **World Objects**, choose the definition in the modal, and click **Create Object**, or call `useSceneStore.getState().addObject("charger")`. Each call creates a separate instance with a unique ID and one undo step.

The compact World Objects list has a fixed-height scrollable area and shows every instance, highlights the current selection, and supports mouse or keyboard selection. Use **Delete Object** to remove the selected instance or **Clear selection** to deselect it. The Inspector only edits the selected object's properties.

## Types, rendering, and ownership

`scene/types.ts` contains serializable scene data. Version 2 objects store `id`, `name`, `definitionId`, `transform`, and optional `appearance`; they never store `THREE.Group`, geometry, materials, or factory functions. Catalog definitions are runtime configuration and connect stable definition IDs to factories.

`ObjectDefinition.kind` selects a renderer from the typed registry in `ModelObject.tsx`. Currently only `procedural` is implemented. Add future domain kinds with explicit types, renderers, and inspector fields alongside their actual behavior. A model supplies presentation; it does not define fleet, charger, bay, or obstacle business data.

Every call to a procedural factory must return newly owned geometry and materials. Do not reuse mutable `Object3D`, geometry, material, or texture instances across factory calls. `createProceduralInstance` applies appearance overrides, creates the non-interactive selection bounds, and disposes all resources owned by that instance when it unmounts. Factory failures are isolated by the per-object render boundary.

Generated model materials are used by default. Tint multiplies their colors; material presets override roughness and metalness on PBR materials; wireframe affects supporting mesh materials. **Restore Appearance** clears overrides. **Reset object** restores definition transform defaults and appearance while preserving the ID and name. Creation, deletion, and reset remain undoable. Selection is cleared whenever its object no longer exists; undo does not restore selection.

## Low-poly van

`models/van.ts` contains the first procedural object. `createVanModel()` returns a multi-part `THREE.Group` built at metre scale with a body, tapered cab, windows, bumpers, lights, and low-sided wheel cylinders. It uses only generated Three.js geometry and materials; there are no external model files or runtime asset requests.

The Debug module exposes the document without editing it. Persistence, gizmos, and backend integration are future additions. DOM tests verify controls and state; real-browser checks remain required for picking, orbiting, outlines, and WebGL rendering.

See [editing and history](editing-and-history.md) for edit lifecycle behavior and the [architecture](architecture.md#current-scene-editor-architecture) for state ownership.
