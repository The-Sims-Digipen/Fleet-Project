# Typed objects and supplied 3D models

Status: proposed implementation plan. This does not describe functionality already implemented.

## Outcome and scope

Replace the fixed plane/cube demo with a document-driven scene. Users can import a self-contained GLB model, create an object using it, and replace an existing object's model without changing its identity or domain configuration. Developers can also register bundled GLB assets. Multiple objects can reference the same model.

Use typed domain objects and shared data structures, without ECS. The first delivery supports generic model objects and establishes the extension path for vehicles, chargers, bays, and obstacles. Implement each domain type alongside its actual domain feature rather than inventing incomplete simulation fields now.

Assumptions: GLB is the initial interchange format; OBJ, FBX, multi-file glTF, arbitrary remote URLs, animation playback, and model editing are outside the first delivery. Show supported format requirements in the import UI. Author-supplied models replace demo primitives; editor grids, selection outlines, and future polygon site/bay visuals remain generated geometry where appropriate.

## 1. Separate document types from the store

- Move serializable types and creation/validation functions into a scene domain module. Keep Zustand responsible for actions, transactions, and subscriptions.
- Give every object a stable ID, name, a `kind` discriminator, and the placement data appropriate to its type.
- Start with `kind: "model"`, an asset reference, and transform data. Extend to a discriminated union as domain features land. Vehicle instances reference shared fleet records instead of copying economics into scene objects.
- Reuse typed transform, model-visual, and footprint structures. Do not make every possible property optional on one universal object interface.
- Keep physical dimensions and footprints authoritative for depot checks. Model bounds can suggest initial dimensions, but visual replacement must never silently change planning inputs.
- Version the document schema. The current scene is in memory only, so replace its demo initializer; reject unsupported imported versions explicitly. Add migration only if persisted older documents actually exist.

Illustrative separation:

```ts
type ModelVisual = { assetId: string };
type ModelObject = {
  id: string;
  name: string;
  kind: "model";
  transform: Transform; // position, rotation in radians, positive scale
  visual: ModelVisual;
};

// Later domain feature: a charger owns validated charger configuration
// and a physical footprint, with ModelVisual supplying its presentation.
```

Three.js objects, loaded textures, Files, Blob URLs, and loading state never belong in the document or history.

## 2. Establish an asset catalog and durable import path

- Store asset metadata once under stable asset IDs. Objects reference those IDs rather than embedding URLs or model bytes.
- Metadata records the display name, source, content identity, and an explicit model-space correction for units, orientation, and origin. World coordinates remain metres with Y up and an XZ ground plane.
- Support bundled assets through a developer catalog and user files through an asset repository with import/read operations.
- For the current browser-only prototype, persist imported GLB bytes in IndexedDB before committing an object that references them. Resolve temporary Blob URLs only at runtime and revoke them when no longer used.
- Explain that browser-local assets belong to this browser. When server project persistence is implemented, upload them to managed asset storage and reference durable asset IDs. Do not put model bytes into the existing JSON project payload or assume browser-local references are portable.
- Validate file size, parseability, model content, and external resource dependencies before accepting an import. Set explicit size/complexity limits during implementation using representative assets; report unsupported compression/extensions clearly.
- Require self-contained files for the initial import path. Reject external resource references rather than silently depending on network fetches.
- Cancellation or import failure leaves the document unchanged. Preserve assets referenced by undo/redo history; defer asset garbage collection until references across documents and history can be accounted for.

## 3. Replace hardcoded rendering

