# Implementation features

## Scope boundaries
- Single-user local application; no account system or public service hosting is required.
- No live telemetry/charger control, route optimisation, or citywide energy simulation.
- No engineering-grade electrical/civil model, CAD/GIS/terrain import, cable routing, or automatic depot optimisation.
- No exhaustive tax, subsidy, financing, regional preset, or advanced sensitivity/uncertainty model in M1-M6.
- CSV/PDF export and production ChargedUp Nexus integration are not committed deliverables.
- Keep the implementation reusable enough to support a future Nexus module without coupling it to a one-off demo.

## Features
| Feature | Implementation | Active |
|---|---|---|
| [F01](./F01%20-%20Core%20application%20platform%20and%20integration%20architecture.md) | Core application platform and integration architecture | M1 W01-W04, then integration changes as required |
| [F02](./F02%20-%20Vehicle%20preset%2C%20fleet%2C%20and%20transition%20domain%20system.md) | Vehicle preset, fleet, and transition domain system | M1 W01-M2 W03 |
| [F03](./F03%20-%20Financial%2C%20energy%2C%20and%20emissions%20simulation%20engine.md) | Financial, energy, and emissions simulation engine | M1 W01-M2 W04 |
| [F04](./F04%20-%20Planning%20workspace%20and%20analytics%20interface.md) | Planning workspace and analytics interface | M1 W02-M2 W04 |
| [F05](./F05%20-%20Data-driven%203D%20digital%20twin%20and%20viewport%20interaction.md) | Data-driven 3D digital twin and viewport interaction | M1 W02-M3 W04 |
| [F06](./F06%20-%20Production%203D%20asset%20library%20and%20runtime%20asset%20pipeline.md) | Production 3D asset library and runtime asset pipeline | M1 W01-M5 W03 |
| [F07](./F07%20-%20Project%20and%20scenario%20persistence%20backend.md) | Project and scenario persistence backend | M1 W01-M2 W04 |
| [F08](./F08%20-%20Project%20and%20scenario%20workflow%20integration.md) | Project and scenario workflow integration | M2 W01–W04 |
| [F09](./F09%20-%20Charging%20strategy%20and%20feasibility%20engine.md) | Charging strategy and feasibility engine | M3 W01–M5 W02 |
| [F10](./F10%20-%20Scenario%20comparison%20and%20decision%20analytics.md) | Scenario comparison and decision analytics | M3 W01-W04 |
| [F11](./F11%20-%20Vehicle%20suitability%20and%20recommendation%20engine.md) | Vehicle suitability and recommendation engine | M3 W01–M5 W02 |
| [F12](./F12%20-%20Dynamic%20scenario%20visualization%20and%20dual-scene%20comparison.md) | Dynamic scenario visualization and dual-scene comparison | M3 W02–M4 W01 |
| [F13](./F13%20-%20Freeform%20depot%20geometry%20and%20edit-history%20engine.md) | Freeform depot geometry and edit-history engine | M4 W01-W04 |
| [F14](./F14%20-%203D%20depot%20authoring%20tools.md) | 3D depot authoring tools | M4 W01-W04 |
| [F15](./F15%20-%20Depot%20editor%20panels%2C%20assignments%2C%20and%20issue%20workflow.md) | Depot editor panels, assignments, and issue workflow | M4 W02–M5 W01 |
| [F16](./F16%20-%20Scenario%20layout%20persistence%20and%20isolation.md) | Scenario layout persistence and isolation | M4 W01-W04 |
| [F17](./F17%20-%20End-to-end%20feasibility%20and%20recommendation%20integration.md) | End-to-end feasibility and recommendation integration | M5 W01–W03 |
| [F18](./F18%20-%20Responsive%2C%20accessible%2C%20and%20failure-resilient%20application%20UI.md) | Responsive, accessible, and failure-resilient application UI | M5 W01-M6 W02 |
| [F19](./F19%20-%20Backend%20reliability%2C%20migrations%2C%20and%20platform%20hardening.md) | Backend reliability, migrations, and platform hardening | M5 W02–M6 W02 |
| [F20](./F20%20-%20Rendering%20and%20asset%20performance%20optimization.md) | Rendering and asset performance optimization | M5 W01-M6 W02 |
| [F21](./F21%20-%20Simulation%20and%20application%20performance%20engineering.md) | Simulation and application performance engineering | M5 W02-M6 W03 |
| [F22](./F22%20-%20Full%20technical%20regression%20and%20release%20integration.md) | Full technical regression and release integration | M6 W01-W04 |
