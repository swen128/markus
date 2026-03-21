# Multi-turn Bootstrap

Full onboarding flow: bootstrap then personalize.


## Steps

```bash
bun run tests/harness.ts --fixture empty "Hello"
# Read the session= line from the output, then continue:
bun run tests/harness.ts --resume <session-id> "My name is Alice and I live in Tokyo. My timezone is Asia/Tokyo. Call me Al."
bun run tests/harness.ts --resume <session-id> "From now on, be concise and use bullet points."
```

## Pass

- After turn 1: SOUL.md, IDENTITY.md, USER.md, MEMORY.md, memory/ all created
- After turn 2: USER.md contains "Alice", "Tokyo", "Asia/Tokyo"
- After turn 3: SOUL.md updated with bullet-point preference, existing content preserved
- BOOTSTRAP.md deleted at some point during the flow

## Fail

- Bootstrap doesn't trigger on turn 1
- Personal facts written to SOUL.md instead of USER.md
- Behavioral preference written to USER.md instead of SOUL.md
- Any file overwritten from scratch instead of updated
