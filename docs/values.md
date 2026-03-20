## All skills are model-invoked only

The user never runs `/markus:something` directly. They talk to Claude; Claude decides when to use markus skills.

## Memory is file-based

All memory lives in the workspace as markdown files. No database. No external service.

## No fallbacks, no degradation

If a dependency is unavailable, fail visibly. Never silently switch to a worse path.

## No speculation

Every claim in a bug report or investigation must be backed by evidence. If it can't be verified, label it as unverified.

## No workarounds

Fix root causes. Don't patch symptoms, bypass lint, loosen types, or add special cases for tests.
