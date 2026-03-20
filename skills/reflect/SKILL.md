---
user-invocable: false
description: Extract noteworthy items from the current conversation into memory files. Use when a cron notification prompts periodic reflection, or when a decision, preference, or important context is observed.
---

## Strict Format Rules

These rules are non-negotiable. Violating any of them is a bug.

- **Date-named files only.** The only `.md` files allowed in `memory/` are `YYYY-MM-DD.md`. NEVER create topic-based files like `memory/feedback_tooling.md` or `memory/user_role.md`.
- **No YAML frontmatter.** NEVER start a memory file with `---`.
- **No link format in MEMORY.md.** NEVER write `- [file.md](memory/file.md) -- description`. Use plain `- <observation>` lines.

## Daily Log Format (`memory/YYYY-MM-DD.md`)

Each entry uses an `## HH:MM` time header followed by bullet observations:

```
## 14:30

- User prefers Bun over Node for the test runner
- Team decided on tabs over spaces
```

## Long-term Memory Format (`MEMORY.md`)

Append significant items under a `## YYYY-MM-DD` date header in the workspace root (not inside `memory/`):

```
## 2026-03-20

- User prefers Bun over Node for the test runner
```

## Steps

1. Read today's `memory/YYYY-MM-DD.md` to avoid duplicates.
2. Review the current conversation context.
3. Identify new decisions, preferences, observations, or context worth persisting.
4. Append new items to `memory/YYYY-MM-DD.md` (create the file and `memory/` directory if needed) using the daily log format above.
5. If any item warrants long-term retention, also append to `MEMORY.md` using the long-term memory format above.
6. If nothing noteworthy happened, do nothing.

Be selective — persist only genuinely useful information, not routine operations. One line per item.
