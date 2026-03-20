# Markus

Claude Code plugin for personal assistant. When installed by an end user, Markus gives their Claude agent persistent memory, personality, and scheduled tasks.

This repo is the plugin source code. `docs/` governs how we develop the plugin. `skills/`, `templates/`, and `src/` are plugin code that runs in the end user's environment — Markus creates and manages memory files (`SOUL.md`, `MEMORY.md`, etc.) in their workspace.

## Testing

Always use Docker in a tmux pane:

```bash
docker build -t markus-test .
docker volume create markus-claude-config
tmux split-window -h "docker run --rm -it --cap-add NET_ADMIN --cap-add NET_RAW -v markus-claude-config:/home/node/.claude -v markus-workspace:/workspace markus-test"
```

First run requires `/login` inside the container. Credentials persist in the volume.
