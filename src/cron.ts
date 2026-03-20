import { Cron } from "croner";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";

export const CronTaskSchema = z.object({
  id: z.string(),
  schedule: z.string(),
  prompt: z.string(),
});

export type CronTask = z.infer<typeof CronTaskSchema>;

export const normalizeSchedule = (schedule: string): string => {
  const m = schedule.match(/^every\s+(\d+)\s*(m|min|minutes?|h|hours?|s|seconds?)$/i);
  if (m === null || m[1] === undefined || m[2] === undefined) return schedule;

  const n = Number(m[1]);
  const unit = m[2].toLowerCase();

  return unit.startsWith("s")
    ? `*/${n} * * * * *`
    : unit.startsWith("m")
      ? `*/${n} * * * *`
      : unit.startsWith("h")
        ? `0 */${n} * * *`
        : schedule;
};

const tryReadFile = (path: string): Promise<string | null> =>
  readFile(path, "utf-8").catch(() => null);

const tryParseJson = (data: string): unknown[] | null => {
  try {
    const parsed: unknown = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const createCronManager = (dataDir: string, onFire: (task: CronTask) => void) => {
  const persistPath = `${dataDir}/crons.json`;
  const entries = new Map<string, { task: CronTask; job: Cron }>();

  const startJob = (task: CronTask): Cron =>
    new Cron(normalizeSchedule(task.schedule), () => onFire(task));

  const persist = async (): Promise<void> => {
    const tasks = [...entries.values()].map(({ task }) => task);
    await mkdir(dirname(persistPath), { recursive: true });
    await writeFile(persistPath, JSON.stringify(tasks, null, 2));
  };

  return {
    async create(task: CronTask): Promise<void> {
      entries.get(task.id)?.job.stop();
      entries.set(task.id, { task, job: startJob(task) });
      await persist();
    },

    async remove(id: string): Promise<boolean> {
      const entry = entries.get(id);
      if (!entry) return false;

      entry.job.stop();
      entries.delete(id);
      await persist();
      return true;
    },

    list: (): Array<CronTask & { nextRun: string | null }> =>
      [...entries.values()].map(({ task, job }) => ({
        ...task,
        nextRun: job.nextRun()?.toISOString() ?? null,
      })),

    async loadPersisted(): Promise<{ loaded: number; skipped: number } | null> {
      const data = await tryReadFile(persistPath);
      if (data === null) return null;

      const raw = tryParseJson(data);
      if (raw === null) return null;

      const results = raw.map((entry) => CronTaskSchema.safeParse(entry));
      const valid = results.filter((r) => r.success).map((r) => r.data);

      valid.map((task) => entries.set(task.id, { task, job: startJob(task) }));
      return { loaded: valid.length, skipped: raw.length - valid.length };
    },

    stopAll: (): void => {
      [...entries.values()].map(({ job }) => job.stop());
    },
  };
};
