# Planning guidance for agents

## Team-facing documents

- Use one implementation hierarchy only: every scheduled technical work item is a feature under `docs/features/` and uses the same `Fxx` identifier in the weekly plan. Do not maintain a second task catalogue or umbrella feature catalogue.
- Keep each feature substantial in scope; do not split work into small tickets just to create more rows.
- Each feature specification should focus on what that owner must accomplish: required behavior, implementation-specific rules, integration behavior, edge cases, and feature-specific tests.
- Do not add administrative/process tasks such as define, document, agree, meet, review, prepare submission, handover, or acceptance coordination to the technical feature schedule.
- Keep team-facing files focused on what must be built, when it is needed, ownership, dependencies, constraints, and implementation behavior. Put planning rationale, source traceability, and agent-maintainer notes under `AGENTS/` instead.

## Roles

Keep the project roles exactly as follows unless the team explicitly changes them:

| Table name | Team member | Role |
|---|---|---|
| Ming Thong | Ooi Ming Thong | Project Manager; UX/UI Design Champion |
| Shee Yang | Chew Shee Yang | Technical Lead; Systems Integration Champion |
| Dayton | Dayton Ng Zhi Jie | Web UI Implementation Champion |
| Jarrel | Jarrel Tay Wee Han | 3D Asset & Modeling Champion |
| Elijah | Elijah Chua Jye Kang | Simulation Champion |
| Wei Jun | Tan Wei Jun | 3D Systems & Visualization Champion |
| Zhi Kai | Yap Zhi Kai | Vehicle Systems Champion |
| Brandon | Brandon Koh Kai Yang | Backend Champion |

Ming Thong remains in the team role table, but the technical feature catalogue should contain implementation work only. UX/UI design work belongs in the design workflow rather than being converted into artificial engineering tasks.

## Product decisions that override literal source examples

- Vehicle presets are user-defined.
- Transition logic is generic current-preset -> target-preset; do not hard-code diesel/ICE -> EV in the domain architecture.
- The source briefs' ICE/EV examples remain required use cases and acceptance examples, not a restriction on the underlying model.
- Keep calculations, 3D state, persistence, charts, recommendations, and comparison driven from the same project/scenario data.
