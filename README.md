# Fleet Transition Planner

A browser-based fleet electrification planning project covering transition schedules, charging strategies, costs, emissions, and depot feasibility.

**Current implementation:** an in-memory 3D scene-editor prototype and basic Fastify API. The product features described in the documentation are the M1–M6 delivery scope.

The scene editor creates procedural `THREE.Group` models from a typed developer catalog. Add/delete instances, edit transforms, optionally override their generated materials, and undo/redo edits. The starter object is a multi-part low-poly van. See [registering models](docs/tech/extending-the-editor.md) to add another procedural model without changing viewport code.

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

Required development/build targets are Ubuntu 24.04, macOS Tahoe, and Windows 11. Server deployment and testing must at minimum support Ubuntu 24.04. The verified local environment is listed below. The commands below work in PowerShell and POSIX shells unless labeled otherwise.

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

Edit `PORT` in `apps/server/.env` to change the API port. The current prototype does not use a database. Drizzle commands require a configured `DATABASE_URL` and an accessible PostgreSQL database; the example URL does not create one. Local environment files and credentials are excluded from version control.

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

Typed-model verification on 2026-09-11 (Windows): client TypeScript check, all 26 client tests, and the client production build passed using the installed `tsc`, `vitest`, and `vite` binaries directly from `apps/client/node_modules/.bin`. The pinned pnpm launcher's registry verification was unavailable, so dependency installation and `pnpm verify` were not repeated. Real-browser checks confirmed multiple instances, independent tint, material restoration, child-mesh picking, and orbiting without selection changes. No browser errors were logged; Three.js emitted a clock deprecation warning. Vite retained a non-failing large-chunk warning. Server and cross-platform checks were not repeated for this client-only change.

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
test