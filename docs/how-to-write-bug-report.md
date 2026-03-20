## Template

```markdown
## Overview

<One sentence: what is broken.>

## Expected

<What should happen under normal conditions.>

## Actual Result

<What actually happens. Quote exact output.>

## Evidence

| # | Finding | Source |
|---|---------|--------|
| 1 | <concrete finding> | <tmux capture-pane output / debug log line / file:line> |
| 2 | ... | ... |

## Reproduction Steps

1. <exact command or action>
2. <exact command or action>
3. ...
```

## Strict Rules

### Language Rules

The report MUST NOT contain any of these hedge words or phrases:

> likely, unlikely, maybe, perhaps, possibly, probably, might, could (expressing uncertainty),
> appears to, seems to, seems like, it looks like, we think, we believe,
> should be (expressing uncertainty), in theory

Every statement must be either:
- A **fact** backed by cited evidence in the Evidence table, OR
- Explicitly labeled as **[UNVERIFIED]** with a note on what evidence is missing

### Evidence Rules

- Terminal output: exact captured text from `tmux capture-pane`
- Debug logs: timestamp and log file path
- Code references: markdown link with `file:line` as link text and GitHub permalink with commit SHA as URL (e.g., `[/path/to/file.ts:142](https://github.com/swen128/markus/blob/<commit-sha>/path/to/file.ts#L142)`). Run `git rev-parse HEAD` to get the current commit SHA.
- Docker state: exact `docker` command used and its output

