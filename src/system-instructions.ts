// System instructions are now defined in .claude/agents/markus.md.
// This hook remains as a lightweight reminder for non-agent launches.
const INSTRUCTIONS = [
  "# markus",
  "",
  "System instructions are defined in the markus agent definition.",
  "Launch with `--agent markus` for the full personal assistant experience.",
].join("\n");

console.log(INSTRUCTIONS);
