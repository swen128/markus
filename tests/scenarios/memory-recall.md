# Memory Recall

User asks about a past decision that exists in memory files.


## Steps

```bash
bun run tests/harness.ts --fixture workspace --max-turns 5 "What database did we pick for analytics?"
```

## Pass

- Claude answers "PostgreSQL"
- Claude uses qmd MCP tools (`query`, `get`, or `multi_get`) to find the answer
- Acceptable fallback: Claude uses Read/Grep on MEMORY.md if qmd returns empty results

## Fail

- Claude says it doesn't know
- Claude hallucinates a different database
- Claude answers correctly but only from workspace-context injection without attempting qmd first
