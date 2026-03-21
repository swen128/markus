# Memory Recall

User asks about a past decision that exists in memory files.


## Steps

```bash
bun run tests/harness.ts --fixture workspace --max-turns 5 "What database did we pick for analytics?"
```

## Pass

- Claude answers "PostgreSQL"
- Claude uses qmd MCP tools (search or vsearch) to find the answer, not Grep/Read

## Fail

- Claude says it doesn't know
- Claude hallucinates a different database
- Claude uses Grep or Read instead of qmd tools
- Claude answers correctly but only from workspace-context injection (acceptable for now, but qmd usage is preferred)
