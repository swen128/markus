import { access } from "node:fs/promises";
import { join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createCronManager } from "./cron.ts";

const dataDir = process.env.CLAUDE_PLUGIN_DATA ?? `${process.env.HOME}/.claude/plugins/data/markus`;

const main = async () => {
  const mcp = new McpServer(
    { name: "markus", version: "0.1.0" },
    {
      capabilities: {
        experimental: { "claude/channel": {} },
      },
      instructions:
        "Persistent memory and scheduled tasks. Use cron tools to schedule periodic reminders. When a cron notification arrives, consider running the markus:reflect skill to persist observations to memory.",
    },
  );

  const cron = createCronManager(dataDir, (task) => {
    mcp.server
      .notification({
        method: "notifications/claude/channel",
        params: {
          content: task.prompt,
          meta: {
            event_type: "cron",
            cron_id: task.id,
            fired_at: new Date().toISOString(),
          },
        },
      })
      .then(() => console.error(`[markus] Cron fired: ${task.id}`))
      .catch((err) => console.error(`[markus] Notification error for ${task.id}:`, err));
  });

  const loaded = await cron.loadPersisted();
  if (loaded !== null) {
    console.error(
      `[markus] Loaded ${loaded.loaded} persisted cron tasks (${loaded.skipped} skipped)`,
    );
  }

  mcp.registerTool(
    "cron_create",
    {
      description:
        'Register a scheduled task. Schedule accepts cron expressions ("*/30 * * * *") or intervals ("every 30m", "every 2h"). The prompt is sent as a channel notification when the schedule fires.',
      inputSchema: {
        id: z.string().describe("Unique identifier for this cron task"),
        schedule: z
          .string()
          .describe('Cron expression or interval (e.g. "*/30 * * * *", "every 30m")'),
        prompt: z.string().describe("Notification text sent when the schedule fires"),
      },
    },
    async ({ id, schedule, prompt }) => {
      await cron.create({ id, schedule, prompt });
      const created = cron.list().find((t) => t.id === id);
      return {
        content: [
          {
            type: "text",
            text: `Cron "${id}" created. Next run: ${created?.nextRun ?? "unknown"}`,
          },
        ],
      };
    },
  );

  mcp.registerTool(
    "cron_list",
    {
      description: "List all registered cron tasks with their next run time.",
    },
    () => {
      const tasks = cron.list();
      const text =
        tasks.length === 0
          ? "No cron tasks registered."
          : tasks
              .map((t) => `- ${t.id}: "${t.schedule}" → next: ${t.nextRun ?? "unknown"}`)
              .join("\n");
      return { content: [{ type: "text", text }] };
    },
  );

  mcp.registerTool(
    "cron_delete",
    {
      description: "Remove a scheduled cron task by ID.",
      inputSchema: {
        id: z.string().describe("ID of the cron task to remove"),
      },
    },
    async ({ id }) => {
      const removed = await cron.remove(id);
      return {
        content: [
          { type: "text", text: removed ? `Cron "${id}" deleted.` : `Cron "${id}" not found.` },
        ],
      };
    },
  );

  const transport = new StdioServerTransport();
  await mcp.connect(transport);
  console.error("[markus] Channel server started");

  const soulExists = await access(join(process.cwd(), "SOUL.md")).then(
    () => true,
    () => false,
  );
  if (!soulExists) {
    await mcp.server.notification({
      method: "notifications/claude/channel",
      params: {
        content:
          "SOUL.md not found. This workspace has no markus setup. Run the markus:bootstrap skill now to initialize it.",
        meta: { event_type: "bootstrap_nudge" },
      },
    });
    console.error("[markus] Bootstrap nudge sent via channel notification");
  }
};

main().catch((err) => {
  console.error("[markus] Fatal:", err);
  process.exit(1);
});
