# F04 — Planning workspace and analytics interface

**Owner:** Dayton  
**Active:** M1 W02-M2 W04

## What this feature must accomplish

A user can build/edit a fleet and transition plan, change assumptions, scrub years, and understand the complete calculated result without leaving the planning workspace.

## Required behavior

- fleet table/list, preset management controls, vehicle editor, multi-select/bulk transition controls, and filtering/grouping UI;
- project-wide and scenario-specific assumption controls with units and validation, including fuel price, electricity price, vehicle purchase/lease economics, maintenance, charger CAPEX/tariffs, ownership/residual assumptions, and analysis period where applicable;
- transition-year timeline/scrubber and annual fleet roadmap;
- result cards and charts for TCO, CAPEX, OPEX, payback, energy, emissions, and fleet composition;
- selected-vehicle details, empty states, invalid-input states, and last-valid-result behavior;
- responsive panel layout where required controls remain reachable on smaller screens;
- keyboard/label/error handling for implemented controls;
- direct binding to shared domain/simulation state rather than duplicated local calculation logic.

### Workspace structure
Implement Plan UI around shared state/operations. Required sections: fleet table/list and filters; preset/vehicle editors; bulk target/year controls; project/scenario assumptions; selected-year control; roadmap; financial/energy/emissions result cards/charts; selected item details and warnings.

### State rules
Forms may hold local invalid drafts, but committed values live in the canonical domain store. Never reproduce TCO/ranking/feasibility formulas in components. Changing selected year only changes annual projection/view, not schedules.

### Charts and values
Show units and baseline meaning. Required views include TCO/CAPEX/OPEX/payback, annual/cumulative cost, emissions, energy/fuel, fleet composition/transition roadmap, and appropriate null/not-reached explanations. Terminal residual must not be visually confused with ordinary cumulative operating cash flow.

### Interaction
Support search/filter/group/sort/multiselect and accessible bulk actions. Shared project assumptions must be visibly distinguished from scenario-owned inputs. Keep all implemented controls reachable on smaller supported screens.

## Related implementation docs

- [Annual simulation model](../../tech/simulation.md)
- [Product design](../../design/product-design.md)
