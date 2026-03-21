# Reflect

User makes decisions during conversation and asks Claude to reflect and save.


## Steps

```bash
bun run tests/harness.ts --fixture workspace "We decided to switch from PostgreSQL to ClickHouse for analytics. Now reflect on this conversation and save anything noteworthy."
```

## Pass

- `memory/YYYY-MM-DD.md` created (today's date) with `## HH:MM` header and `- <observation>` lines
- MEMORY.md updated with the ClickHouse decision under a `## YYYY-MM-DD` header
- No YAML frontmatter in any memory file
- No topic-based files in `memory/` (only `YYYY-MM-DD.md` filenames)
- No `[file](path)` link format in MEMORY.md

## Fail

- No memory files created
- Topic-based files like `memory/decisions.md` or `memory/analytics.md`
- YAML frontmatter (`---`) in memory files
- MEMORY.md uses `[file.md](memory/file.md)` link format
- Written to Claude's native memory instead of workspace files
