#!/usr/bin/env bash
# Checks memory/ and MEMORY.md for format violations and prints
# corrective instructions for the model to fix them.
set -uo pipefail

violations=()

# Check for non-date-named .md files in memory/
if [[ -d memory ]]; then
  while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    name=$(basename "$file")
    if [[ "$name" == *.md ]] && ! [[ "$name" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}\.md$ ]]; then
      violations+=("memory/ contains a topic-based file: ${name}. Merge its content into today's memory/YYYY-MM-DD.md and delete it.")
    fi
  done < <(find memory -maxdepth 1 -type f -name '*.md' 2>/dev/null)
fi

# Check for YAML frontmatter in memory files
if [[ -d memory ]]; then
  while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    if head -1 "$file" 2>/dev/null | grep -q '^---$'; then
      violations+=("$(basename "$file") starts with YAML frontmatter (---). Remove the frontmatter block.")
    fi
  done < <(find memory -maxdepth 1 -type f -name '*.md' 2>/dev/null)
fi

# Check MEMORY.md for link-based format
if [[ -f MEMORY.md ]]; then
  if grep -qE '^\- \[.+\]\(.+\)' MEMORY.md; then
    violations+=("MEMORY.md uses link-based format (e.g. [file](path)). Rewrite entries as plain \"- <observation>\" lines under \"## YYYY-MM-DD\" headers.")
  fi
  if head -1 MEMORY.md 2>/dev/null | grep -q '^---$'; then
    violations+=("MEMORY.md starts with YAML frontmatter (---). Remove the frontmatter block.")
  fi
fi

if [[ ${#violations[@]} -gt 0 ]]; then
  echo "WARNING: Memory format violations detected."
  echo ""
  for v in "${violations[@]}"; do
    echo "- $v"
  done
  echo ""
  echo "Fix these violations now. See the reflect skill for the correct format."
fi
