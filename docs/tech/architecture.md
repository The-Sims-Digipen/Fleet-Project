# System architecture

Design for the [Fleet Transition Planner](../proposal.md): a single-user local browser application with persistent projects, an interactive depot, and deterministic scenario calculations. The [repository README](../../README.md) describes the current implementation.

## Technology stack

| Layer | Technology | Purpose |
|---|---|---|
| Browser interface | React, TypeScript, Vite, Tailwind CSS | Fleet inputs, scenario controls, and accessible interface |
| Application state | Zustand | Editable project, selected scenario/year, and undo history |
| Server data | TanStack Query | Loading, saving, and request status |
| Visualization | Three.js, React Three Fiber, Drei | Interactive depot and two-plan scenes |
| Charts | ECharts | Costs, emissions, and annual roadmaps |
| API | Fastify, Zod | Local endpoints and shared input validation |
| Persistence | PostgreSQL, Drizzle | Versioned project storage and schema migrations |
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
  UI <--> API[Local Fastify API]
  API --> Validation[Shared domain validation]
  API --> DB[(PostgreSQL)]
```

Simulation and geometry are independent of rendering and persistence. The interface displays their outputs without duplicating formulas. Shared domain definitions keep the browser and API consistent. Component ownership is recorded in [deliverables](../deliverables.md).

## Data ownership and interaction

A project shares its vehicle presets, fleet, analysis period, energy-price assumptions, emissions factors, and one reusable 3D world. Scenarios are separate saved transition plans bound to that world; they do not own or duplicate the world document. Comparison therefore uses one physical depot with independent planning alternatives.

```mermaid
sequenceDiagram
  participant User
  participant Editor
  participant Calculation
  participant Views
  participant API
  participant Database
  User->>Editor: Change valid inputs
  Editor->>Calculation: Evaluate scenario
  Calculation-->>Views: Results and feasibility issues
  User->>Editor: Save
  Editor->>API: Project snapshot and expected revision
  API->>Database: Atomic revision-checked update
  Database-->>API: New revision
  API-->>Editor: Save acknowledgement
```

Financial input changes recalculate results. Year navigation selects annual results without changing schedules. Layout changes update geometry feedback; moving a charger does not change its electrical rating.

A save captures a consistent snapshot. Edits made during saving remain unsaved until acknowledged in a subsequent save. Failed saves preserve the working document; revision conflicts require an explicit choice to reload or save separately. Results are recalculated from versioned inputs rather than stored as independent values.

## Persistence and deployment boundary

PostgreSQL stores projects, worlds, and scenarios as separate validated versioned resources. `projects.world_id` and `scenarios.world_id` identify their physical world, while `project_scenarios` links plans to projects. Composite foreign keys make a cross-world project/scenario association impossible. A workspace save updates the project, world, scenarios, and links in one transaction; independent revision checks prevent stale overwrites. The [data and API specification](contracts.md) defines this boundary.

Production deployment uses one Vercel project. Vite output is served statically, Fastify runs as a Vercel Function under `/api`, and Neon provides PostgreSQL through `DATABASE_URL`. Production builds apply committed PostgreSQL migrations automatically before building. Local development uses the same relative API paths through Vite's proxy and can pull the Neon development credentials with the Vercel CLI.

## Engineering decisions

- Deterministic browser-side calculations support immediate feedback and independent numerical testing.
- Stable vehicle/object identifiers maintain selection, schedules, and bay assignments across edits and saves.
- A flat metre-based depot model provides space checks without implying civil or electrical engineering precision.
- Invalid layouts remain editable and visibly constrained; financial results remain labeled indicative.
- Model versions, explicit assumptions, and worked examples make results explainable and reproducible.

The [simulation model](simulation.md) and [depot editor](depot-editor.md) define the detailed calculation and editing behavior.

## Current scene-editor architecture

The editor keeps the active version 3 world document in Zustand while it is being edited, with separate editor selection/transform-tool settings and snapshot undo history. Serializable types live in `apps/client/src/scene/types.ts`; the developer catalog maps stable object definitions to procedural `THREE.Group` factories under `apps/client/src/models`. The viewport iterates document objects and dispatches through a typed renderer registry rather than depending on particular object IDs or shapes.

Each factory call creates an independently owned hierarchy, geometry, and materials. The renderer applies instance appearance overrides and creates a bounding outline, then disposes those resources on unmount. No model loader, external file, URL, or asset cache participates in rendering. Inspector and viewport-gizmo editing change document transforms only; gizmo mode, world/local space, and snapping remain editor-only state. The viewport uses the TransformControls implementation shipped with the pinned Three.js version so its interaction logic stays aligned with the renderer; directional move/scale handles are kept on the positive axes instead of camera-flipping. Project/scenario controls now save through the Fastify persistence API; the 3D world remains in the scene store while editing but is persisted as its own world resource. Simulation remains future work. See [extending the editor](extending-the-editor.md) for catalog registration and resource ownership.
