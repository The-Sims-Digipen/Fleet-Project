# 3D App Starter

A neutral pnpm monorepo starter. It includes a React, TypeScript, Vite, Tailwind CSS, and React Three Fiber client plus a minimal Fastify and Drizzle server setup.

The starter UI deliberately contains no product functionality: it renders a single 3D plane beside a collection of example form controls.

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
