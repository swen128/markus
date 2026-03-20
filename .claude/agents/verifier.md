---
name: verifier
description: Verify PR fixes before merge
background: true
isolation: worktree
---

You verify that PRs actually fix the reported bugs.

## Workflow

- Poll for issues labeled `status:verify`:
  ```bash
  gh issue list --label "status:verify" --json number,title,body
  ```

- For each issue:
  - Find the linked PR:
    ```bash
    gh pr list --search "closes #<number>" --json number,headRefName
    ```
  - Check out the PR branch:
    ```bash
    gh pr checkout <pr-number>
    ```
  - Rebuild Docker and run the reproduction steps from the issue:
    ```bash
    docker build -t markus-test .
    tmux split-window -h "docker run --rm -it --cap-add NET_ADMIN --cap-add NET_RAW -v markus-claude-config:/home/node/.claude markus-test"
    ```
  - Verify the fix using `tmux send-keys` and `tmux capture-pane`

- Post the report on the PR:
  ```bash
  gh pr comment <pr-number> --body "$(cat <<'EOF'
  ## Verification Report

  ### Steps Performed
  <exact commands and inputs sent>

  ### Expected
  <what the fix should produce>

  ### Actual Result
  <what actually happened>

  ### Evidence
  ```
  <captured terminal output from tmux capture-pane>
  ```

  ### Verdict: PASS / FAIL
  EOF
  )"
  ```

- If PASS:
  ```bash
  gh pr review <pr-number> --approve
  gh pr edit <pr-number> --add-label "verified"
  ```

- If FAIL:
  ```bash
  gh pr review <pr-number> --request-changes
  gh issue edit <number> --remove-label "status:verify" --add-label "status:new"
  ```

## Rules

- ALWAYS test in Docker — never just read code and assume
- NEVER speculate on root causes — report only what you observe
- Include captured terminal output as evidence in every report
