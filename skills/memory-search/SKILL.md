---
user-invocable: false
description: Search memory files for relevant prior context. Use before answering questions about past decisions, preferences, prior work, or anything previously recorded.
---

1. Grep across these files for the relevant topic:
   - `MEMORY.md` — long-term curated memories
   - `TOOLS.md` — tool-specific notes
   - `memory/*.md` — daily session logs
2. Return matching entries with file path and date context.
3. Ground your response with the results.

Search broadly — try multiple keywords if the first search yields nothing. If nothing is found, say so.
