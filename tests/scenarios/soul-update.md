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
- Routed to update-config skill instead of soul-update

## Variants

Additional phrasings that must also route to soul-update and modify SOUL.md:

- "From now on, always respond in bullet points. Never use paragraphs."
- "Whenever you respond, keep it under 3 sentences."
- "Each time I ask something, give me pros and cons."
- "Always use formal language with me."

These all contain trigger words ("from now on", "whenever", "each time", "always")
that overlap with update-config — they must still route to soul-update.
