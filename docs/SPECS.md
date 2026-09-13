# Fleet Transition Planner

## Purpose and scope

Help fleet operators decide which vehicles should transition first, what user-defined vehicle preset they should transition to, when to transition them, and how those choices affect whole-fleet cost and emissions. Provide a decision-support product with clear, reusable calculation components.

A fleet of 100 vans with different ages and daily distances is an illustrative scenario, not a fixed fleet size or vehicle-type restriction. Vehicle utilisation, replacement timing and charging access can make different transition choices appropriate for different vehicles.


## Platform and simulation

- Run as a normal browser-based application, not a downloaded application or a Unity/Unreal project.
- Clearly label the experience as a simulation. Use realistic synthetic or historical data unless ChargedUp approves other data.
- Include a custom-built scenario engine that immediately recalculates fleet costs, payback, emissions and transition priority when vehicle selections, transition years, charging strategies or assumptions change.
- Use clearly defined fleet, economic, and charging inputs. Keep important assumptions visible and editable, with explanations of why results change and which factors drive recommendations.
- Keep calculations and interactions responsive under repeated changes. Charts and comparisons must be understandable and trustworthy to a non-technical professional; results are indicative, without claiming engineering precision.
- Keep the domain model and scenario engine reusable as a foundation for a future ChargedUp Nexus module rather than a one-off scripted demo.

## Fleet and transition planning

- Let users create reusable **user-defined vehicle presets** containing technical and economic parameters, then create or select a sample fleet whose individual vehicles reference those presets. Provide a vehicle list showing the fleet and its operational attributes.
- Support selecting individual vehicles, arbitrary combinations or categories, such as vehicle type, age or suitable routes. Assign both a **target vehicle preset** and transition year to each selected vehicle or group. Unscheduled vehicles continue using their current preset. The application must not hard-code diesel-to-electric as the only transition path.
- Support staged adoption, such as 25%, 50%, 75% and 100%, and comparison of rapid transition with gradual replacement. These percentages are examples, not prescribed stages.
- Include a simple vehicle/route suitability ranking to inform transition priority. Consider daily distance against the selected target preset's usable range where applicable, route predictability, depot return and charging access, available dwell time, replacement timing, utilisation and economics. Explain the reasons; no particular scoring formula or sophisticated routing model is required.
- Let users choose and compare depot charging, external charging networks and a mixture of both. Include charger quantity, type and installation year so infrastructure timing affects the transition business case.

## 3D depot and scenario interaction

The centre of the application is an interactive 3D depot model acting as a digital twin of a real place. Show the parking layout and bays, vehicles in their bays, charging infrastructure and installed charger locations. Provide camera control so users can inspect the depot.

Users scrub through transition years to see each vehicle change from its current preset to its scheduled target preset and chargers appear according to the plan. Show the selected year's site power demand against the depot's fixed connection limit, and turn the site red when demand exceeds that limit.

Make physical feasibility understandable: chargers require space, and a financially attractive plan may exceed available space or power. The scene must respond to scenario data rather than play a fixed sequence.

Show two transition plans side by side, including their financial and emissions consequences, so users can compare vehicle ordering, transition timing and charging choices on the same screen.

## Inputs and outputs

Expose the following inputs and assumptions, supplying plausible sample values:

- **Fleet and operations:** vehicle ID/type, age, annual mileage, typical daily distance, fuel use, route type/duty cycle, depot-return pattern, utilisation and planned replacement year.
- **Vehicle presets and economics:** user-defined preset name/category/propulsion, purchase/lease costs, fuel or electricity prices as applicable, fuel/energy efficiency, usable range where applicable, charging capability, maintenance costs, physical dimensions, and ownership/residual-value assumptions.
- **Charging:** depot charger cost, quantity, type/power and installation timing; external charging tariff; depot/external charging split; and depot space and connection-capacity parameters used by the feasibility view.
- **Analysis and emissions:** analysis/ownership period and emissions factors used to compare current and transitioned vehicle operation.

Recalculate and present these outputs for each scenario:

- Fleet-level total cost of ownership (TCO) over the selected period, total transition capital expenditure (CAPEX), annual operating cost, and cost difference against the explicit no-transition/current-fleet baseline.
- Cost per vehicle, cost per kilometre where useful, and indicative payback/breakeven, showing when it is not reached within the analysis period.
- Number and type of vehicles transitioned each year and a visual roadmap of vehicles/groups in each phase.
- Indicative depot charging infrastructure requirements and costs, external charging costs, and the depot/external charging mix.
- Estimated fuel displaced, electricity consumed and emissions difference against the no-transition/current-fleet baseline.
- Vehicle/route suitability ranking and explanations of which assumptions most affect the result. Include basic assumption-impact visibility; advanced sensitivity analysis is outside M1–M6 scope.

## Boundaries and acceptance scenarios

Keep the first version focused on scenario flexibility. Advanced sensitivity/uncertainty analysis and regional presets are outside M1–M6 scope. Do not attempt exhaustive tax, subsidy, financing or route-detail models. Project 2 route optimisation and Project 3 citywide energy simulation are outside scope.

The application must support these acceptance scenarios:

1. Transition Vehicle A now and B next year to selected target presets, then reverse their ordering or delay A. Compare cost, payback, emissions and the yearly roadmap.
2. Compare selected vehicles or a suitable category transitioning in stages against a full transition plan. Unscheduled vehicles remain on their current presets and yearly counts match the plan.
3. Keep the transition schedule fixed and compare depot, external and mixed charging. Infrastructure requirements and fleet costs reflect the strategy.
4. Raise or lower fuel/electricity prices, for example by 20%. Results update immediately and explain the changed economics.
5. Change charger installation years or quantities. Costs and the depot timeline update; space constraints are visible, and exceeding the connection limit produces red overload feedback.

