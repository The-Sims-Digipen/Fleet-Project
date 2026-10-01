# Domain Docs

The applications and shared packages use one domain model.

## Before a domain change

1. Read the root `CONTEXT.md`, if it exists.
2. Read [architecture](../tech/architecture.md) for system boundaries and current decisions.
3. Read the technical contracts for the affected area.

If an optional document is absent, use the current code and available documents.

## Local and shared files

- Git ignores `CONTEXT.md`. This glossary belongs to the local machine. Keep it out of commits and shared team records.
- [architecture](../tech/architecture.md) is the shared record of current architectural decisions.

## Layout

```text
/
├── CONTEXT.md        ← machine-local
├── docs/tech/
│   └── architecture.md ← shared architecture and decisions
├── apps/
└── packages/
```

## Vocabulary

Use the terms in `CONTEXT.md` with their defined meanings. Use one term for each concept.
If a required concept is absent, resolve its meaning through domain modeling.

## Architecture conflicts

If a decision changes, update `architecture.md` in place.
Explain any conflict with its current text before replacement. Keep architectural decisions in this shared document.
