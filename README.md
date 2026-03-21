# Markus

A Claude Code plugin that turns Claude into your personal assistant. It knows you, remembers your context across sessions, and acts autonomously on your behalf.

## Getting started

Requires [Bun](https://bun.sh) and a Claude.ai account (not API key).

```bash
/plugin marketplace add swen128/markus
/plugin install markus@markus
claude --agent markus --dangerously-load-development-channels plugin:markus@markus
```

On first session, Markus introduces itself and asks about you — your name, preferences, how you like to work. Everything it learns carries over to the next session.

Markus works best when paired with a messaging channel so it can reach you outside the terminal. Install the [Telegram](https://github.com/anthropics/claude-plugins-official/tree/main/external_plugins/telegram) or [Discord](https://github.com/anthropics/claude-plugins-official/tree/main/external_plugins/discord) plugin and launch with both:

```bash
claude --agent markus --channels plugin:telegram@claude-plugins-official \
       --dangerously-load-development-channels plugin:markus@markus
```

## What you can do

**It remembers you.** Share something once — your timezone, your coding style, a project decision — and Markus writes it down. Next session, it already knows.

```
You: My timezone is Asia/Tokyo and I prefer tabs over spaces.
     (Markus updates your profile and remembers for next time)

--- next session ---

You: What's my timezone?
     → Asia/Tokyo
```

**It reflects on what happened.** Ask it to periodically review the conversation and save anything worth remembering — decisions, preferences, context.

```
You: Every 30 minutes, reflect on what we've been doing and save anything important.
     (Markus schedules a cron task and reflects autonomously.)
```

**It acts on a schedule.** Cron tasks fire as channel notifications between your messages, so Markus can act without you prompting it.

```
You: Every morning at 9am, check my deployment status and summarize it.
     (Markus schedules the task and runs it autonomously.)
```

**It has personality.** Markus maintains a `SOUL.md` that defines how it behaves — tone, style, values. You can shape it over time.

```
You: From now on, always respond in bullet points.
     (Markus updates SOUL.md. Next session, it still uses bullet points.)
```
