# Source requirements cross-check

This file captures requirements from the supplied project briefs so future edits do not accidentally remove scope while simplifying team-facing documentation.

## Supplied sources

- `docs/pdf/Industry_Project_Opportunities_Student_Invitation.pdf` - Project 1 on page 3 plus the shared browser/3D framing on pages 1-2.
- `docs/docx/DigiPen_Upsight_Detailed_Project_1-3.docx` - shared Project 3 requirements and Theme 1 Fleet Transition Planner.

## Non-negotiable product requirements retained in the project docs

- Browser-based application; not a downloaded app and not a Unity/Unreal project.
- Real decision-support application, clearly labelled as a simulation, using realistic synthetic/historical data unless approved real data is provided.
- Interactive scenario environment where changing assumptions/choices immediately changes outputs.
- Custom-built scenario/simulation component satisfying the project requirement.
- Explainable recommendations/results and same-screen comparison of alternatives.
- 3D is central to the product: the depot shows parking/layout, vehicles, chargers/infrastructure, and changes with the selected transition year.
- Site power demand/connection capacity is visible; overload must be obvious in the 3D view and also communicated in text.
- Users can create/select a sample fleet; inspect vehicle attributes; select individuals, arbitrary combinations, and categories/groups; schedule transition years; and test staged adoption such as 25/50/75/100%.
- Users can compare depot, external, and mixed charging strategies and edit major economic/charging assumptions.
- Simulation outputs include fleet TCO, transition CAPEX, annual operating cost, baseline difference, per-vehicle/per-km values where meaningful, payback/breakeven, transitions by year, charging infrastructure/cost, charging mix, fuel/energy, emissions, suitability ranking, transition roadmap, and assumption-impact visibility.
- Suitability remains transparent and considers daily distance/range, route predictability, charging/depot return, dwell time, replacement timing, utilisation/mileage, and economics.
- Scenario comparison includes alternatives such as A now vs B next year, ordering changes, fast vs gradual transition, charging-strategy changes, +/-20% fuel/electricity prices, and charger timing changes.
- The model is indicative rather than engineering-grade. Do not over-scope into exhaustive tax/subsidy/financing detail, detailed route optimisation, citywide energy simulation, or utility-grade electrical modelling.
- The product should be reusable as a foundation for a future ChargedUp Nexus module rather than a one-off scripted visualisation.
- M3 is the MVP milestone under the course schedule; every technical team member needs substantial, independently visible implementation ownership.

## Source-to-current-design interpretation

The source briefs describe petrol/diesel-to-EV transition because that is the business example. The current architecture intentionally generalizes this to user-defined vehicle presets and any current-preset -> target-preset transition. The EV transition use cases above must still work exactly as examples of the generic model.

The freeform depot editor, persistent project/scenario storage, generic preset system, and detailed reliability requirements are project decisions/extensions that support the source goals without removing them.
