# Issue tracker: Local Markdown

Store local issues and specifications as Markdown files in `.scratch/`.

Git ignores `.scratch/`. Each contributor keeps their own local tickets.
Keep these files out of commits and shared team records.

## Conventions

- Use one directory per feature: `.scratch/<feature-slug>/`.
- Put the specification at `.scratch/<feature-slug>/spec.md`.
- Use one file per ticket: `.scratch/<feature-slug>/issues/<NN>-<slug>.md`. Start the numbers at `01`.
- Put a `Status:` line near the top of each issue file.
- Add comments and conversation history under `## Comments`.

## When a skill says "publish to the issue tracker"

1. If the directory is absent, create `.scratch/<feature-slug>/`.
2. Create the ticket file in that directory.

## When a skill says "fetch the relevant ticket"

Read the specified local file. The user usually supplies its path or issue number.

## Wayfinding operations

Use `.scratch/<effort>/map.md` for the work map.
Use `.scratch/<effort>/issues/NN-<slug>.md` for each child ticket.

1. Record dependencies as `Blocked by: NN, NN` near the top of a ticket.
2. Select the first numbered open ticket with no unresolved dependency or claim.
3. Set `Status: claimed` before work starts.
4. When the work is complete, add the answer under `## Answer`.
5. Set `Status: resolved`.
6. Update the work map.
