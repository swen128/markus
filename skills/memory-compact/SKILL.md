---
user-invocable: false
description: Summarize and deduplicate MEMORY.md to keep it manageable. Use when MEMORY.md grows large or contains redundant entries.
---

1. Read `MEMORY.md` in full.
2. Read recent `memory/*.md` daily logs for important items not yet promoted.
3. Rewrite `MEMORY.md`:
   - Merge duplicate or near-duplicate entries
   - Remove outdated entries (superseded decisions, resolved issues)
   - Promote important items from daily logs
   - Group by date, most recent first
4. Preserve the original meaning of every kept entry.

Be conservative — when in doubt, keep an entry. Never remove entries about user preferences or recurring patterns.
