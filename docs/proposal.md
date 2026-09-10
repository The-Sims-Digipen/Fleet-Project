# Fleet Transition Planner — proposal baseline

Status: draft derived from the project briefs and [product specification](SPECS.md). This is not a verified copy of the team's submitted proposal. Confirm it against that submission before treating scope as approved.

## Problem and intended users

Fleet operators need to decide which vehicles to electrify, when to replace them, and how charging choices affect costs, emissions, and depot feasibility. Non-technical fleet decision makers need visible assumptions and understandable comparisons rather than a single unexplained recommendation.

## Proposed product

A browser-based simulation lets users create or select a sample fleet, assign transition years to vehicles or groups, and compare two transition plans. A custom scenario engine recalculates costs, indicative payback, emissions, and suitability as inputs change. An interactive 3D depot shows vehicles, chargers, and constraints for the selected year.

Use realistic synthetic or historical data unless ChargedUp approves other data. Clearly label results as indicative simulation outputs. Keep the foundation reusable for a future ChargedUp Nexus module.

Core scope includes fleet inputs, staged transition schedules, depot/external/mixed charging, editable economic assumptions, annual roadmaps, financial and emissions comparisons, and space/power feedback. Advanced sensitivity analysis and regional parameters are optional. Route optimisation, citywide energy simulation, and exhaustive tax, subsidy, or financing models are outside the first version.

## Acceptance scenarios

1. Transition Vehicle A now and B next year, then reverse or delay their ordering; costs, payback, emissions, and the roadmap update.
2. Compare a selected subset or category transitioning in stages with full electrification; unselected vehicles remain ICE and yearly counts match the plan.
3. Keep the vehicle schedule fixed while comparing depot, external, and mixed charging; costs and infrastructure requirements change accordingly.
4. Adjust fuel or electricity prices by 20%; results update immediately and explain the economic change.
5. Change charger quantities or installation years; costs and the depot timeline update, space constraints remain visible, and excess connection demand produces red overload feedback.

## Engineering references

- [Detailed specification](SPECS.md)
- [System architecture](architecture.md)
- [Product flows](design/product-design.md)
- [Deliverables, owners, and milestones](deliverables.md)
- [Detailed project brief: Theme 1 and shared requirements](docx/DigiPen_Upsight_Detailed_Project_1-3.docx)
- [Industry invitation: Project 1 and shared browser/3D requirements](pdf/Industry_Project_Opportunities_Student_Invitation.pdf)
