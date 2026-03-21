# Soul Update

User requests a behavioral change that should be saved to SOUL.md.


## Steps

```bash
bun run tests/harness.ts --fixture workspace "From now on, always respond in bullet points. Never use paragraphs."
```

## Pass

- SOUL.md modified to include the bullet-point preference
- Existing personality, style, and boundaries preserved
- soul-update skill invoked (not user-update)

## Fail

- SOUL.md unchanged
- Claude acknowledges but doesn't persist
- SOUL.md overwritten from scratch (losing existing personality)
- Written to USER.md instead of SOUL.md
