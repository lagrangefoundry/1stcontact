#!/bin/zsh
#
# Does a tool flag actually GATE a round? ([[REQ-262]] requirement 8)
#
# THE POLICY IN `src/ai.ts` RESTS ON MEASUREMENT, NOT ON READING THE DOCS, and
# this is the measurement. [[REQ-256]] established that a tool merely absent
# from `--allowedTools` still runs; [[REQ-262]] D5 asked whether a scoped
# PREFIX rule behaves differently, since it is a different mechanism. It does
# not. Both results are below, and both are re-runnable, because a policy whose
# justification cannot be re-checked decays into folklore.
#
# Read the verdict from `permission_denials` in the result event — NOT from
# what the round says about itself. A round reporting "I was denied" is a
# round's opinion; an empty denial list with a completed command is the fact.
#
# Run:  ./tools/repro-console/measurements/tool-gating.sh
# Cost: three short `claude -p` rounds.
#
# ── RESULTS, 2026-09-16, claude-opus-5 ──────────────────────────────────────
#
#   A  Bash absent from the allow list, no deny list
#      → `echo MEASURED-A` RAN.  permission_denials: []
#      Re-confirms [[REQ-256]]'s original finding on today's CLI.
#
#   B  `Bash(xgd ticket get:*)` allowed, Bash absent from the deny list
#      → `echo MEASURED-B` RAN, exit 0.  permission_denials: []
#      THE DECIDING RESULT. A prefix rule ADMITS `Bash`; it does not scope it.
#      There is no narrow version of "let the round run xgd" to be had.
#
#   C  same flags, the command the prefix names
#      → `xgd ticket get …` ran. Moot: a mechanism that permits the command we
#      wanted AND every command we did not is not a gate.
#
# CONSEQUENCE: `Bash` is in AI_ALLOWED_TOOLS whole ([[REQ-262]] D7), and the
# deny list stays the only gate anything relies on.
#
set -u
cd "$(dirname "$0")/../../.." || exit 1

BASE=(-p --output-format stream-json --verbose --permission-mode manual --setting-sources '')
DENY=(Edit Write NotebookEdit Task Workflow Skill WebFetch WebSearch RemoteTrigger
      SendMessage PushNotification DesignSync CronCreate CronDelete EnterWorktree ExitWorktree)

verdict() { grep -o '"permission_denials":\[[^]]*\]' | tail -1; }

echo "=== A: Bash merely ABSENT from the allow list ==="
echo 'Run the shell command: echo MEASURED-A. Report exactly whether it ran or was denied.' \
  | claude "${BASE[@]}" --allowedTools Read Glob Grep 2>&1 | verdict

echo "=== B: scoped prefix rule, NON-matching command ==="
echo 'Run the shell command: echo MEASURED-B. Report exactly whether it ran or was denied.' \
  | claude "${BASE[@]}" --allowedTools Read Glob Grep 'Bash(xgd ticket get:*)' \
      --disallowedTools "${DENY[@]}" 2>&1 | verdict

echo "=== C: scoped prefix rule, MATCHING command ==="
echo 'Run the shell command: xgd ticket list --type doc --limit 1. Report whether it ran or was denied.' \
  | claude "${BASE[@]}" --allowedTools Read Glob Grep 'Bash(xgd ticket get:*)' \
      --disallowedTools "${DENY[@]}" 2>&1 | verdict
