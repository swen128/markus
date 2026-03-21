# Test Plan

## Harness timing

### Harness waits for MCP servers before sending prompt (unit)
- Start a `query()` with streaming prompt input
- Assert the prompt is not yielded until `mcpServerStatus()` reports the markus server as `connected`
- Assert `session_id` on the yielded `SDKUserMessage` matches the init message's `session_id`

### Harness falls back after timeout (unit)
- If MCP server never connects, the prompt is still sent after the timeout (10 s)
- Assert the harness does not hang indefinitely
