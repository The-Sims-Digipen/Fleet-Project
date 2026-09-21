# T02 — Company Design System & UI Component Library

**Owner:** Dayton Ng Zhi Jie  
**M1 contract:** Required  
**Supports:** F01-F07

## Goal

Implement the company's visual style guide as a reusable React design system with centralized tokens and accessible shared interaction components used across the M1 product screens.

## Responsibilities

- Centralize company-aligned colour, typography, spacing and sizing tokens.
- Provide reusable M1 components such as buttons, inputs, selects, collapsible sections, panels/cards, dialogs, tabs/toolbars and status/warning states.
- Define consistent hover/focus/disabled/error states.
- Ensure keyboard/focus behavior and labels are built into interactive components where applicable.
- Reduce duplicated one-off styling across feature screens.
- Provide a small component showcase/documentation surface so states can be reviewed independently of product screens.

## M1 boundaries

T02 owns reusable presentation primitives and design rules. Product-specific Fleet/Scenario/Analytics behavior remains in the corresponding Fxx/Txx systems.

## M1 evidence

- Change one central token and show the change consistently across multiple M1 screens.
- Demonstrate shared components in at least three product screens.
- Demonstrate keyboard focus, validation/error and disabled/status states without relying on colour alone.
