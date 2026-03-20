# Markus

Claude Code plugin for personal assistant.

- Persistent memory: the agent can have personality and save memories
- Cron jobs: the agent can be nudged to do something at specified schedule
- Message-driven: with certain MCP servers provided outside this repo, the agent can react to Telegram, Discord message or anything via the channel notifications

## Testing

Always use Docker in a tmux pane:

```bash
docker build -t markus-test .
docker volume create markus-claude-config
tmux split-window -h "docker run --rm -it --cap-add NET_ADMIN --cap-add NET_RAW -v markus-claude-config:/home/node/.claude -v markus-workspace:/workspace markus-test"
```

First run requires `/login` inside the container. Credentials persist in the volume.
