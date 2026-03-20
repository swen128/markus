import { describe, test, expect, afterEach } from "bun:test";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import { normalizeSchedule, createCronManager, CronTaskSchema } from "./cron.ts";

describe("normalizeSchedule", () => {
  test("passes through standard cron expressions unchanged", () => {
    expect(normalizeSchedule("*/30 * * * *")).toBe("*/30 * * * *");
    expect(normalizeSchedule("0 9 * * MON")).toBe("0 9 * * MON");
  });

  test("converts 'every Nm' to minute cron", () => {
    expect(normalizeSchedule("every 30m")).toBe("*/30 * * * *");
    expect(normalizeSchedule("every 5min")).toBe("*/5 * * * *");
    expect(normalizeSchedule("every 1minute")).toBe("*/1 * * * *");
    expect(normalizeSchedule("every 10minutes")).toBe("*/10 * * * *");
  });

  test("converts 'every Nh' to hour cron", () => {
    expect(normalizeSchedule("every 2h")).toBe("0 */2 * * *");
    expect(normalizeSchedule("every 1hour")).toBe("0 */1 * * *");
    expect(normalizeSchedule("every 6hours")).toBe("0 */6 * * *");
  });

  test("converts 'every Ns' to second cron", () => {
    expect(normalizeSchedule("every 30s")).toBe("*/30 * * * * *");
    expect(normalizeSchedule("every 5seconds")).toBe("*/5 * * * * *");
  });

  test("is case insensitive", () => {
    expect(normalizeSchedule("Every 30M")).toBe("*/30 * * * *");
    expect(normalizeSchedule("EVERY 2H")).toBe("0 */2 * * *");
  });
});

describe("createCronManager", () => {
  const managers: ReturnType<typeof createCronManager>[] = [];

  const setup = async () => {
    const dir = await mkdtemp(join(tmpdir(), "markus-test-"));
    const fired: z.infer<typeof CronTaskSchema>[] = [];
    const manager = createCronManager(dir, (task) => fired.push(task));
    managers.push(manager);
    return { dir, fired, manager };
  };

  afterEach(() => {
    managers.map((m) => m.stopAll());
    managers.length = 0;
  });

  test("create and list", async () => {
    const { manager } = await setup();

    await manager.create({ id: "test", schedule: "*/5 * * * *", prompt: "hello" });
    const tasks = manager.list();

    expect(tasks).toMatchObject([{ id: "test", schedule: "*/5 * * * *", prompt: "hello" }]);
    expect(tasks).toHaveLength(1);
    expect(tasks.every((t) => typeof t.nextRun === "string")).toBe(true);
  });

  test("list returns empty when no tasks", async () => {
    const { manager } = await setup();
    expect(manager.list()).toHaveLength(0);
  });

  test("create replaces existing task with same id", async () => {
    const { manager } = await setup();

    await manager.create({ id: "test", schedule: "*/5 * * * *", prompt: "first" });
    await manager.create({ id: "test", schedule: "*/10 * * * *", prompt: "second" });

    expect(manager.list()).toMatchObject([
      { id: "test", schedule: "*/10 * * * *", prompt: "second" },
    ]);
  });

  test("remove deletes a task and returns true", async () => {
    const { manager } = await setup();

    await manager.create({ id: "test", schedule: "*/5 * * * *", prompt: "hello" });
    expect(await manager.remove("test")).toBe(true);
    expect(manager.list()).toHaveLength(0);
  });

  test("remove returns false for nonexistent id", async () => {
    const { manager } = await setup();
    expect(await manager.remove("nope")).toBe(false);
  });

  test("persists tasks to disk", async () => {
    const { dir, manager } = await setup();

    await manager.create({ id: "a", schedule: "*/5 * * * *", prompt: "alpha" });
    await manager.create({ id: "b", schedule: "*/10 * * * *", prompt: "beta" });

    const raw = z
      .array(CronTaskSchema)
      .parse(JSON.parse(await readFile(join(dir, "crons.json"), "utf-8")));
    expect(raw).toHaveLength(2);
    expect(raw.map((t) => t.id).sort()).toEqual(["a", "b"]);
  });

  test("remove persists deletion to disk", async () => {
    const { dir, manager } = await setup();

    await manager.create({ id: "a", schedule: "*/5 * * * *", prompt: "alpha" });
    await manager.create({ id: "b", schedule: "*/10 * * * *", prompt: "beta" });
    await manager.remove("a");

    const raw = z
      .array(CronTaskSchema)
      .parse(JSON.parse(await readFile(join(dir, "crons.json"), "utf-8")));
    expect(raw).toMatchObject([{ id: "b" }]);
  });

  test("loadPersisted restores tasks from disk", async () => {
    const { dir } = await setup();
    await writeFile(
      join(dir, "crons.json"),
      JSON.stringify([
        { id: "a", schedule: "*/5 * * * *", prompt: "alpha" },
        { id: "b", schedule: "*/10 * * * *", prompt: "beta" },
      ]),
    );

    const manager2 = createCronManager(dir, () => {});
    managers.push(manager2);
    const result = await manager2.loadPersisted();

    expect(result).toEqual({ loaded: 2, skipped: 0 });
    expect(
      manager2
        .list()
        .map((t) => t.id)
        .sort(),
    ).toEqual(["a", "b"]);
  });

  test("loadPersisted skips invalid entries", async () => {
    const { dir } = await setup();
    await writeFile(
      join(dir, "crons.json"),
      JSON.stringify([
        { id: "good", schedule: "*/5 * * * *", prompt: "ok" },
        { id: 123, schedule: "*/5 * * * *", prompt: "bad id" },
        { schedule: "*/5 * * * *", prompt: "missing id" },
        "not an object",
      ]),
    );

    const manager2 = createCronManager(dir, () => {});
    managers.push(manager2);
    const result = await manager2.loadPersisted();

    expect(result).toEqual({ loaded: 1, skipped: 3 });
    expect(manager2.list()).toMatchObject([{ id: "good" }]);
  });

  test("loadPersisted handles missing file", async () => {
    const { manager } = await setup();
    const result = await manager.loadPersisted();
    expect(result).toBeNull();
    expect(manager.list()).toHaveLength(0);
  });

  test("loadPersisted handles corrupt JSON", async () => {
    const { dir } = await setup();
    await writeFile(join(dir, "crons.json"), "{not valid json");

    const manager2 = createCronManager(dir, () => {});
    managers.push(manager2);
    const result = await manager2.loadPersisted();
    expect(result).toBeNull();
    expect(manager2.list()).toHaveLength(0);
  });

  test("fires callback on schedule", async () => {
    const { fired, manager } = await setup();

    await manager.create({ id: "fast", schedule: "every 1s", prompt: "tick" });
    await new Promise((resolve) => setTimeout(resolve, 1500));

    expect(fired.length).toBeGreaterThanOrEqual(1);
    expect(fired.every((t) => t.id === "fast" && t.prompt === "tick")).toBe(true);
  });

  test("stopped task does not fire", async () => {
    const { fired, manager } = await setup();

    await manager.create({ id: "fast", schedule: "every 1s", prompt: "tick" });
    await manager.remove("fast");
    await new Promise((resolve) => setTimeout(resolve, 1500));

    expect(fired).toHaveLength(0);
  });
});
