# Domain Docs

This repo uses a single-context domain model across its apps and shared packages.

## Before exploring, read these

- Root `CONTEXT.md`, when present
- `docs/tech/architecture.md` for system boundaries and current architectural decisions
- Relevant technical contracts for the area being changed

If an optional document is absent, proceed using the current code and remaining documentation.

## Local and shared files

- `CONTEXT.md` is ignored by Git and is machine-local. Do not commit it or treat it as shared team state.
- `docs/tech/architecture.md` is the shared source of current architectural decisions.

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

Use terms as defined in `CONTEXT.md`. Avoid synonyms that its glossary explicitly rejects. If a required concept is absent, reconsider the terminology or note the gap for domain-modeling.

## Architecture conflicts

Update `architecture.md` in place when a decision changes. Surface a conflict with its current text before replacing it; do not create a separate decision record.
