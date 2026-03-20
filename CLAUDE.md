# Markus

Claude Code plugin for personal assistant. When installed by an end user, Markus gives their Claude agent persistent memory, personality, and scheduled tasks.

This repo is the plugin source code. `docs/` governs how we develop the plugin. `skills/`, `templates/`, and `src/` are plugin code that runs in the end user's environment — Markus creates and manages memory files (`SOUL.md`, `MEMORY.md`, etc.) in their workspace.

