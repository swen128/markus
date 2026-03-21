# Bootstrap

Fresh workspace with no SOUL.md. The channel notification should trigger bootstrap without user input.

## Steps

```bash
bash tests/bootstrap-test.sh
```

This launches claude interactively in a tmux session with the plugin and development channels enabled. The script outputs the tmux session name and workspace path.

Use `tmux capture-pane -t <session> -p` to observe claude's behavior. Dismiss any startup prompts (trust dialog, dev channels warning) by sending `tmux send-keys -t <session> Enter`. Then wait for claude to act on the bootstrap channel notification.

Check the workspace for created files when claude finishes.

## Pass

- SOUL.md, IDENTITY.md, USER.md, TOOLS.md, MEMORY.md created in workspace root
- `memory/` directory created (verified by `memory/.gitkeep` appearing in created files)
- BOOTSTRAP.md deleted (or will be deleted after onboarding completes)
- MEMORY.md is at workspace root, not inside `memory/`

## Fail

- Claude sits at the prompt without bootstrapping
- Claude acknowledges the nudge but waits for explicit user instruction
- Any template file missing

## Cleanup

```bash
tmux kill-session -t <session>
```
