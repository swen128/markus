# Bootstrap

Fresh workspace with no SOUL.md.


## Steps

```bash
bun run tests/harness.ts --fixture empty "Hello"
```

## Pass

- SOUL.md, IDENTITY.md, USER.md, TOOLS.md, MEMORY.md created in workspace root
- `memory/` directory created (verified by `memory/.gitkeep` appearing in created files)
- BOOTSTRAP.md deleted (or will be deleted after onboarding completes)
- MEMORY.md is at workspace root, not inside `memory/`

## Fail

- Claude responds to "Hello" normally without bootstrapping
- Claude acknowledges the nudge but waits for explicit user instruction
- Any template file missing
