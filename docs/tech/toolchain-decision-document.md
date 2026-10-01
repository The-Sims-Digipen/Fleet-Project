# Toolchain Decision Document

**Project:** Fleet Transition Planner  
**Team:** The Sims  
**Milestone:** M1  
**Version:** 1.0  
**Date:** 1 October 2026

## 01. Purpose and selected tools

This document records the tools selected for the Fleet Transition Planner.
Each tool has a defined purpose and a reason for its selection.
The comparisons use documented capabilities and the current implementation.

The document distinguishes current tools from planned database work.
Each numbered section can form one page in Canva.
The appendices provide versions, source references and technical terms.

| Area | Selected tool | Status |
|---|---|---|
| Target platform | Desktop browser | Current |
| Programming language | TypeScript | Current |
| User interface | React | Current |
| Development and build | Vite | Current |
| Interface styles | Tailwind CSS | Current |
| Application state | Zustand | Current |
| 3D views | Three.js, React Three Fiber and Drei | Current |
| Financial charts | ECharts and echarts-for-react | Current |
| Product database | PostgreSQL | Planned product integration |
| Package management | pnpm workspaces | Current |
| Automated tests | Vitest and Testing Library | Current |
| AI assistance | Codex, Claude and GitHub Copilot | Used by the team |

## 02. Required platform: desktop browser

**Decision:** Use a desktop browser as the target platform.

The client requires a browser application.
This requirement determines the platform choice.

Users operate the planning controls with a keyboard and pointer.
The browser displays forms, financial charts and the 3D Depot.
The 3D view requires WebGL support.

The browser platform keeps the planning controls and 3D views in one application.
Users access the application through a URL.

## 03. Programming language: TypeScript

**Decision:** Use TypeScript for application code and calculations.

