# Product design and initial flows

Status: proposed flows based on the [specification](../SPECS.md); these are not implemented screens. Ooi Ming Thong owns product/UX design, with Dayton Ng Zhi Jie owning web implementation.

## Fleet setup

Create a fleet or select realistic sample data. Inspect vehicles or groups with age, mileage, route/duty cycle, depot return, utilisation, and replacement timing. Explain units and assumptions near inputs. A sample fleet provides an immediate starting point without requiring operational data uploads.

## Transition planning

Select individual vehicles, arbitrary groups, or categories and assign transition years. Retain unselected vehicles as ICE. Show yearly transition counts and a roadmap alongside suitability explanations so users can understand why one vehicle may be a better early candidate.

## Charging configuration

Choose depot, external, or mixed charging. Edit charger quantity, power/type, installation year, tariffs, and charging split, together with depot space and connection capacity. Refresh infrastructure costs and feasibility feedback when these choices change.

## Year timeline and depot

Scrub through years to inspect the depot with camera controls. Vehicles become electric and chargers appear according to the selected plan. Show selected-year demand beside the connection limit. When demand exceeds the limit, show red site feedback and a readable overload explanation; do not rely on color alone. Make insufficient charger space visible.

## Side-by-side comparison

Compare two plans on the same screen, including their depot states, transition roadmap, total cost, CAPEX, annual operating cost, emissions, and indicative payback. Make the shared ICE baseline and analysis period visible. Changing vehicle ordering, charging strategy, or prices updates the relevant results and explains the drivers. Explicitly display when breakeven is not reached within the period.

## Design acceptance and assets

Keep the simulation label and editable assumptions visible. Provide labels, keyboard-accessible controls, and understandable empty/invalid-input states. Review these flows against all five [proposal acceptance scenarios](../proposal.md#acceptance-scenarios).

Store wireframes, user flows, mockups, and review notes in [ui-ux](ui-ux/README.md). M1 establishes initial designs, M2 reviews integrated usability, and M3 completes the usability review and handover.
