## Pre-condition

All interactive tests must launch Claude with `--agent personal-assistant`.

## Bootstrap

Fresh workspace with no `SOUL.md`.

- Send: "Hello"
- **Pass**: Claude invokes the `bootstrap` skill immediately (before or instead of responding to "Hello"), copies templates (`SOUL.md`, `IDENTITY.md`, `USER.md`, `TOOLS.md`, `BOOTSTRAP.md`) into `/workspace`, creates `memory/` dir, starts the onboarding conversation, and eventually deletes `BOOTSTRAP.md`.
- **Fail**: Claude responds to "Hello" normally without bootstrapping. Or Claude acknowledges the nudge but waits for explicit user instruction to bootstrap.
- Verify files: `ls /workspace/SOUL.md /workspace/IDENTITY.md /workspace/USER.md /workspace/TOOLS.md /workspace/memory/`
- Verify MEMORY.md location: `test -f /workspace/MEMORY.md && echo PASS || echo FAIL` — must be at workspace root, not inside `memory/`.

## User Update

Requires a bootstrapped workspace (SOUL.md etc. already exist).

- Send: "My name is Alice and I live in Tokyo. My timezone is Asia/Tokyo."
- **Pass**: Claude invokes `user-update` skill and writes the info to `USER.md`. Cat the file to confirm name, location, timezone are present.
- **Fail**: Claude acknowledges but doesn't touch `USER.md`. Or `USER.md` is overwritten instead of updated.
- Verify: `cat /workspace/USER.md` — should contain "Alice", "Tokyo", "Asia/Tokyo".

## Memory Recall via qmd

Requires prior memory entries in `MEMORY.md` or `memory/` files.

- Pre-condition: Write a test entry to `MEMORY.md` before the session, e.g. "2026-03-19: Decided to use PostgreSQL for the analytics service."
- Send: "What database did we pick for analytics?"
- **Pass**: Claude invokes `memory-search` skill, uses qmd MCP `search` tool (not Grep), finds the entry, answers "PostgreSQL".
- **Fail**: Claude says it doesn't know. Or uses Grep/Read instead of qmd. Or hallucinates a different answer.
- Verify: Check the debug log for `qmd` tool invocations.

## Cron Tools

- Send: "Remind me to check deployment every 30 minutes"
- **Pass**: Claude calls the MCP `cron_create` tool (from the markus server), not the built-in `CronCreate`. The cron fires after 30 minutes and sends a channel notification.
- **Fail**: Claude uses built-in `CronCreate`/`CronList`/`CronDelete` instead of MCP tools. Or the cron is created but never fires.
- Verify: `cron_list` returns the created cron. After 30 min, a channel notification appears. Check debug log for which tool was actually called.

## Workspace Persistence

Uses a Docker volume for `/workspace`.

- Session A: Bootstrap, create some memory entries, then exit.
  ```
  docker run --rm -it --cap-add NET_ADMIN --cap-add NET_RAW \
    -v markus-claude-config:/home/node/.claude \
    -v markus-workspace:/workspace \
    markus-test
  ```
- Session B: Start a new container with the same volumes.
- **Pass**: `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `memory/` all survive. Workspace context hook injects them on the second session.
- **Fail**: `/workspace` is empty on the second session. Or files exist but workspace-context hook fails to read them.
- Verify: `ls /workspace/` at the start of session B.

## System Instructions Injection

- Start a fresh session.
- **Pass**: The SessionStart hooks run. The output includes workspace file contents (from `workspace-context.ts`) and the system instructions block (from `system-instructions.ts`) containing "Memory Recall", "Continuity", "Cron Tasks", "Safety" sections.
- **Fail**: Hooks error out. Or system instructions are missing. Or workspace context is empty despite files existing.
- Verify: Check the session startup output and debug log for hook execution.

## Reflect Skill

Requires a bootstrapped workspace.

- Have a conversation with some decisions: "Let's use Bun instead of Node for the test runner. Also I prefer tabs over spaces."
- Send: "Reflect on this conversation and save anything noteworthy."
- **Pass**: Claude invokes `reflect` skill, creates/appends to `memory/YYYY-MM-DD.md` with the decisions. Significant items also go to `MEMORY.md`.
- **Fail**: Claude says "okay" but doesn't write anything. Or writes to wrong files. Or duplicates existing entries.
- Verify: `cat memory/$(date +%Y-%m-%d).md` and `cat MEMORY.md`.
- Verify MEMORY.md is at workspace root: `test -f /workspace/MEMORY.md && echo PASS || echo FAIL` — should NOT be at `/workspace/memory/MEMORY.md`.
- Verify daily log format: `cat memory/$(date +%Y-%m-%d).md` — must contain `## HH:MM` headers (e.g. `## 14:30`) followed by `- <observation>` lines. Must NOT contain YAML frontmatter (`---`).
- Verify no topic-based files: `ls memory/` — must only contain date-named files (`YYYY-MM-DD.md`). No files like `feedback_*.md`, `user_*.md`, or any non-date-named files.
- Verify MEMORY.md format: `cat MEMORY.md` — significant items must appear under `## YYYY-MM-DD` date headers as `- <observation>` lines. Must NOT contain `[filename](memory/filename.md)` link format.

## Reflect Format Enforcement