[TypeScript](https://www.typescriptlang.org/docs/handbook/intro.html) adds static type checks to JavaScript.
These checks help identify incompatible values and interfaces before a build completes.

The application defines types for Projects, Vehicles, Vehicle Presets and Scenarios.
The interface, state commands and calculation engine use these types.
This gives the modules a common data contract.

The calculation engine also uses TypeScript.
It calculates Scenario results from the Project inputs.
The calculations and Vehicle views use the same rules for the selected year.

## 04. User interface: React

**Decision:** Use React to build the user interface.

[React](https://react.dev/learn) defines an interface through components.
The application uses components for fleet inputs, Scenario controls, timelines and results.
Components connect these controls to Project state.

This structure lets the team develop separate feature panels.
The application combines the panels in the Project workspace.
Shared controls keep repeated interactions consistent.

React also connects the interface to React Three Fiber.
The forms and 3D views can respond to the same Project changes.

## 05. Development and build: Vite

**Decision:** Use Vite for local development and client builds.

[Vite](https://vite.dev/guide/) provides a development server and a production build command.
The application uses its React and Tailwind plugins.
These plugins process the component code and interface styles.

The client configuration defines the local development port and plugin settings.
The build produces browser application files.
TypeScript checks run before the client build.

This choice keeps development and build settings in a defined project configuration.

## 06. Interface styles: Tailwind CSS

**Decision:** Keep Tailwind CSS for the custom planning interface.

[Tailwind CSS](https://tailwindcss.com/docs/styling-with-utility-classes) provides utility classes for layout, spacing, colors and control states.
The team combines these classes directly in React components.
Custom values permit precise control of the editor layout.

This flexibility fits the application panels, input groups, toolbars and comparison columns.
The team can change a control's layout without adopting a complete component design.
Shared tokens define repeated colors and fonts.

### Comparison: Tailwind CSS, Bootstrap and shadcn/ui

| Approach | What it provides | Application consideration |
|---|---|---|
| Tailwind CSS | Utility classes and custom values for interface styles. | The team defines the controls and their behavior. Styles stay close to component code. |
| [Bootstrap](https://getbootstrap.com/docs/5.3/customize/overview/) | Styled components, layout utilities and theme settings. | The team would adapt its components and styles to the current editor design. |
| [shadcn/ui](https://ui.shadcn.com/docs) | Editable component source with Tailwind styles. | The team would adapt these components to Project commands and edit behavior. |

Bootstrap permits customization through Sass and CSS variables.
[shadcn/ui themes](https://ui.shadcn.com/docs/theming) also use CSS variables and Tailwind.
Thus, shadcn/ui can form part of a Tailwind interface.

The current product imports the shared UI theme.
Its feature panels use local controls.
Tailwind gives these controls direct style and layout control.
The selected approach keeps the current Project edit behavior.

## 07. Application state: Zustand

**Decision:** Use Zustand for Project and application state.

[Zustand](https://zustand.docs.pmnd.rs/learn/getting-started/introduction) provides stores that React components can read and update.
The application separates Project state from general interface state.

The Project store owns the editable Project document and its runtime state.
Application code manages edit history, save status and unsaved changes above the store.
General interface state includes the workspace mode and sidebar expansion.

One Project owns one physical environment.
Its Scenarios contain transition plans over the same Vehicles.
Calculations, charts and 3D views derive their values from the Project inputs.

This ownership keeps the feature panels connected to one editable Project.

## 08. 3D views: Three.js, React Three Fiber and Drei

**Decision:** Keep the current browser 3D stack.

| Tool | Purpose |
|---|---|
| [Three.js](https://github.com/mrdoob/three.js) | Draw Depot and Vehicle geometry in the browser. |
| [React Three Fiber](https://github.com/pmndrs/react-three-fiber) | Express Three.js scenes through React components. |
| [Drei](https://drei.docs.pmnd.rs/controls/introduction) | Provide camera controls and other scene helpers. |

The current views provide camera movement, Vehicle selection and selection highlights.
They display the effective Vehicle state for the selected Scenario and year.
They use the same Project inputs as the planning controls.

### Comparison: Three.js stack, Unity and Unreal Engine

| Approach | Browser path | Application consideration |
|---|---|---|
| Three.js stack | Draw the scene inside the React browser application. | The team keeps the current interface, scene components and Project data connections. |
| [Unity](https://docs.unity3d.com/Manual/webgl-intro.html) | Produce a Unity Web build for browser execution. | The team would maintain an engine project and connect it to the planning interface. |
| [Unreal Engine](https://dev.epicgames.com/documentation/en-us/unreal-engine/pixel-streaming-in-unreal-engine) | Pixel Streaming connects browser users to a packaged engine application. | This path needs an engine host and streaming services. |

Unity supports browser builds.
Its [browser scripting interface](https://docs.unity3d.com/Manual/webgl-interactingwithbrowserscripting.html) can connect engine code to browser code.
Unreal Pixel Streaming also permits browser interaction.
It runs the engine application on a desktop or server.

The current product needs fleet views, camera controls and selection.
The selected stack already provides these functions inside the React application.
This keeps scene updates connected to the Project edit and calculation workflow.

## 09. Financial charts: ECharts

**Decision:** Keep ECharts with the echarts-for-react wrapper.

The charts display annual costs, cumulative costs and annual savings.
Compare displays results for two Scenarios.
All chart values come from the calculation engine.

### Comparison: ECharts and Chart.js

| Area | ECharts | Chart.js |
|---|---|---|
| Required charts | Provides line and bar charts. | Provides line and bar charts. |
| Drawing method | Supports Canvas and SVG. The current charts use SVG. | Uses Canvas for standard chart drawing. |
| Current integration | Uses echarts-for-react and existing financial chart settings. | Would require a chart integration and chart settings for this application. |

The [ECharts renderer guide](https://echarts.apache.org/handbook/en/best-practices/canvas-vs-svg/) describes its Canvas and SVG options.
[Chart.js](https://www.chartjs.org/docs/latest/) is also a suitable chart library.

The current ECharts integration displays the required Scenario results.
Keeping it preserves the existing chart settings and calculation connections.

## 10. Planned product database: PostgreSQL

**Decision:** Use PostgreSQL as the planned product database.

The team selected PostgreSQL for the future Project save workflow.
That workflow is not active in the M1 browser application.
This decision records the database direction, not completed product integration.

[PostgreSQL](https://www.postgresql.org/about/) provides transactions, constraints and structured queries.
These functions can help protect related Project records during save operations.
The database also provides document fields for nested Project data.

The database server version is not pinned in the repository.

## 11. Package management: pnpm workspaces

**Decision:** Keep pnpm for the application workspace.

[pnpm workspaces](https://pnpm.io/workspaces) connect the applications and shared packages.
The repository uses explicit local package references and one lock file.
The root commands run checks and builds across these packages.

Node.js runs the development tools.
The repository selects Node.js major version 24 and pnpm version 11.24.0.

### Comparison: pnpm and npm workspaces

| Area | pnpm | npm workspaces |
|---|---|---|
| Local packages | Supports workspace packages and explicit local references. | Supports workspace packages and local links. |
| Fixed dependency installation | Uses `pnpm install --frozen-lockfile`. | Uses `npm ci` with an npm lock file. |
| Current fit | Existing package definitions and commands use pnpm. | A change would require workspace, lock file and command updates. |

[npm workspaces](https://docs.npmjs.com/cli/v11/using-npm/workspaces/) can also manage the local packages.
[npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/) checks its lock file against the package definitions.

Keeping pnpm preserves the current local package links and workspace commands.
The [frozen lock file option](https://pnpm.io/cli/install) prevents installation from changing the selected dependency versions.

## 12. Automated tests: Vitest and Testing Library

**Decision:** Keep Vitest and Testing Library for automated tests.

[Vitest](https://vitest.dev/guide/) runs domain, state and interface tests.
[Testing Library](https://testing-library.com/docs/react-testing-library/intro/) checks interface behavior through controls and user actions.
The interface tests use jsdom to represent browser document APIs.

The build and test configurations use the same React plugin.
They have separate configuration files.
TypeScript checks run separately from the tests.

### Comparison: Vitest and Jest

| Area | Vitest with Testing Library | Jest with Testing Library |
|---|---|---|
| React interface checks | Uses Testing Library. | Can use the same Testing Library. |
| TypeScript test code | Uses Vite transformation tools. | Can use Babel or ts-jest. |
| Current fit | Existing tests use Vitest assertions, mocks and test hooks. | A change would require test settings and changes to Vitest-specific calls. |

[Jest](https://jestjs.io/docs/getting-started) supports TypeScript and React test workflows.
The current test code and React plugin integration give Vitest a direct fit.

Interface tests check controls and state changes.
Real browser checks remain necessary for WebGL drawing and camera behavior.

## 13. AI assistance

**Decision:** Use Codex, Claude and GitHub Copilot as development aids.

The team used all three tools for planning, code generation and documentation.

| Tool | Confirmed use |
|---|---|
| Codex | Plan implementation, generate code and prepare documentation. |
| Claude | Plan implementation, generate code and prepare documentation. |
| GitHub Copilot | Plan implementation, generate code and prepare documentation. |

These tools help the team prepare plans, code and document drafts.
Team members remain responsible for the final work.
Project tests and technical review provide the checks for generated changes.

## Appendix A. Recorded versions

The values below describe the repository on 1 October 2026.
Package versions come from the lock file.
They do not identify the latest public releases.

| Tool or package | Recorded version |
|---|---|
| Node.js | Major 24. The package definition permits 22.13.0 or later. |
| pnpm | 11.24.0 |
| TypeScript | 5.9.3 |
| React and React DOM | 19.2.8 |
| Vite | 8.2.2 |
| Vite React plugin | 6.1.1 |
| Tailwind CSS and its Vite plugin | 4.3.3 |
| Zustand | 5.0.15 |
| Three.js | 0.185.1 |
| React Three Fiber | 9.7.0 |
| Drei | 10.7.8 |
| ECharts | 6.1.0 |
| echarts-for-react | 3.0.6 |
| Vitest | 4.1.11 |
| Testing Library React | 16.3.3 |
| jsdom | 30.0.1 |
| PostgreSQL server | Not pinned. Product integration is planned. |

## Appendix B. Repository references

| Reference | Evidence |
|---|---|
| [Product definition](../proposal.md) | Product purpose, browser workflow and M1 features. |
| [Architecture](architecture.md) | Current modules, state ownership and shared UI use. |
| [Project contracts](contracts.md) | Project data and calculation boundaries. |
| [Simulation](simulation.md) | Team-built calculations and model limits. |
| [Root package definition](../../package.json) | Workspace commands and pnpm version. |
| [Node.js selection](../../.nvmrc) | Node.js major version. |
| [Client package definition](../../apps/client/package.json) | Client tools and scripts. |
| [Dependency lock file](../../pnpm-lock.yaml) | Selected package versions. |
| [Vite configuration](../../apps/client/vite.config.ts) | React and Tailwind plugins. |
| [Vitest configuration](../../apps/client/vitest.config.ts) | Test environment and React plugin. |
| [3D view](../../apps/client/src/components/WorldScene.tsx) | Scene, camera and Project state connections. |
| [Financial charts](../../apps/client/src/components/CostAnalysis.tsx) | Calculation outputs and SVG chart settings. |
