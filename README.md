# Fleet Transition Planner

A browser-based fleet electrification planning prototype with an interactive Three.js depot editor, reusable vehicle presets, and browser-local Project / World / Scenario persistence.

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

The Fastify server is still started by the root `pnpm dev` command because the project may use it for later features. The current Project / World / Scenario save flow works even if only the client is running:

```bash
pnpm dev:client
```

## Project persistence

Browser storage keeps four logical collections:

```text
projects
worlds
scenarios
projectScenarios
```

- **World** owns persistent 3D objects, transforms, appearance, and scene settings.
- **Scenario** is saved separately but is permanently bound to one `worldId`.
- **Project** references one world and links one or more scenarios using that same world.
- The IndexedDB repository rejects cross-world scenario links and uses revision checks to detect stale saves from another tab.
- **Save Project** updates the project, shared world, scenarios, and links in one IndexedDB transaction.
- Camera state, current selection, gizmo mode, undo history, and calculated results are not persisted.

Browser storage belongs to one browser profile/device. It is not automatically shared with teammates.

## Import / export

Use **Export** in the project header to download the current workspace as a `.fleetproject` file. Export includes the project data, complete 3D world, vehicle presets, and scenarios, including unsaved edits.

Use **Import** to open a `.fleetproject` file. Import creates an independent local copy with fresh IDs, so it will not overwrite an existing local project/world even when the same file is imported more than once.

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
