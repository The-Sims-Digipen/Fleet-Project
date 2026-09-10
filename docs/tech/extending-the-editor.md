# Adding a module or object type

Compose another `CollapsibleSection` in `Sidebar`, supplying a title, optional description, `defaultOpen`, and children. Its accessible disclosure preserves mounted child state. Modules with editable controls should pass `commitEdit` to `onBeforeCollapse`. Reuse the controls in `components/controls.tsx`, passing values, change callbacks, and edit lifecycle callbacks; the controls themselves do not depend on Zustand.

## Register a model

The editor uses a developer-defined catalog in `apps/client/src/scene/catalog.ts`. An object instance references a definition; that definition references a reusable asset. Adding a model does not require editing the viewport or inspector.

1. Export a static, uncompressed, self-contained GLB with embedded textures and put it in `apps/client/public/models/`. Use metres and Y-up where possible. Animation playback, separate `.gltf` dependencies, compression decoders, user uploads, and external URL entry are not supported in this version.
2. Add an entry to `modelAssets`, using the Vite base URL so it also works when deployed below a path prefix:

   ```ts
   "delivery-van": {
     url: `${import.meta.env.BASE_URL}models/delivery-van.glb`,
     correction: identityTransform(),
   },
   ```

3. Add an entry to `objectDefinitions`:

   ```ts
   "parked-van": {
     kind: "model",
     name: "Delivery van",
     assetId: "delivery-van",
     transform: identityTransform(),
   },
   ```

4. Choose **Delivery van** in the catalog and click **Add Object**, or call `useSceneStore.getState().addObject("parked-van")`. Each call creates a separately editable instance with a unique ID and one undo step. Instances start at their definition's default position; move overlapping instances with the inspector.

Asset correction is an inner transform, applied before the instance's editable transform. Use it to correct units, orientation, or an inconvenient origin without changing defaults for every instance. For example, `scale: [0.01, 0.01, 0.01]` converts a model authored in centimetres to metres. Positions are metres and rotations are radians. Models are never automatically resized or centred. Different definitions can share an asset while using different default placements.

## Types, rendering, and ownership

`scene/types.ts` holds serializable types. Version 2 documents contain objects with `id`, `name`, `definitionId`, `transform`, and `appearance`, plus scene lighting. There is no migration from the in-memory version 1 demo because it had no save/load integration. Keep stable catalog keys once persistent projects are introduced.

`ObjectDefinition.kind` selects a renderer from the typed registry in `ModelObject.tsx`. Currently only `model` is implemented. Add future procedural/domain kinds with explicit types, renderers, and inspector fields when their behavior is implemented; do not encode business behavior in geometry names or attach fleet/charging data to this generic model foundation.

Use store actions rather than mutating document data or Three.js meshes directly. Selection and edit history remain outside the document. Unknown definitions/assets appear as an inspector error and can still be deleted; unknown creation requests are ignored.

The runtime cache loads once per asset URL, independently of undo. Instance hierarchies and materials are cloned; immutable geometries/textures remain shared. Unmounting disposes instance materials, skeleton resources, and outline resources, never the cached geometry/textures. The asset cache lives for the page session. A model's loading/error state does not block other objects. **Retry** reloads the affected asset for all its instances.

Original GLB materials are used unless an appearance override is set. Tint multiplies authored colors; a material preset overrides roughness/metalness on standard/physical PBR materials; wireframe affects supporting mesh materials. **Restore Appearance** clears all overrides. **Reset object** also restores definition transform defaults but preserves the instance ID and name. **Delete Object**, **Add Object**, and resets are undoable. Selection is cleared whenever its object no longer exists; undo does not resurrect selection.

## Bundled sample

`public/models/sample-bollard.glb` is an original five-mesh safety bollard created for this repository, with three materials and no third-party assets. Its origin is at the base centre; its height is 2.4 metres. Regenerate it using `python apps/client/scripts/generate-sample-model.py` from the repository root. Python is only required to regenerate the sample, not to run/build the application.

The Debug module exposes the document without editing it. Persistence, gizmos, and backend integration are intentionally future additions. DOM tests verify controls and state; real-browser checks are required for picking, orbiting, outlines, and WebGL rendering.

See [editing and history](editing-and-history.md) for edit lifecycle behavior and the [architecture](architecture.md#current-scene-editor-architecture) for state ownership.
