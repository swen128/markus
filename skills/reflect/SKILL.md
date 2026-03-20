---
user-invocable: false
description: Extract noteworthy items from the current conversation into memory files. Use when a cron notification prompts periodic reflection, or when a decision, preference, or important context is observed.
---

1. Read today's `memory/YYYY-MM-DD.md` to avoid duplicates.
2. Review the current conversation context.
3. Identify new decisions, preferences, observations, or context worth persisting.
4. Append new items to `memory/YYYY-MM-DD.md` (create the file and `memory/` directory if needed). Use exactly this format:
   ```
   ## HH:MM

   - <observation or decision>
   ```
   Example — if today is 2026-03-20 and it is 14:30, write to `memory/2026-03-20.md`:
   ```
   ## 14:30

   - User prefers Bun over Node for the test runner
   - Team decided on tabs over spaces
   ```
5. If any item warrants long-term retention, also append to `MEMORY.md` **in the workspace root** (not inside `memory/`). Use exactly this format:
   ```
   ## YYYY-MM-DD

   - <significant observation>
   ```
   Example — append to `MEMORY.md`:
   ```
   ## 2026-03-20

   - User prefers Bun over Node for the test runner
   ```
6. If nothing noteworthy happened, do nothing.

**Do NOT:**
- Create separate topic-based files (e.g. `memory/feedback_bun_test_runner.md`, `memory/user_role.md`). The only files in `memory/` are date-named: `YYYY-MM-DD.md`.
- Use YAML frontmatter (`---`) in any memory file.
- Use link-based format in `MEMORY.md` (e.g. `- [file.md](memory/file.md) -- description`). Use plain `- <observation>` lines under date headers.

Be selective — persist only genuinely useful information, not routine operations. One line per item.
