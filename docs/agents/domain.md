# Domain Docs

This repo uses a single-context domain model across its apps and shared packages.

## Before exploring, read these

- Root `CONTEXT.md`, when present
- Relevant ADRs under `docs/adr/`

If either is absent, proceed silently. Domain-modeling creates these files lazily when terminology or architectural decisions are resolved.

## Local and shared files

- `CONTEXT.md` is ignored by Git and is machine-local. Do not commit it or treat it as shared team state.
- ADRs under `docs/adr/` are shared project documentation and may be committed.

## Layout

```text
/
├── CONTEXT.md        ← machine-local
├── docs/adr/         ← shared ADRs
├── apps/
└── packages/
```

## Vocabulary

Use terms as defined in `CONTEXT.md`. Avoid synonyms that its glossary explicitly rejects. If a required concept is absent, reconsider the terminology or note the gap for domain-modeling.

## ADR conflicts

Explicitly surface any proposal that contradicts an existing ADR rather than silently overriding the decision.
