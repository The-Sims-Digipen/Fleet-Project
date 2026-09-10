# Deliverables, ownership, and milestones

Status: initial proposed targets. M1, M2, and M3 dates are **unset**. Jira project details and issue keys are pending; no issues have been created by this repository setup.

The [proposal](proposal.md) informs the [architecture](architecture.md), which informs these deliverables. Each deliverable maps to one proposed Jira Epic. Initial tasks below inherit the named owner's responsibility; agree any reassignment explicitly in Jira and update this document.

## Milestone targets

| Deliverable / proposed Jira Epic | Owner | M1 | M2 | M3 | Jira key |
|---|---|---|---|---|---|
| Product and UX design | Ooi Ming Thong | Core flows and wireframes | Usability review of integrated flows | Final usability review and handover | Pending |
| Architecture and integration | Chew Shee Yang | Architecture and component contracts | Integrated planning workflow | Reproducible release and integration verification | Pending |
| Web interface | Dayton Ng Zhi Jie | Fleet and scenario input UI | Comparison views and charts | Accessibility and interaction polish | Pending |
| 3D assets | Jarrel Tay Wee Han | Initial depot, vehicle, and charger assets | Complete assets needed by the scenarios | Optimized assets and documented usage | Pending |
| Simulation engine | Elijah Chua Jye Kang | Baseline cost and emissions calculations | Transition, charging, and payback calculations | Validated results and assumption explanations | Pending |
| 3D systems and visualization | Tan Wei Jun | Depot rendering and selection | Year timeline and capacity feedback | Performance and visualization verification | Pending |
| Vehicle systems | Yap Zhi Kai | Fleet model and sample data | Vehicle selection, schedules, and suitability | Vehicle behavior and scenario validation | Pending |
| Backend | Brandon Koh Kai Yang | Persistence model and API contracts | Fleet and scenario persistence | Persistence validation and Ubuntu deployment verification | Pending |

## Initial owned Stories/Tasks

Each numbered item is an initial Story/Task candidate, with its milestone and acceptance evidence. Jira keys are pending for all items.

### Product and UX design

Owner: **Ooi Ming Thong — Project Manager, UX/UI Design Champion**.

1. **M1:** Produce fleet setup, planning, charging, timeline, and comparison wireframes; link reviewed artifacts from the design directory.
2. **M2:** Review the integrated flows with representative users; record findings and prioritized follow-up tasks.
3. **M3:** Recheck resolved usability findings and document final product walkthrough and handover.

### Architecture and integration

Owner: **Chew Shee Yang — Technical Lead, Systems Integration Champion**.

1. **M1:** Agree component input/output contracts with the domain owners and update the architecture with reviewed decisions.
2. **M2:** Integrate fleet edits through calculations into charts and 3D views; demonstrate the proposal's acceptance scenarios.
3. **M3:** Establish release/CI evidence, verify clean-clone setup and integration, and record required-platform results and remaining limitations.

### Web interface

Owner: **Dayton Ng Zhi Jie — Web UI Implementation Champion**.

1. **M1:** Implement fleet and scenario input controls with explicit units and invalid-input feedback; verify editing behavior.
2. **M2:** Connect comparison charts and roadmaps to scenario outputs; demonstrate updates after changing inputs.
3. **M3:** Verify keyboard access, labels, and understandable result states; resolve interaction issues from UX review.

### 3D assets

Owner: **Jarrel Tay Wee Han — 3D Asset & Modeling Champion**.

1. **M1:** Deliver initial depot, vehicle, and charger assets with scale/orientation agreed with the visualization owner.
2. **M2:** Complete and integrate the assets needed for the acceptance scenarios, including distinguishable ICE/EV states.
3. **M3:** Optimize assets against measured rendering needs and document provenance, licensing, and usage.

### Simulation engine

Owner: **Elijah Chua Jye Kang — Simulation Champion**.

1. **M1:** Define units and assumptions and implement baseline cost/emissions calculations verified against independent worked examples.
2. **M2:** Calculate staged transitions, charging costs, and payback; test delayed installation and unreached breakeven cases.
3. **M3:** Validate scenario outputs and explain the effect of fuel/electricity price changes, including the specified 20% examples.

### 3D systems and visualization

Owner: **Tan Wei Jun — 3D Systems & Visualization Champion**.

1. **M1:** Render the initial depot and support vehicle selection/camera inspection; provide browser verification evidence.
2. **M2:** Drive vehicles and chargers from the year timeline and display space/power constraints with overload feedback.
3. **M3:** Measure responsiveness during repeated edits and verify both comparison views against scenario data in a real browser.

### Vehicle systems

Owner: **Yap Zhi Kai — Vehicle Systems Champion**.

1. **M1:** Define fleet records and realistic sample data with documented operational attributes and units.
2. **M2:** Implement selection, transition schedules, and explainable suitability with the simulation owner; preserve unselected ICE vehicles.
3. **M3:** Verify vehicle ordering, staged transitions, and yearly counts against the proposal scenarios.

### Backend

Owner: **Brandon Koh Kai Yang — Backend Champion**.

1. **M1:** Agree the persistence model and API contracts for fleets/scenarios with the technical lead; document validation and failure responses.
2. **M2:** Implement persistence and frontend integration; verify saved scenarios can be loaded without losing their inputs.
3. **M3:** Validate persistence failure cases and demonstrate server build/run and tests on Ubuntu 24.04.

## Tracking and integration workflow

Create the proposed Epics and tasks in the team's Jira project once its details are available, then replace pending keys with actual links. Keep ownership, milestone targets, and scope synchronized here. Reference the relevant Jira key in implementation PRs, describe the behavior changed, and attach test evidence. Review and integrate PRs in GitHub; keep source, design, documentation, tests, and future CI/CD configuration in this repository.

CI/CD and deployment implementation are future work under integration/backend ownership and are not included in the minimum EOD documentation setup.

## Outstanding handoff steps

- [ ] Ooi Ming Thong: confirm this draft against the submitted proposal and obtain scope agreement.
- [ ] Ooi Ming Thong: confirm M1/M2/M3 dates and supply Jira project details; coordinate creation of Epics and tasks with their owners.
- [ ] Chew Shee Yang: review and publish this setup to the [GitHub repository](https://github.com/The-Sims-Digipen/Fleet-Project) through the team's PR process. Local changes alone do not complete publication.
- [ ] Chew Shee Yang: arrange the collaborator invitation for GitHub user `giraphics` with a repository administrator and verify access. Invitation status is unverified.
- [ ] Ooi Ming Thong: obtain the instructor's Excel sheet location and required fields, update it, and record completion. No sheet was provided or updated.
- [ ] Chew Shee Yang and Brandon Koh Kai Yang: record development/build evidence on Ubuntu 24.04, macOS Tahoe, and Windows 11, and server deployment/testing evidence on Ubuntu 24.04. Cross-platform support remains a verification target.
