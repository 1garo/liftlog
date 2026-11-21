# Agent notes

## Working agreement

- Read `.ai/initial-idea.md` before changing the app.
- Implement one milestone at a time; stop for explicit approval before the next.
- Keep changes mobile-first, local-first, and within the requested scope.
- Run relevant tests and record the outcome in the session memory.

## Rules

- Before making significant design decisions (architecture, API shape, data model, dependency choices), stop and ask the user to confirm.
- If the task is ambiguous, ask a clarifying question before proceeding.
- Do not ask permission to run commands, install packages, or edit files.

## Session memory

Use `.ai/memory/YYYY-MM-DD.md`, one file per workday. Keep entries compact:

```md
# YYYY-MM-DD
## Done
- ...
## Decisions
- ...
## Next
- ...
## Checks
- `npm test` — pass/fail
```

Record only durable context: completed work, decisions, blockers, and the next approved milestone. Do not copy code, logs, or the full conversation.
