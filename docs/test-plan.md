# Test Plan

## Cron Tools (#45)

Scenario: `tests/scenarios/cron.md`

```bash
bun run tests/harness.ts --fixture workspace --agent personal-assistant --max-turns 5 "Remind me to check deployment every 30 minutes"
```

- Claude calls MCP `cron_create` tool (from the plugin server), not built-in `CronCreate`
- The `--agent personal-assistant` flag ensures `disallowedTools` from the agent definition take effect
