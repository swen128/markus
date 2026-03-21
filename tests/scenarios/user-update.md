# User Update

User shares personal facts that should be saved to USER.md.


## Steps

```bash
bun run tests/harness.ts --fixture workspace "My name is actually Bob, not Alex. And my timezone is Asia/Tokyo."
```

## Pass

- USER.md modified to contain "Bob" and "Asia/Tokyo"
- Existing content preserved (not overwritten entirely)
- soul-update skill NOT invoked (this is personal facts, not behavioral preferences)

## Fail

- USER.md unchanged
- Claude acknowledges but doesn't persist
- Claude writes to native memory instead of USER.md
- USER.md overwritten from scratch (losing existing context like pronouns, preferences)
