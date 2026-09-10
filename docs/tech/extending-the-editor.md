# Adding a module or object type

Compose another `CollapsibleSection` in `Sidebar`, supplying a title, optional description, `defaultOpen`, and children. Its accessible disclosure preserves mounted child state. Modules with editable controls should pass `commitEdit` to `onBeforeCollapse`. Reuse the controls in `components/controls.tsx`, passing values, change callbacks, and edit lifecycle callbacks; the controls themselves do not depend on Zustand.

To add an object type, extend `SceneObject.type`, add its initial document data, and render its geometry in `SceneObjectMesh`. Add an instance to the viewport. The inspector already handles the shared transform and appearance fields; add explicit type-specific fields when needed. Use store actions rather than mutating document data or Three.js meshes directly. Keep future saved document data separate from editor preferences and runtime refs.

The Debug module exposes the document without editing it. Persistence, gizmos, object creation, and backend integration are intentionally future additions. DOM tests verify controls and state; real-browser checks are required for picking, orbiting, outlines, and WebGL rendering.

See [editing and history](editing-and-history.md) for edit lifecycle behavior and the [architecture](architecture.md#current-scene-editor-architecture) for state ownership.
