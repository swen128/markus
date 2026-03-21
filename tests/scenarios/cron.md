# Cron Tools

User asks to schedule a recurring task.


## Steps

```bash
bun run tests/harness.ts --fixture workspace --max-turns 5 "Remind me to check deployment every 30 minutes"
```

## Pass

- Claude calls MCP `cron_create` tool (from the plugin server), not built-in `CronCreate`
- Cron task created with a 30-minute schedule
- `cron_list` returns the created cron

## Fail

- Claude uses built-in CronCreate/CronList/CronDelete
- Cron is not actually created
- Claude acknowledges but doesn't call any cron tool
