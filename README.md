# Fleet Transition Planner

A browser-based simulation for fleet operators to compare vehicle electrification schedules, charging strategies, costs, emissions, and depot feasibility. The product is planned; the current implementation is a pnpm monorepo starter with a React/TypeScript 3D client and minimal Fastify/Drizzle server.

The starter is a generic scene-editor architecture demo: select a plane or cube in the viewport, edit it through collapsible sidebar modules, and undo or redo changes. It contains no product-specific functionality.

Project documentation is indexed in [docs/README.md](docs/README.md).

## Prerequisites

Required:

- [Node.js](https://nodejs.org/en/download). The local verification environment uses Node.js 26.5.0; other versions are not established by this setup.
- pnpm **11.24.0**, pinned in `package.json`. After installing Node.js, install the matching version with:

  ```bash
  npm install --global pnpm@11.24.0
  ```

- [Git](https://git-scm.com/downloads), if you need to clone the repository.
- A browser with WebGL enabled to use the interactive 3D scene.

Verify the required tools from a new terminal:

```bash
node --version
pnpm --version
```

Ensure pnpm reports `11.24.0` and ports `5173` and `3001` are available for the development servers.

Required development/build targets are Ubuntu 24.04, macOS Tahoe, and Windows 11. Server deployment and testing must at minimum support Ubuntu 24.04. These targets are not a claim that all platforms have been tested; record platform evidence in the project handoff. The commands below work in PowerShell and POSIX shells unless labeled otherwise.

## Development

Clone the repository and install locked dependencies:

```bash
git clone https://github.com/The-Sims-Digipen/Fleet-Project.git
cd Fleet-Project
pnpm install --frozen-lockfile
```

### Environment configuration

The current demo runs without a database or `.env` file and defaults to API port `3001`. For local overrides, copy the server template:

PowerShell (Windows):

```powershell
Copy-Item apps/server/.env.example apps/server/.env
```

Ubuntu/macOS:

```bash
cp apps/server/.env.example apps/server/.env
```

Edit `PORT` and, when working on persistence, `DATABASE_URL` in `apps/server/.env`. Its sample database URL is a local placeholder, not a provisioned database. Drizzle commands require `DATABASE_URL` and database access, but the schema is currently empty and no migration is needed to run the demo. Never commit local environment files or credentials; retain safe `.env.example` templates.

### Run and verify

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

This runs type checking, Vitest tests, and both production builds. Individual checks are available as `pnpm typecheck`, `pnpm test`, and `pnpm build`; start either application separately with `pnpm dev:client` or `pnpm dev:server`. Browser interaction and WebGL rendering still require real-browser checks.

Initial setup verification on 2026-09-10 in the local Windows environment (Node.js 26.5.0, pnpm 11.24.0): `pnpm verify` passed type checking, all 13 tests, and both production builds. Vite reported a non-failing warning for the large 3D scene chunk. Ubuntu/macOS builds, clean-environment installation, deployment, and browser visual checks were not performed in this verification.

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

Deployment and CI/CD are not configured by this initial setup. Publishing these changes, inviting `giraphics`, and updating the instructor's Excel sheet remain tracked in the [handoff checklist](docs/deliverables.md#outstanding-handoff-steps).
