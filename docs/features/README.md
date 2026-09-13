# Implementation features

## Scope boundaries
- Single-user local application; no account system or public service hosting is required.
- No live telemetry/charger control, route optimisation, or citywide energy simulation.
- No engineering-grade electrical/civil model, CAD/GIS/terrain import, cable routing, or automatic depot optimisation.
- No exhaustive tax, subsidy, financing, regional preset, or advanced sensitivity/uncertainty model in M1-M6.
- CSV/PDF export and production ChargedUp Nexus integration are not committed deliverables.
- Keep the implementation reusable enough to support a future Nexus module without coupling it to a one-off demo.

## Features
| Feature | Implementation | Owner | Active |
|---|---|---|---|
| [F01](./F01-core-application-platform-and-integration-architecture/README.md) | Core application platform and integration architecture | Shee Yang | M1 W01-W04, then integration changes as required |
| [F02](./F02-vehicle-preset-fleet-and-transition-domain-system/README.md) | Vehicle preset, fleet, and transition domain system | Zhi Kai | M1 W01-M2 W03 |
| [F03](./F03-financial-energy-and-emissions-simulation-engine/README.md) | Financial, energy, and emissions simulation engine | Elijah | M1 W01-M2 W04 |
| [F04](./F04-planning-workspace-and-analytics-interface/README.md) | Planning workspace and analytics interface | Dayton | M1 W02-M2 W04 |
| [F05](./F05-data-driven-3d-digital-twin-and-viewport-interaction/README.md) | Data-driven 3D digital twin and viewport interaction | Wei Jun | M1 W02-M3 W04 |
| [F06](./F06-production-3d-asset-library-and-runtime-asset-pipeline/README.md) | Production 3D asset library and runtime asset pipeline | Jarrel | M1 W01-M5 W03 |
| [F07](./F07-project-scenario-persistence-backend/README.md) | Project/scenario persistence backend | Brandon | M1 W01-M2 W04 |
| [F08](./F08-project-and-scenario-workflow-integration/README.md) | Project and scenario workflow integration | Dayton | M2 W01–W04 |
| [F09](./F09-charging-strategy-and-feasibility-engine/README.md) | Charging strategy and feasibility engine | Elijah | M3 W01–M5 W02 |
| [F10](./F10-scenario-comparison-and-decision-analytics/README.md) | Scenario comparison and decision analytics | Dayton | M3 W01-W04 |
| [F11](./F11-vehicle-suitability-and-recommendation-engine/README.md) | Vehicle suitability and recommendation engine | Zhi Kai | M3 W01–M5 W02 |
| [F12](./F12-dynamic-scenario-visualization-and-dual-scene-comparison/README.md) | Dynamic scenario visualization and dual-scene comparison | Wei Jun | M3 W02–M4 W01 |
| [F13](./F13-freeform-depot-geometry-and-edit-history-engine/README.md) | Freeform depot geometry and edit-history engine | Shee Yang | M4 W01-W04 |
| [F14](./F14-3d-depot-authoring-tools/README.md) | 3D depot authoring tools | Wei Jun | M4 W01-W04 |
| [F15](./F15-depot-editor-panels-assignments-and-issue-workflow/README.md) | Depot editor panels, assignments, and issue workflow | Dayton | M4 W02–M5 W01 |
| [F16](./F16-scenario-layout-persistence-and-isolation/README.md) | Scenario layout persistence and isolation | Brandon | M4 W01-W04 |
| [F17](./F17-end-to-end-feasibility-and-recommendation-integration/README.md) | End-to-end feasibility and recommendation integration | Shee Yang | M5 W01–W03 |
| [F18](./F18-responsive-accessible-and-failure-resilient-application-ui/README.md) | Responsive, accessible, and failure-resilient application UI | Dayton | M5 W01-M6 W02 |
| [F19](./F19-backend-reliability-migrations-and-platform-hardening/README.md) | Backend reliability, migrations, and platform hardening | Brandon | M5 W02–M6 W02 |
| [F20](./F20-rendering-and-asset-performance-optimization/README.md) | Rendering and asset performance optimization | Wei Jun | M5 W01-M6 W02 |
| [F21](./F21-simulation-and-application-performance-engineering/README.md) | Simulation and application performance engineering | Shee Yang | M5 W02-M6 W03 |
| [F22](./F22-full-technical-regression-and-release-integration/README.md) | Full technical regression and release integration | Shee Yang | M6 W01-W04 |
