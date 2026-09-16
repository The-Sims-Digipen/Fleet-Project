# System architecture

Design for the [Fleet Transition Planner](../proposal.md): a single-user browser application with persistent projects, an interactive depot, and deterministic scenario calculations. The [repository README](../../README.md) describes the current implementation.

## Technology stack

| Layer | Technology | Purpose |
|---|---|---|
| Browser interface | React, TypeScript, Vite, Tailwind CSS | Fleet inputs, scenario controls, and accessible interface |
| Application state | Zustand | Editable project, selected scenario/year, editor state, and undo history |
| Visualization | Three.js, React Three Fiber, Drei | Interactive depot and two-plan scenes |
| Charts | ECharts | Costs, emissions, and annual roadmaps |
| Prototype persistence | IndexedDB | Browser-local Project / World / Scenario storage |
| Future backend | Fastify, Zod | Retained for later server-side features/cloud persistence |
| Verification | Vitest, Testing Library, browser checks | Calculations, controls, integration, and visual behavior |

## Component relationships

```mermaid
flowchart LR
  Operator[Fleet operator] --> UI[Forms and comparison views]
  UI <--> State[Editable project and scenarios]
  State --> Simulation[Simulation engine]
  State --> Geometry[Geometry validation]
  Simulation --> Results[Annual results and explanations]
  Results --> Charts[Charts]
  Results --> Scene[3D depot scenes]
  Geometry --> Scene
  State --> Scene
  State <--> Repo[ProjectRepository]
  Repo --> IDB[(IndexedDB)]
  Repo -. future adapter .-> API[Fastify API]
```

Simulation and geometry remain independent of rendering and persistence. The editor talks to a repository abstraction rather than to IndexedDB directly.

## Data ownership and interaction

A project shares its vehicle presets, fleet, analysis period, energy-price assumptions, emissions factors, and one reusable 3D world. Scenarios are separate saved transition plans bound to that world; they do not own or duplicate the world document.

```mermaid
sequenceDiagram
  participant User
  participant Editor
  participant Repository
  participant IndexedDB
  User->>Editor: Change valid inputs
  User->>Editor: Save Project
  Editor->>Repository: Workspace snapshot + expected revisions
  Repository->>IndexedDB: One read/write transaction
  IndexedDB-->>Repository: Commit
  Repository-->>Editor: Saved records + new revisions
```

A project is edited as an in-memory workspace containing multiple Worlds and their world-bound Scenarios. Scene edits immediately update the active World in memory. Save Project is the persistence boundary: it captures every in-memory World and Scenario in one consistent snapshot. Failed saves preserve the working workspace. Revision conflicts can occur if another tab has updated a saved project/world/scenario since it was opened.

## Persistence boundary

IndexedDB database `fleet-transition-planner` stores `projects`, `worlds`, `scenarios`, ordered `projectWorlds` links, and ordered `projectScenarios` links as separate records. A Project may contain multiple Worlds; every Scenario references exactly one World. The repository validates every Scenario against a World included in the same project snapshot before committing.

The browser implementation is `IndexedDbProjectRepository`. Tests use the same `ProjectRepository` contract with an in-memory implementation. A future cloud/API adapter can replace the browser adapter without changing editor ownership or Scenario/World semantics.

Project files can also be exported as versioned `.fleetproject` JSON snapshots containing all project Worlds and Scenarios. Import validates the snapshot then creates fresh local Project/World/Scenario identities so importing cannot accidentally overwrite existing local data.

## Engineering decisions

- Deterministic browser-side calculations support immediate feedback and independent numerical testing.
- Stable vehicle/object identifiers maintain selection, schedules, and bay assignments across edits and saves.
- A flat metre-based depot model provides space checks without implying civil or electrical engineering precision.
- Invalid layouts remain editable and visibly constrained; financial results remain labeled indicative.
- Model versions, explicit assumptions, and worked examples make results explainable and reproducible.
- Browser-local persistence keeps the prototype zero-setup; cloud synchronization is deferred intentionally.

The [simulation model](simulation.md) and [depot editor](depot-editor.md) define the detailed calculation and editing behavior.

## Current scene-editor architecture

The editor keeps the active version 3 world document in Zustand while it is being edited, with separate editor selection/transform-tool settings and snapshot undo history. Serializable types live in `apps/client/src/scene/types.ts`; the developer catalog maps stable object definitions to procedural `THREE.Group` factories under `apps/client/src/models`. The viewport iterates document objects and dispatches through a typed renderer registry rather than depending on particular object IDs or shapes.

Each factory call creates an independently owned hierarchy, geometry, and materials. The renderer applies instance appearance overrides and creates a bounding outline, then disposes those resources on unmount. Inspector and viewport-gizmo editing change document transforms only; gizmo mode, world/local space, and snapping remain editor-only state. Project/scenario controls save through the browser-local repository; the 3D world remains in the scene store while editing but is persisted as its own World record. Simulation remains future work. See [extending the editor](extending-the-editor.md) for catalog registration and resource ownership.