Requires a bootstrapped workspace.

- Have a conversation: "Let's use Bun instead of Node for the test runner. Also I prefer tabs over spaces."
- Send: "Reflect on this conversation and save anything noteworthy."
- **Pass**: All of the following:
  - `ls memory/` contains ONLY date-named files (`YYYY-MM-DD.md`). No `feedback_*.md`, `user_*.md`, or any topic-named files.
  - `cat memory/$(date +%Y-%m-%d).md` uses `## HH:MM` headers with `- <observation>` lines. No YAML frontmatter.
  - `cat MEMORY.md` uses `## YYYY-MM-DD` headers with plain `- <observation>` lines. No `[file](path)` links.
- **Fail**: Any topic-based file exists in `memory/`. Or YAML frontmatter present. Or link-based format in `MEMORY.md`.
- Verify validation hook runs at session start: start a new session and check that `scripts/validate-memory.sh` output appears. If violations exist from a prior session, the hook should print corrective instructions.

## Reflect Format — Real-time Validation

Requires a bootstrapped workspace.

- Have a conversation: "Let's use Bun instead of Node for the test runner. Also I prefer tabs over spaces."
- Send: "Reflect on this conversation and save anything noteworthy."
- **Pass**: Immediately after the reflect skill writes files (within the same session, no restart needed):
  - `ls memory/` contains ONLY date-named files. No topic-based files were created even temporarily.
  - `cat memory/$(date +%Y-%m-%d).md` has no YAML frontmatter.
  - `cat MEMORY.md` has no `[file](path)` links.
  - If a PostToolUse hook is present, it printed no violations after the writes.
- **Fail**: Topic-based files, frontmatter, or link format are present after reflect, even if they would be caught on next session start.

## Soul Update

Requires a bootstrapped workspace with `SOUL.md`.

- Send: "From now on, always respond in bullet points. Never use paragraphs."
- **Pass**: Claude invokes `soul-update` skill and edits `SOUL.md` to include the bullet-point preference.
- **Fail**: Claude acknowledges but doesn't modify `SOUL.md`. Or overwrites the entire file instead of adding the guideline.
- Verify: `cat /workspace/SOUL.md` — should have the new guideline while preserving existing content.

## Hook Execution

- Start a session and watch for errors during startup.
- **Pass**: All 5 SessionStart hooks complete without error:
  - Dependency install (copies package.json, runs bun install)
  - Workspace context injection
  - System instructions injection
  - Bootstrap nudge (or no-op if SOUL.md exists)
  - qmd collection setup (or no-op if qmd unavailable)
- **Fail**: Any hook errors out. Or hooks run but produce empty output when files exist.
- Verify: Debug log shows all hooks executed. No stderr from hook commands.

## bunx Symlink Integrity

- Build the Docker image: `docker build -t markus-test .`
- Run: `docker run --rm --entrypoint bash markus-test -c 'bunx --version'`
- **Pass**: Prints the bun version number (e.g. `1.x.y`).
- **Fail**: `Permission denied` or `No such file or directory`.

## Bun Install Cache Permissions

- Build the Docker image: `docker build -t markus-test .`
- Run: `docker run --rm --entrypoint sh markus-test -c 'mkdir -p /tmp/pd && cp /plugin/package.json /plugin/bun.lock /tmp/pd/ && cd /tmp/pd && bun install --frozen-lockfile'`
- **Pass**: `bun install` completes with exit code 0. No `AccessDenied` error.
- **Fail**: `bun install` errors with "unable to write files to tempdir: AccessDenied".

## qmd MCP in Docker

- Pre-condition: `MEMORY.md` and `memory/` files exist with content.
- Start a session.
- **Pass**: The qmd MCP server connects. The qmd SessionStart hook creates collections. `qmd search "some query"` returns results.
- **Fail**: qmd server fails to start (missing binary, network blocked for `bunx`). Or collections aren't created. Or search returns nothing despite matching content.
- Verify: Debug log shows qmd MCP connected. `qmd collection list` shows `memory-root` and `memory-dir`.
- Verify: `bunx @tobilu/qmd --version` succeeds without network access. Check `iptables -L -n` confirms firewall is active.

## qmd Vector Search in Docker

- Pre-condition: `MEMORY.md` exists with content, e.g. "2026-03-19: Decided to use PostgreSQL for the analytics service."
- Build image: `docker build -t markus-test .`
- Verify model cache exists in image: `docker run --rm --entrypoint bash markus-test -c 'ls ~/.cache/qmd/models/hf_ggml-org_embeddinggemma-300M-Q8_0.gguf'`
- **Pass**: File exists. **Fail**: No such file.
- Start container with firewall: `docker run --rm -it --cap-add NET_ADMIN --cap-add NET_RAW -v markus-workspace:/workspace markus-test`
- After session starts, verify embeddings were generated: `qmd status` should show 0 documents needing embeddings.
- Run: `qmd vsearch "what database for analytics"` -- should return the PostgreSQL entry with a non-zero score.
- **Pass**: Results include the matching entry. **Fail**: "No results found" or hangs.
- Verify all three models cached: `docker run --rm --entrypoint bash markus-test -c 'ls ~/.cache/qmd/models/'` should show 3 `.gguf` files (embedding, reranker, generation).