- Render document objects dynamically by ID. Remove hardcoded plane/cube instances and the plane-versus-box geometry branch.
- Introduce a small typed renderer registry keyed by object kind. Keep defaults and domain validation independent from React; place renderer and inspector registration in the UI layer.
- Use a shared model renderer for all model-backed kinds. Adding another model asset requires catalog data, not another renderer.
- Cache loaded asset resources, but give each object an independent scene hierarchy and transforms. Handle skinned hierarchies correctly even when animation playback is deferred.
- Preserve authored materials and textures by default. Remove the current assumption that all objects have one color and material preset. If overrides are offered, make them explicit and isolate mutable materials per instance.
- Apply asset unit/orientation/origin correction inside the object's world transform. Provide an import preview with editable scale/orientation and ground placement before committing.
- Keep selection and picking associated with the owning object ID even when the model contains nested meshes. Selection decoration must not alter authored materials.
- Isolate loading and errors per asset/object so a broken model cannot blank the viewport. Show an identifiable loading/error marker and keep the object selectable in the object list. Never silently substitute a cube.
- Define ownership and disposal of shared geometries/textures and instance-specific resources so removing one instance cannot break another.

## 4. Add creation and model replacement flows

- Add an object catalog/import action: choose a bundled model or import GLB, preview it, name the object, then place it.
- Add undoable create, duplicate, delete, and replace-model actions. Duplicates receive new object IDs while reusing immutable asset references.
- Model replacement preserves the object's ID, world placement, domain references, and physical dimensions; preview correction changes before committing.
- Render shared inspector fields plus kind-specific controls. Generic model objects expose name, transform, and model replacement; future domain types expose their own validated fields.
- Replace reset-by-demo-ID with a defined reset-transform action using creation defaults. Keep whole-scene reset as a separate action with explicit behavior.
- Preserve one gesture per undo step, cancellation, and selection outside document history. After deletion or undo, selected IDs must resolve or be cleared.
- Update accessible scene descriptions and empty-selection text to describe the actual object collection.

## 5. Align with the future depot features

- Add vehicle, charger, bay, and obstacle types using the existing project/scenario contracts as those features are built.
- A model is presentation, not domain identity. Different vehicle models may use the same vehicle kind; a charger remains a charger when its model changes.
- Derive year-dependent visibility and vehicle-preset presentation from scenario inputs. Do not replace persisted objects merely because the selected year changes.
- Permit procedural visuals for authored site polygons and footprints. They are domain geometry, not fixed demo objects.
- Keep geometry validation and financial calculations independent of the renderer and asset loader. Model-load failure must not erase a planned charger from cost calculations.

## Implementation sequence

1. Extract/version the document types and factories; add collection actions and history coverage.
2. Add asset metadata, bundled registration, browser-local asset storage, and validated GLB import.
3. Build model rendering, dynamic object iteration, resource ownership, and isolated loading/error handling.
4. Add import preview, object creation/replacement, dynamic inspectors, and selection behavior; remove demo primitives and assumptions.
5. Verify the complete user flow and update the architecture and extension guide to describe implemented behavior.

Keep the work within the current client initially. Add a shared package when the API starts consuming these schemas, rather than duplicating browser schemas on the server. Asset upload endpoints and project portability should land with persistent project storage.

## Acceptance and verification

- Import two visibly different supplied GLB models and render both without editing viewport code.
- Create several objects from one asset; transforms, selection, and any explicit material overrides remain independent.
- Replace a model without changing object identity or domain data. Undo and redo restore the previous reference and placement.
- Verify create/duplicate/delete/reset and gesture cancellation in store/UI tests, including selection after deletion and undo.
- Verify rejected imports, failed storage, missing assets, and malformed files leave existing objects usable; test rejection of external dependencies.
- Verify saved asset metadata plus stored bytes can rehydrate a model after reload; full scene reopening depends on the separate project-save feature.
- In a real browser, check nested-mesh picking, multi-mesh materials/textures, scale/orientation/ground alignment, multiple instances, loading/error isolation, and resource cleanup.
- Use small checked-in GLB fixtures with documented reuse rights; include a nested/multi-material model and a skinned fixture if skinned assets are accepted.
- Run the repository's type checks, relevant automated tests, and production build. DOM tests alone do not validate WebGL rendering.

Related design: [data contracts](../docs/tech/contracts.md), [depot editor](../docs/tech/depot-editor.md), [architecture](../docs/tech/architecture.md), and [current extension guide](../docs/tech/extending-the-editor.md).
