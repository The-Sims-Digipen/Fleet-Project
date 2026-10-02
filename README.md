# Fleet Transition Planner

A browser application for fleet transition plans. It has an interactive Three.js depot, reusable Vehicle Presets, and local Project storage.

Use the [documentation index](docs/README.md) to find product and technical documents.

## Stack

- React + TypeScript + Vite + Tailwind
- Three.js + React Three Fiber + Drei
- Zustand
- IndexedDB for local Project storage
- Fastify for the optional server API

## Run the built application

Download or clone the project, then run its launcher:

- **Windows 10/11:** double-click `run.bat`, or run `.\run.bat` from a terminal.
- **Ubuntu 24.04:** run `bash run.sh` from a terminal.

Open **http://localhost:5173**. Keep the terminal open while using the application,
press **Ctrl+C** to stop both services. Port 5173 must be free

Tool downloads and package caches stay in the ignored `.tools/` directory.
Installation needs no administrator rights and does not change the system PATH.

The client is served with Vite's local build preview. For VM hosting, use the
[deployment guide](docs/tech/deployment.md).

## Development prerequisites

- Use Node.js 24 LTS (`.nvmrc`). The minimum supported version is 22.13.
- Use pnpm **11.24.0**. `package.json` specifies this version.
- Git

If pnpm is absent, install it:

```bash
npm install --global pnpm@11.24.0
```

## Local development

1. Install the dependencies:

```bash
pnpm install --frozen-lockfile
```

2. Start the client and server:

```bash
pnpm dev
```

- Client: http://localhost:5173
- API: http://localhost:3001

The client saves Projects to IndexedDB in the current browser profile. This save path needs no PostgreSQL database, Neon account, migration, or `DATABASE_URL`.

The root `pnpm dev` command also starts the Fastify server. To run only the client, use:

```bash
pnpm dev:client
```

The shared UI components are in `packages/ui`. To start their component catalogue, use:

```bash
pnpm dev:ui
```

`apps/ui-docs` contains the component catalogue and usage instructions.

## Start a plan

1. Select **New** in the Project header.
2. Enter a Project name.
3. Select **Create Project**.
4. Review the Vehicle Presets and Analysis Settings.
5. Add Vehicles to the fleet.

A new Project has one default Depot, an empty fleet, five synthetic Vehicle Presets, and one Scenario named Plan A.
The default analysis period is 2026–2035, with SGD as the currency. Review the supplied assumptions before use.
The Project permits up to ten Vehicles.

**Open** lists Projects saved in the current browser. Synthetic fleet examples in the source are test fixtures; the interface has no Open Sample command.

## Project persistence

IndexedDB has one `projects` store. Each record contains a complete Project and its save revision.

- A **Project** owns one environment: one Depot and its Vehicles. It also owns the Vehicle Presets, Analysis Settings, and Scenarios.
- A **Scenario** contains Vehicle transition plans. All Scenarios use the same Project environment.
- **Save** writes the complete Project, with all Scenarios and the active Scenario ID, in one transaction.
- The repository checks references and save revisions. It rejects a stale save from another tab.
- Save excludes the camera, selected object, transform tools, undo history, timeline playback, and calculated results.

Local storage belongs to one browser profile on one device. Use export and import to transfer a Project to another browser or team member.

## Import / export

Select **Export** in the Project header to download a `.fleetproject` file.
The file contains the complete Project, including unsaved edits and all Scenarios.

Select **Import** to load a `.fleetproject` file.
Import checks the file, creates a new Project ID, saves the new local Project, and opens it.
The Depot, Vehicle, Vehicle Preset, and Scenario IDs stay the same inside the new Project.
Thus, repeated imports create separate Projects and preserve their internal references.

Import and export use version 1 of the portable file format. Import rejects unsupported formats and invalid Project references.

## Optional server persistence

The editor uses the `ProjectRepository` interface. Its default adapter is `IndexedDbProjectRepository`.

An API adapter and a Fastify/PostgreSQL implementation also exist. The default browser save path does not use them.
The adapters use the same complete Project record and revision checks.

## Verification

```bash
pnpm verify
```

To run an individual check, use its command:

```bash
pnpm typecheck
pnpm test
pnpm build
```

## Ubuntu VM deployment

GitHub Actions runs checks on each pull request and each push to `main`, `stage`, or `prod`.
Only `prod` deploys automatically to the school VM.
Nginx serves the production client over HTTP. Each browser keeps its Projects in IndexedDB.

Use the [deployment guide](docs/tech/deployment.md) for Ubuntu 24.04 setup, GitHub settings, deployment, and rollback.
