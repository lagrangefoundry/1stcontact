---
uid: report-c89e2900
id: REPORT-6834
type: report
title: 'Report: mode_override for story-a58a0974'
created_by: xgd
created_at: '2026-10-28T20:39:51.667115+00:00'
updated_at: '2026-10-28T20:39:51.667115+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: mode_override
  subject_uid: story-a58a0974
  anchor_ticket: bundle-5607a08d
  rule: code_frozen
  batch_index: 0
  parent_report_uid: report-9df9a171
  quality_mode: reconcile
  justification: REQ-174 (in window) requires the rename to leave nothing behind,
    with a guard that allows the old word in exactly one file, and requires a legacy-stored
    session to reopen and take an editing turn; AC-2054..2057 demand the same. No
    Node session can open while host.ts passes the rejected logDir, and system-knowledge.ts
    carries a straggler in a comment. The tip already has both changes (host.ts junctions
    line under REQ-452; no 'caretaker' outside roles.ts), so this ports tip behaviour
    and invents nothing.
  files:
  - tools/generate/src/cli/ai/host.ts
  - apps/control-app/src/system-knowledge.ts
  - tests/reconciliation-assistant-arrival-notice-budget.test.ts
  - tests/reconciliation-assistant-conversation-continuity.workers.test.ts
  - tests/reconciliation-assistant-conversation.test.ts
  tip_evidence:
  - file: tools/generate/src/cli/ai/host.ts
    lines: 233-237
  - file: apps/control-app/src/system-knowledge.ts
    lines: 198-222
  external_cause: null
  planner_trust_boundary: false
  granted_head: 3ec3c11a394cf3443f2a1b6dc62e176b6761bea1
---

# Mode override granted: code_frozen

REQ-174 (in window) requires the rename to leave nothing behind, with a guard that allows the old word in exactly one file, and requires a legacy-stored session to reopen and take an editing turn; AC-2054..2057 demand the same. No Node session can open while host.ts passes the rejected logDir, and system-knowledge.ts carries a straggler in a comment. The tip already has both changes (host.ts junctions line under REQ-452; no 'caretaker' outside roles.ts), so this ports tip behaviour and invents nothing.

Planner instructions for the batch:

Two causes, both already settled at the tip (reconcile-src-BUNDLE-32); port them, do not redesign. The iteration-1 plan was never executed (its filing was rejected on a tip_evidence range), so this is the first attempt. (1) Every failing test except AC2057 goes through nodeDeps() in tools/generate/src/cli/ai/host.ts (directly, or via startBuilder), and session construction throws `SessionManager: unknown option logDir — logDir is now junctions`. Replace `logDir: path.join(dir, 'live'),` at host.ts:213 with `junctions: lib.fileJunctions(path.join(dir, 'live')),` exactly as tip host.ts:233-237 does (its explanatory comment may come too). host-core.ts:636 already forwards deps.junctions. Port ONLY that line: do not bring over the tip's other nodeDeps additions (cases, extraSurfaces, workerKnowledge, audit), which belong to other intents. (2) AC2057 (REQ-174: the guard allows the old word in exactly one file) fails because four files besides roles.ts still contain 'caretaker': apps/control-app/src/system-knowledge.ts:192 (doc comment 'what this caretaker is for' -> use the tip's 'the role purpose' phrasing, cf. tip system-knowledge.ts:198-222; comment only, no code change); tests/reconciliation-assistant-arrival-notice-budget.test.ts:18 (comment names the old `caretakerReminder` symbol: use the current symbol name exported from roles.ts); tests/reconciliation-assistant-conversation-continuity.workers.test.ts:338 (comment: say 'consultant'); tests/reconciliation-assistant-conversation.test.ts:648 (the AC1405 deployed-header fixture `role: 'caretaker'` -> CONSULTANT_ROLE / 'consultant'; legacy-name resume is AC2056's job, which builds its legacy header at runtime from LEGACY and stays untouched). The AC2057 walk includes untracked files, so ensure no scratch file in the working tree carries the word. If your sandbox refuses local port binding (EPERM on listen), that is the environment, not the code: report it rather than altering the tests' startBuilder use. Keep the dependency_tests green: the looking-surface suite (AC2022-AC2035) supplies its own junctions, and AC1404-AC1410/AC1456/AC1651-AC1653/AC1792-AC1794 consume the same host and knowledge path.
