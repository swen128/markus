import { access } from "node:fs/promises";
import { join } from "node:path";

const fileExists = (path: string): Promise<boolean> =>
  access(path).then(
    () => true,
    () => false,
  );

const main = async () => {
  const hasSoul = await fileExists(join(process.cwd(), "SOUL.md"));
  if (!hasSoul) {
    console.log(
      "SOUL.md not found. This workspace has no markus setup.\nRun the markus:bootstrap skill to initialize it.",
    );
  }
};

main().catch(() => process.exit(1));
