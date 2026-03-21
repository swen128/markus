# Reflect Format Enforcement

Verify the PostToolUse validation hook catches format violations in real-time.


## Steps

```bash
bun run tests/harness.ts --fixture workspace "Let's use Bun instead of Node for the test runner. Also I prefer tabs over spaces. Reflect on this conversation and save anything noteworthy."
```

## Pass

- `memory/` contains ONLY date-named files (`YYYY-MM-DD.md`)
- No `feedback_*.md`, `user_*.md`, or any topic-named files even temporarily
- `memory/YYYY-MM-DD.md` uses `## HH:MM` headers, no YAML frontmatter
- `MEMORY.md` uses plain `- <observation>` lines, no `[file](path)` links
- If the PostToolUse hook fires and detects violations, Claude self-corrects within the same session

## Fail

- Topic-based files exist in `memory/`
- YAML frontmatter present in any memory file
- Link-based format in MEMORY.md
- Violations persist after the session (hook didn't fire or Claude didn't self-correct)
