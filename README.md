# Fleet Transition Planner

A browser-based fleet electrification planning project with an interactive Three.js depot editor, reusable vehicle presets, separate project/world/scenario persistence, and a Fastify API backed by PostgreSQL.

Project documentation is indexed in [docs/README.md](docs/README.md).

## Stack

- React + TypeScript + Vite + Tailwind
- Three.js + React Three Fiber + Drei
- Zustand
- Fastify + Zod
- PostgreSQL + Drizzle
- Vercel + Neon for hosted deployment

## Prerequisites

- Node.js 20+
- pnpm **11.24.0** (pinned in `package.json`)
- Git

Install pnpm if required:

```bash
npm install --global pnpm@11.24.0
```

## Local development

Install dependencies:

```bash
pnpm install --frozen-lockfile
```

The application now expects PostgreSQL for project persistence. The recommended development database is the same Neon database connected to the Vercel project.

### Pull Neon credentials from Vercel

After the Vercel project has been linked and Neon has been installed:

```bash
vercel link
vercel env pull apps/server/.env
pnpm db:migrate
```

`apps/server/.env` is gitignored. It should contain the pooled Neon `DATABASE_URL` injected by the Vercel integration.

Alternatively, copy the template and set `DATABASE_URL` manually:

```bash
cp apps/server/.env.example apps/server/.env
```

On PowerShell:

```powershell
Copy-Item apps/server/.env.example apps/server/.env
```

Start both applications:

```bash
pnpm dev
```

- Client: http://localhost:5173
- API: http://localhost:3001
- API health: http://localhost:3001/health
- Database readiness: http://localhost:3001/api/v1/ready

The Vite dev server proxies `/api` and `/health` to Fastify, so browser code uses the same relative API paths locally and on Vercel.

## Verification

```bash
pnpm verify
```

Individual commands:

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm db:migrate
```

## Vercel + Neon deployment

The repository is configured as one Vercel deployment:

- `apps/client` builds to static Vite output.
- `/api/*` is served by the existing Fastify application as a Vercel Function.
- Neon supplies `DATABASE_URL` through the Vercel Marketplace integration.
- Production builds automatically run committed PostgreSQL migrations before building the applications.

### First deployment

1. Import this repository into Vercel.
2. Install **Neon** from the Vercel Marketplace and connect the database resource to the project.
3. Confirm that the integration supplied `DATABASE_URL` for Production.
4. Deploy/redeploy the Production deployment.

The production build runs `pnpm db:migrate` automatically, so a newly provisioned Neon database is initialized without manually running SQL.

The same setup can be started from the Vercel CLI after linking the repository:

```bash
vercel link
vc i neon/neon
vercel --prod
```

### Preview deployments

Database migrations are deliberately skipped for Preview deployments by default so a preview cannot accidentally migrate the production database. If preview deployments are later connected to isolated Neon preview branches, set:

```text
RUN_MIGRATIONS=1
```

for the Preview environment so each branch applies the same committed migrations automatically.

## Persistence model

The database stores separate resources rather than embedding the 3D world in each scenario:

```text
Project ── world_id ──> World
   │                    ↑
   └─ project_scenarios │ world_id
              │         │
              └────> Scenario
```

- **World** owns persistent 3D objects, transforms, appearance and scene settings.
- **Scenario** is saved separately but is permanently bound to one `world_id`.
- **Project** references one world and links one or more scenarios that use that same world.
- `project_scenarios` has database foreign-key constraints that prevent cross-world scenario links.
- Vehicle presets are project data.
- Camera state, selection, gizmo mode, undo history and calculated results are not persisted.

A single **Save Project** action writes the project, shared world and linked scenarios atomically while PostgreSQL still stores them as separate resources.
