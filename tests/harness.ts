import { query, type SDKMessage, type SDKUserMessage } from "@anthropic-ai/claude-agent-sdk";
import { mkdtemp, readdir, readFile, cp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";

const PLUGIN_DIR = resolve(join(import.meta.dir, ".."));
const FIXTURES_DIR = resolve(join(import.meta.dir, "fixtures"));

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    fixture: { type: "string" },
    resume: { type: "string" },
    "max-turns": { type: "string" },
  },
  allowPositionals: true,
});

const prompt = positionals.join(" ");
if (!prompt) {
  console.error(
    "Usage: bun run tests/harness.ts --fixture <name> [--resume <session-id>] [--max-turns <n>] <prompt>",
  );
  process.exit(1);
}

const maxTurns = Number(values["max-turns"] ?? "15");

const listFiles = async (dir: string, prefix = ""): Promise<readonly string[]> => {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const nested = await Promise.all(
    entries.map((e) => {
      const p = prefix ? `${prefix}/${e.name}` : e.name;
      return e.isDirectory() ? listFiles(join(dir, e.name), p) : Promise.resolve([p]);
    }),
  );
  return nested.flat().sort();
};

const snapshot = async (dir: string) => {
  const files = await listFiles(dir);
  const pairs = await Promise.all(
    files.map(async (f) => [f, await readFile(join(dir, f), "utf-8")] satisfies [string, string]),
  );
  return { files, contents: Object.fromEntries(pairs) };
};

const setupCwd = async (): Promise<string> => {
  if (values.resume) {
    const dirs = await readdir(join(process.env.HOME ?? "", ".claude", "projects"));
    const sessionDir = dirs.find((d) => d.includes(values.resume!));
    if (!sessionDir) {
      console.error(`Cannot find session directory for: ${values.resume}`);
      process.exit(1);
    }
    return sessionDir.replaceAll("-", "/").replace(/^\//, "");
  }
  const fixtureName = values.fixture ?? "empty";
  const cwd = await mkdtemp(join(tmpdir(), `markus-test-${fixtureName}-`));
  if (fixtureName !== "empty") {
    await cp(join(FIXTURES_DIR, fixtureName), cwd, { recursive: true });
  }
  return cwd;
};

const pluginConfig: { type: "local"; path: string } = { type: "local", path: PLUGIN_DIR };

const collectMessages = async (cwd: string): Promise<readonly SDKMessage[]> => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 120_000);
  const messages: SDKMessage[] = [];

  // Gate the prompt behind MCP readiness so the model doesn't respond before
  // the bootstrap channel notification has a chance to arrive.
  let releasePrompt: () => void;
  const promptGate = new Promise<void>((resolve) => {
    releasePrompt = resolve;
  });
  let sessionId = "";
  let sessionIdResolve: () => void;
  const sessionIdReady = new Promise<void>((resolve) => {
    sessionIdResolve = resolve;
  });

  async function* promptStream(): AsyncGenerator<SDKUserMessage> {
    await promptGate;
    yield {
      type: "user",
      message: { role: "user", content: prompt },
      parent_tool_use_id: null,
      session_id: sessionId,
    };
  }

  const q = query({
    prompt: promptStream(),
    options: {
      cwd,
      maxTurns,
      plugins: [pluginConfig],
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      abortController: controller,
      ...(values.resume ? { resume: values.resume } : {}),
      env: { ...process.env, CLAUDE_CODE_DISABLE_AUTO_MEMORY: "1" },
    },
  });

  // Wait for the markus MCP server to be connected before releasing the prompt.
  const waitForMcp = async (): Promise<void> => {
    const MAX_WAIT_MS = 10_000;
    const POLL_MS = 100;
    const start = Date.now();
    while (Date.now() - start < MAX_WAIT_MS) {
      const statuses = await q.mcpServerStatus();
      const markus = statuses.find((s) => s.name === "markus");
      if (markus?.status === "connected") return;
      await new Promise<void>((r) => setTimeout(r, POLL_MS));
    }
    // Timed out — release anyway so the harness doesn't hang.
  };

  Promise.all([waitForMcp(), sessionIdReady]).then(() => releasePrompt!());

  for await (const msg of q) {
    messages.push(msg);
    if (msg.type === "system" && msg.subtype === "init") {
      sessionId = msg.session_id;
      sessionIdResolve!();
    }
    if (msg.type === "result") {
      q.close();
      break;
    }
  }
  return messages;
};

const extractTools = (messages: readonly SDKMessage[]): readonly string[] =>
  messages.flatMap((m) =>
    m.type === "assistant"
      ? (m.message.content ?? []).flatMap((b: { type: string; name?: string }) =>
          b.type === "tool_use" ? [b.name ?? "unknown"] : [],
        )
      : [],
  );

const extractResult = (messages: readonly SDKMessage[]) => {
  const result = messages.find((m) => m.type === "result");
  if (!result || result.type !== "result") return { sessionId: "", response: "" };
  if (result.subtype !== "success")
    return { sessionId: result.session_id, response: `[${result.subtype}]` };
  return { sessionId: result.session_id, response: result.result };
};

const cwd = await setupCwd();
const before = await snapshot(cwd);
const messages = await collectMessages(cwd);
const { sessionId, response } = extractResult(messages);
const tools = extractTools(messages);
const after = await snapshot(cwd);

const created = after.files.filter((f) => !before.files.includes(f));
const deleted = before.files.filter((f) => !after.files.includes(f));
const modified = after.files.filter(
  (f) => before.files.includes(f) && before.contents[f] !== after.contents[f],
);

console.log(`session=${sessionId}`);
console.log(`workspace=${cwd}`);
console.log(`tools=${tools.join(",") || "(none)"}`);
console.log(`\n--- response ---`);
console.log(response);
console.log(`\ncreated=${created.join(",") || "(none)"}`);
console.log(`modified=${modified.join(",") || "(none)"}`);
console.log(`deleted=${deleted.join(",") || "(none)"}`);

[...created, ...modified].forEach((f) => {
  console.log(`\n--- ${f} ---`);
  console.log(after.contents[f]);
});

process.exit(0);
