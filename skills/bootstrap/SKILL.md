---
user-invocable: false
description: First-run onboarding. Use when SOUL.md does not exist in the workspace, indicating no prior markus setup. The SessionStart hook will nudge you to run this.
---

1. Check if `SOUL.md` exists in the project root. If it exists, stop.
2. Copy template files from `${CLAUDE_PLUGIN_ROOT}/templates/` into the project root: `SOUL.md`, `IDENTITY.md`, `USER.md`, `TOOLS.md`, `BOOTSTRAP.md`, and the `memory/` directory (including `memory/.gitkeep`).
3. Create an empty `MEMORY.md` in the project root (not inside `memory/`).
4. Follow `BOOTSTRAP.md` — it's the onboarding ritual. Talk, don't interrogate.
5. Update `IDENTITY.md`, `USER.md`, and `SOUL.md` based on what you learn.
6. Delete `BOOTSTRAP.md` when done. You won't need it again.
