---
uid: report-51071b3d
id: REPORT-7311
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T05:48:18.543480+00:00'
updated_at: '2026-11-01T05:48:18.543480+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

Incoming commit 2470b440e3 ("Merge branch 'free-REQ-174' into xgd-working") is the REQ-174 rename caretaker -> consultant. HEAD already contains that rename in full (and later rework built on it), so every conflict resolved to the HEAD side. The commit's 12 non-conflicting files auto-merged with zero diff, which confirms it is redundant on this branch. Staged result = no net diff vs HEAD (redundant commit, BUG-1109/BUG-1122 shape).

- apps/control-app/src/ai.ts (code, 2c): HEAD. Incoming `sessionPriming(knowledge, CONSULTANT_PURPOSE)` and its import are superseded: HEAD's host-core now places the purpose itself in the role's entry list, and `sessionPriming` takes only `knowledge`.
- package.json (config, scalar): HEAD 0.2.57. Incoming 0.2.46 is an older bump; taking it would downgrade the version.
- tests/reconciliation-assistant-conversation-knowledge.test.ts (test, 2c): HEAD. The incoming `PURPOSE` const comment is a rename only. HEAD asserts against the imported `CONSULTANT_PURPOSE` from roles.ts.
- tests/reconciliation-beyond-l1-authoring.test.ts (test, 2c/2f): HEAD. Keeps the `definitionBefore` byte-identity assertions in AC1104, which incoming lacks only because it predates them. The incoming caretaker->consultant renames are already present.
- tests/reconciliation-page-composition-surface.test.ts (test, 2c/2f): HEAD. Keeps the later test name `..._carries_the_code_the_field_and_a_recovery_strategy`. No test removed. The rename is already present.
- tools/generate/src/cli/ai/host-core.ts (code, 2c): HEAD. Incoming re-declares `CONSULTANT_PURPOSE` (HEAD re-exports the identical string from roles.ts:184), constructs Role with `system`/`source`/`reminder` (HEAD uses the `priming`/`reminders` entry-list API, and its own comment notes the old keys are silently ignored upstream), and refreshes `role.reminder` in streamPrompt (HEAD resolves it per turn through a REMINDER_PROVIDER). `LEGACY_ROLE_NAMES` aliasing is already in HEAD.
- tools/generate/src/cli/ai/host.ts (code, 2c): HEAD. The incoming hunk re-adds `nodeDeps`, which HEAD already defines (exported, line 203) using `CONSULTANT_PURPOSE`. Taking incoming would duplicate the declaration.

## Incoming changes preserved

Every substantive REQ-174 change is already present in HEAD:
- CONSULTANT_ROLE/CONSULTANT_SYSTEM/consultantReminder: present.
- CONSULTANT_PURPOSE: present, with identical text, in roles.ts and re-exported from host-core.
- LEGACY_ROLE_NAMES = ['caretaker'] and the multi-name SessionManager map: present.
- createSession/aiStatus use CONSULTANT_ROLE: present.
- All test caretaker() -> consultant() and L1_INSTANCES.consultant renames: present.
- test_UAT_FC_REQ-174_consultant_role.test.ts: present (auto-merged, zero diff).

`git grep -i caretaker` finds the word only in roles.ts's explanatory comment and LEGACY_ROLE_NAMES. The dropped hunks target code HEAD has since refactored (entry-list Role API, provider-based reminder, purpose moved to roles.ts, nodeDeps relocated). These are the BUG-1301 precedence case, not discards.

Flagged for post-merge review per enrichment rule: all 7 files, though I expect no action (net diff vs HEAD is empty).
