# markus

A Claude Code plugin that gives Claude persistent memory and scheduled autonomous tasks. The user interacts with Claude through Telegram or other messaging channels — markus runs in the background, maintaining memory and executing scheduled work.

Inspired by [OpenClaw](https://github.com/openclaw/openclaw)'s workspace memory system, adapted for Claude Code plugins.

## Design Principles

- **All skills are model-invoked only.** The user never runs `/markus:something` directly. They talk to Claude via Telegram or other channels; Claude decides when to use markus skills.
- **Session-scoped execution.** Cron tasks only fire while a Claude Code session is running. This plugin is not an external scheduler. Cron definitions are persistent — they survive restarts and are restored when the session starts again.
- **Memory is file-based.** All memory lives in the project workspace as markdown files, version-controllable with git.

## Workspace Files

Following OpenClaw's workspace memory model, markus manages these files in the project root:

| File | Purpose | Mutability |
|---|---|---|
| `SOUL.md` | Agent personality, values, behavioral guidelines | Curated, actively maintained |
| `IDENTITY.md` | Agent name, emoji, avatar, vibe | Rarely changed |
| `USER.md` | User profile — name, pronouns, timezone, preferences | Updated as learned |
| `MEMORY.md` | Long-term curated memories — decisions, observations, context | Append-only, periodically compacted |
| `memory/YYYY-MM-DD.md` | Daily append-only session logs, raw notes | Append-only, one per day |
| `AGENTS.md` | Workspace conventions, safety rules, collaboration guidelines | Curated |
| `TOOLS.md` | User's tool-specific notes (SSH hosts, device names, shortcuts) | Updated as learned |

On session start, a SessionStart hook outputs the contents of `SOUL.md`, `IDENTITY.md`, `USER.md`, `AGENTS.md`, and `TOOLS.md`. This hook output is injected into the session context (it does not modify `CLAUDE.md`). `MEMORY.md` and daily logs are too large for injection — they're searched on demand via the `memory-search` skill.

## Components

### MCP Channel Server (`src/server.ts`)

A channel-capable MCP server providing cron tools and timed notifications.

**Tools** (callable by Claude):

- `cron_create(id, schedule, prompt)` — Register a scheduled task. `schedule` accepts cron expressions (`*/30 * * * *`) or intervals (`every 30m`). `prompt` is the channel notification text sent when the schedule fires.
- `cron_list()` — List registered cron tasks with next run time.
- `cron_delete(id)` — Remove a scheduled task.

**Persistence**: Crons are saved to `${CLAUDE_PLUGIN_DATA}/crons.json` and restored on server startup. Global across projects — cron tasks belong to the agent, not a specific workspace.

**Channel notifications**: When a cron fires:
```json
{
  "content": "<the prompt>",
  "meta": {
    "event_type": "cron",
    "cron_id": "<id>",
    "fired_at": "<ISO timestamp>"
  }
}
```

Claude receives this between turns and decides how to act on it.

### Skills (all model-invoked)

#### `markus:reflect`

Reviews the current conversation context and extracts noteworthy items into memory files. This is the primary skill that cron notifications prompt Claude to use.

When invoked:
1. Read current conversation context (what's visible in the context window — earlier turns may be compacted)
2. Read today's `memory/YYYY-MM-DD.md` to avoid duplicates
3. Identify new decisions, observations, preferences, or context worth persisting
4. Append to `memory/YYYY-MM-DD.md`
5. If a memory is significant enough for long-term retention, also append to `MEMORY.md`
6. Output nothing if nothing noteworthy happened

#### `markus:memory-search`

Search across `MEMORY.md`, `TOOLS.md`, and `memory/*.md` files for relevant prior context. Claude uses this before answering questions about past decisions, preferences, or prior work.

When invoked:
1. Grep across memory files for the query
2. Return matching entries with file path and date
3. Claude uses these to ground its response

#### `markus:memory-compact`

Summarize and deduplicate old entries in `MEMORY.md` to keep it manageable. Promotes important items from daily logs into `MEMORY.md` and removes redundant entries.

#### `markus:soul-update`

Modify `SOUL.md` based on observed user preferences or explicit instructions. Claude invokes this when it notices a consistent behavioral preference worth codifying.

#### `markus:bootstrap`

First-run onboarding. Triggered when `SOUL.md` does not exist in the workspace (indicating no prior setup). Copies templates into the workspace, then walks the user through onboarding — asking about preferences, personality, and conventions to populate `SOUL.md`, `IDENTITY.md`, `USER.md`, and `AGENTS.md`.

#### `markus:user-update`

Update `USER.md` when Claude learns new information about the user (timezone, name, preferences). Invoked automatically when relevant facts are mentioned.

### Hooks

**SessionStart**: Inject workspace memory files into context.
```json
{
  "type": "command",
  "command": "for f in SOUL.md IDENTITY.md USER.md AGENTS.md TOOLS.md; do [ -f \"$f\" ] && echo \"--- $f ---\" && cat \"$f\" && echo; done"
}
```
Hook output is injected into the session context (does not modify `CLAUDE.md`), so Claude always has the personality, user profile, and tool notes loaded.

**SessionStart**: Install dependencies.
```json
{
  "type": "command",
  "command": "diff -q \"${CLAUDE_PLUGIN_ROOT}/package.json\" \"${CLAUDE_PLUGIN_DATA}/package.json\" >/dev/null 2>&1 || (cp \"${CLAUDE_PLUGIN_ROOT}/package.json\" \"${CLAUDE_PLUGIN_DATA}/package.json\" && cd \"${CLAUDE_PLUGIN_DATA}\" && bun install --frozen-lockfile 2>/dev/null || (rm -f \"${CLAUDE_PLUGIN_DATA}/package.json\" && false))"
}
```

## Directory Structure

```
markus/
├── .claude-plugin/
│   └── plugin.json
├── .mcp.json
├── hooks/
│   └── hooks.json
├── skills/
│   ├── reflect/
│   │   └── SKILL.md
│   ├── memory-search/
│   │   └── SKILL.md
│   ├── memory-compact/
│   │   └── SKILL.md
│   ├── soul-update/
│   │   └── SKILL.md
│   ├── bootstrap/
│   │   └── SKILL.md
│   └── user-update/
│       └── SKILL.md
├── templates/
│   ├── SOUL.md
│   ├── IDENTITY.md
│   ├── USER.md
│   ├── AGENTS.md
│   ├── TOOLS.md
│   └── BOOTSTRAP.md
├── src/
│   ├── server.ts
│   └── cron.ts
├── package.json
├── tsconfig.json
└── bun.lock
```

## Dependencies

- `@modelcontextprotocol/sdk` — MCP server SDK
- `croner` — Cron expression parser

## Usage

Install:
```bash
/plugin marketplace add swen128/claude-plugins
/plugin install markus@harness
```

Launch with channel:
```bash
claude --dangerously-load-development-channels plugin:markus@harness
```

On first run, if `SOUL.md` doesn't exist in the workspace, the bootstrap skill triggers and walks the user through onboarding.

Typical cron setup (Claude does this when asked via Telegram):
```
User (via Telegram): "Reflect on what we've been doing every 30 minutes"
Claude calls: cron_create("reflect", "*/30 * * * *", "Time for periodic reflection. Review the recent conversation and save anything noteworthy to memory.")
```

Every 30 minutes, the notification arrives, and Claude considers running the reflect skill to persist observations.
