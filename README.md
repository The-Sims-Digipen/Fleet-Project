# Fleet Transition Planner

A browser-based fleet electrification planning prototype with an interactive Three.js depot, reusable vehicle presets, and browser-local Project / Scenario persistence.

Project documentation is indexed in [docs/README.md](docs/README.md).

## Stack

- React + TypeScript + Vite + Tailwind
- Three.js + React Three Fiber + Drei
- Zustand
- IndexedDB for prototype project persistence
- Fastify server retained for future backend features; project saving does not depend on it

## Prerequisites

- Node.js 20+
- pnpm **11.24.0** (pinned in `package.json`)
- Git

Install pnpm if required:

```bash
npm install --global pnpm@11.24.0
```

## Local development

Install dependencies and start the project:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

- Client: http://localhost:5173
- API: http://localhost:3001

No PostgreSQL, Neon account, database migration, or `DATABASE_URL` is required for project persistence. Projects are saved to IndexedDB in the browser profile running the client.

The Fastify server is still started by the root `pnpm dev` command because the project may use it for later features. The current Project / Scenario save flow works even if only the client is running:

```bash
pnpm dev:client
```

## Project persistence

Browser storage keeps two logical collections:

```text
projects
scenarios
```

- **Project** owns one physical environment, its fleet, presets, shared assumptions, and its Scenarios.
- **Scenario** is saved separately and references its Project; it does not duplicate the scene or fleet.
- **Save Project** atomically writes the Project and every in-memory Scenario to IndexedDB.
- The repository validates fleet/Scenario references and uses revision checks to detect stale saves from another tab.
- Camera state, current selection, gizmo mode, undo history, and calculated results are not persisted.

Browser storage belongs to one browser profile/device. It is not automatically shared with teammates.

## Import / export

Use **Export** in the project header to download the current workspace as a `.fleetproject` file. Export includes the complete Project environment, fleet, vehicle presets, and all Scenarios, including unsaved edits.

Use **Import** to open a `.fleetproject` file. Import creates an independent local copy with fresh Project and Scenario IDs, so it will not overwrite an existing local Project even when the same file is imported more than once.

This is the intended way to move prototype projects between teammates or browsers before cloud persistence is introduced.

## Future cloud persistence

The UI talks to a `ProjectRepository` abstraction. The current implementation is `IndexedDbProjectRepository`; a future API/PostgreSQL repository can implement the same interface without changing the editor's ownership model.

The existing Fastify/PostgreSQL prototype code is retained as a future backend reference, but it is not used by the browser project-save flow.

## Verification

```bash
pnpm verify
```

Individual commands:

```bash
pnpm typecheck
pnpm test
pnpm build
```
