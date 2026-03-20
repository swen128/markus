import { readFile } from "node:fs/promises";
import { join } from "node:path";

type FileEntry = { name: string; content: string };

const MAX_FILE_CHARS = 20_000;
const MAX_TOTAL_CHARS = 150_000;

const WORKSPACE_FILES = ["SOUL.md", "IDENTITY.md", "USER.md", "TOOLS.md", "MEMORY.md"];

const readOptionalFile = (path: string): Promise<string | null> =>
  readFile(path, "utf-8").catch(() => null);

const padTwo = (n: number) => String(n).padStart(2, "0");

const formatDate = (d: Date) =>
  `${d.getFullYear()}-${padTwo(d.getMonth() + 1)}-${padTwo(d.getDate())}`;

const todayStr = () => formatDate(new Date());

const yesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDate(d);
};

const truncate = (content: string, max: number): string => {
  if (content.length <= max) return content;
  const headSize = Math.floor(max * 0.7);
  const tailSize = Math.floor(max * 0.2);
  const head = content.slice(0, headSize);
  const tail = content.slice(-tailSize);
  const skipped = content.length - headSize - tailSize;
  return `${head}\n\n[... ${skipped} chars truncated ...]\n\n${tail}`;
};

const loadFiles = async (cwd: string, names: string[]): Promise<FileEntry[]> => {
  const pairs = await Promise.all(
    names.map(async (name) => ({ name, content: await readOptionalFile(join(cwd, name)) })),
  );
  return pairs.flatMap(({ name, content }) =>
    content !== null ? [{ name, content: truncate(content, MAX_FILE_CHARS) }] : [],
  );
};

const applyTotalLimit = (files: FileEntry[]): FileEntry[] => {
  const result: FileEntry[] = [];
  const remaining = { value: MAX_TOTAL_CHARS };
  files.map((file) => {
    if (remaining.value <= 0) return;
    const content = truncate(file.content, remaining.value);
    result.push({ name: file.name, content });
    remaining.value -= content.length;
  });
  return result;
};

const formatFiles = (files: FileEntry[]): string =>
  files.map(({ name, content }) => `--- ${name} ---\n${content}`).join("\n\n");

const main = async () => {
  const cwd = process.cwd();
  const workspaceFiles = await loadFiles(cwd, WORKSPACE_FILES);
  const dailyLogs = await loadFiles(cwd, [
    `memory/${yesterdayStr()}.md`,
    `memory/${todayStr()}.md`,
  ]);
  const allFiles = applyTotalLimit([...workspaceFiles, ...dailyLogs]);

  if (allFiles.length > 0) {
    console.log(formatFiles(allFiles));
  }
};

main().catch(() => process.exit(1));
