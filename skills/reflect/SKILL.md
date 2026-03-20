---
user-invocable: false
description: Extract noteworthy items from the current conversation into memory files. Use when a cron notification prompts periodic reflection, or when a decision, preference, or important context is observed.
---

1. Read today's `memory/YYYY-MM-DD.md` to avoid duplicates.
2. Review the current conversation context.
3. Identify new decisions, preferences, observations, or context worth persisting.
4. Append new items to `memory/YYYY-MM-DD.md` (create the file and `memory/` directory if needed):
   ```
   ## HH:MM

   - <observation or decision>
   ```
5. If any item warrants long-term retention, also append to `MEMORY.md` **in the workspace root** (not inside `memory/`):
   ```
   ## YYYY-MM-DD

   - <significant observation>
   ```
6. If nothing noteworthy happened, do nothing.

Be selective — persist only genuinely useful information, not routine operations. One line per item.
