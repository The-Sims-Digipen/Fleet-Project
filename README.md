# 3D App Starter

A neutral pnpm monorepo starter. It includes a React, TypeScript, Vite, Tailwind CSS, and React Three Fiber client plus a minimal Fastify and Drizzle server setup.

The starter is a generic scene-editor architecture demo: select a plane or cube in the viewport, edit it through collapsible sidebar modules, and undo or redo changes. It contains no product-specific functionality.

## Architecture

`src/state/sceneStore.ts` in the client owns three separate concerns: a versioned, JSON-compatible scene document; editor selection; and up to 100 immutable undo snapshots. Three.js objects and camera controls stay in the viewport. State is in memory only and resets on reload.

Both interaction directions share the same actions:

- Inspector → transform/appearance action → document → subscribed scene mesh.
- Viewport click → selection action → editor selection → inspector and selection outline.

Coordinates use metres, Y-up, and XYZ Euler angles stored in radians; the inspector converts degrees at its boundary. The plane starts as an 8 × 8 XZ surface and the cube has 2 metre sides. Scale is applied to the parent transform, including the plane's Y axis. Objects do not have physics or collision constraints.

### Editing and history

`beginEdit`, `commitEdit`, and `cancelEdit` group continuous changes into one undo step. Number fields preview valid values while typing, commit on blur or Enter, and cancel on Escape. Sliders group pointer drags and held arrow keys; pointer cancellation restores the starting value. Color edits group until the picker loses focus. Presets and checkboxes are discrete edits. Blank or invalid numeric drafts stay local to their control.

Selection, reset actions, panel collapse, and history navigation finish pending edits. Undo includes object properties, lighting, and resets; selection, camera movement, and panel expansion are excluded. New edits discard redo, and no-op edits add no history. Ctrl/Cmd+Z undoes, Ctrl+Y or Ctrl/Cmd+Shift+Z redoes; focused form fields retain native shortcuts.

### Adding a module or object type

Compose another `CollapsibleSection` in `Sidebar`, supplying a title, optional description, `defaultOpen`, and children. Its accessible disclosure preserves mounted child state. Modules with editable controls should pass `commitEdit` to `onBeforeCollapse`. Reuse the controls in `components/controls.tsx`, passing values, change callbacks, and edit lifecycle callbacks; the controls themselves do not depend on Zustand.

To add an object type, extend `SceneObject.type`, add its initial document data, and render its geometry in `SceneObjectMesh`. Add an instance to the viewport. The inspector already handles the shared transform and appearance fields; add explicit type-specific fields when needed. Use store actions rather than mutating document data or Three.js meshes directly. Keep future saved document data separate from editor preferences and runtime refs.

The Debug module exposes the document without editing it. Persistence, gizmos, object creation, and backend integration are intentionally future additions. DOM tests verify controls and state; real-browser checks are required for picking, orbiting, outlines, and WebGL rendering.

## Prerequisites

Required:

- [Node.js 22 or newer](https://nodejs.org/en/download) (install an LTS release).
- pnpm. After installing Node.js, install pnpm with:

  ```bash
  npx get-pnpm
  ```

- [Git](https://git-scm.com/downloads), if you need to clone the repository.
- A browser with WebGL enabled to use the interactive 3D scene.

Verify the required tools from a new terminal:

```bash
node --version
pnpm --version
```

The Node.js version should be 22 or newer and the pnpm version should be 11.24.0 or newer. Also ensure ports `5173` and `3001` are available for the development servers.

## Development

Install dependencies:

```bash
pnpm install
```

Start the client and server:

```bash
pnpm dev
```

- Client: http://localhost:5173
- API: http://localhost:3001
- Health check: http://localhost:3001/health

Run verification:

```bash
pnpm verify
```

## Production

Build both applications:

```bash
pnpm build
```

Start the Fastify server:

```bash
pnpm --filter @starter/server start
```

Serve the generated client files from `apps/client/dist` using your production web server or hosting platform.
