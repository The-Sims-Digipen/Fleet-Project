# F09 — Charging strategy and feasibility engine

**Owner:** Elijah  
**Active:** M3 W01–M5 W02

## What this feature must accomplish

All charging strategy and feasibility changes propagate through costs, warnings, timeline state, comparison, and 3D overlays from one shared calculation path.

## Required behavior

- depot/external/mixed charging allocation;
- charger inventory, rated power, cost, quantity, location reference, and installation timing;
- annual energy requirement/allocation and charging operating cost;
- one-time infrastructure CAPEX and installation-year availability;
- connection-limit demand checks and overload amount/year;
- dwell-time, charging-window, charger-readiness, and infrastructure-availability checks;
- consumption of depot space/layout issues from the geometry/editor subsystem;
- structured feasibility output containing severity, affected year/objects/vehicles, and human-readable reason;
- unit/reference cases for strategy swaps, charger delays, capacity changes, and infeasible-but-costed plans.

### Engine boundary
Extend the deterministic simulation path rather than creating UI-only feasibility calculations. Input: projected vehicle state, charging strategy/tariffs, charger instances/install years, site connection, depot assignments and geometry issues. Output: annual charging energy/cost/capacity plus structured issues.

### Required calculations/issues
Implement charging allocation, shared dwell window, required kW, installed kW, nameplate overload, installation-year readiness, range/access/dwell conditions, and layout issue propagation. Keep infeasible plans costed.

### Structured issue schema
At minimum expose code, severity, year, affected IDs, message, and numeric context useful to Plan/Compare/3D. Consumers must not parse human-readable messages to recover logic.

### Tests
Use the SIM03 charging fixture and dedicated tests for strategy swap, external/depot access, zero dwell, no chargers, delayed installation, capacity/site limit changes, range exceedance, annual/daily mismatch, unassigned vehicles, and imported layout issues.

## Related implementation docs

- [Annual simulation model](../../tech/simulation.md)
