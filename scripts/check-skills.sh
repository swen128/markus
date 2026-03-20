#!/usr/bin/env bash
# CLAUDECODE_EXEMPT: Read-only linter that validates SKILL.md formatting
set -uo pipefail

SKILLS_DIR=".claude/skills"
errors=0
checked=0

current_file=""
error() {
  if [[ -n "$current_file" ]]; then
    echo "$current_file"
    current_file=""
  fi
  echo "  ERROR: $1"
  errors=$((errors + 1))
}

extract_field() {
  echo "$1" | awk -v key="$2" '
    BEGIN { found=0; val="" }
    found && /^[a-zA-Z_-]+:/ { exit }
    found { gsub(/^[ \t]+/, ""); val = val " " $0; next }
    $0 ~ "^"key":" {
      sub("^"key":[ ]*", "")
      if ($0 ~ /^[>|]-?$/ || $0 == "") { found=1; next }
      val = $0; exit
    }
    END { gsub(/^[ ]+|[ ]+$/, "", val); print val }
  '
}

_frontmatter_result=""
extract_frontmatter() {
  local file="$1"
  _frontmatter_result=""
  if [[ "$(head -1 "$file")" != "---" ]]; then
    error "missing opening frontmatter delimiter (---)"
    return 1
  fi
  if [[ "$(grep -c '^---$' "$file" || true)" -lt 2 ]]; then
    error "missing closing frontmatter delimiter (---)"
    return 1
  fi
  _frontmatter_result=$(awk 'NR==1{next} /^---$/{exit} {print}' "$file")
}

check_no_angle_brackets() {
  local field_name="$1" value="$2"
  if echo "$value" | grep -q '[<>]'; then
    error "${field_name} contains XML angle brackets (< >)"
  fi
}

check_kebab_case() {
  local label="$1" value="$2"
  if echo "$value" | grep -qE '[^a-z0-9-]'; then
    error "${label} '${value}' contains invalid characters (only lowercase letters, digits, and hyphens allowed)"
  fi
}

check_name() {
  local name_value="$1" folder_name="$2"
  if [[ -z "$name_value" ]]; then
    error "missing required field 'name'"
    return
  fi
  if [[ "$name_value" != "$folder_name" ]]; then
    error "name '${name_value}' does not match folder '${folder_name}'"
  fi
  check_kebab_case "name" "$name_value"
  check_no_angle_brackets "name" "$name_value"
  if echo "$name_value" | grep -qE '^(claude|anthropic)'; then
    error "name '${name_value}' uses reserved prefix 'claude' or 'anthropic'"
  fi
}

check_description() {
  local desc_value="$1"
  if [[ -z "$desc_value" ]]; then
    error "missing required field 'description'"
    return
  fi
  if [[ "${#desc_value}" -gt 1024 ]]; then
    error "description is ${#desc_value} chars (max 1024)"
  fi
  check_no_angle_brackets "description" "$desc_value"
}

for skill_dir in "$SKILLS_DIR"/*/; do
  skill_file="${skill_dir}SKILL.md"
  folder_name=$(basename "$skill_dir")

  if [[ ! -f "$skill_file" ]]; then
    current_file="$skill_dir"
    error "missing SKILL.md (must be exact case)"
    continue
  fi

  current_file="$skill_file"
  checked=$((checked + 1))

  extract_frontmatter "$skill_file" || continue
  frontmatter="$_frontmatter_result"

  check_name "$(extract_field "$frontmatter" "name")" "$folder_name"
  check_description "$(extract_field "$frontmatter" "description")"
  check_kebab_case "folder" "$folder_name"
done

echo ""
echo "Checked ${checked} skills, ${errors} error(s)."

if [[ "$errors" -gt 0 ]]; then
  exit 1
fi
