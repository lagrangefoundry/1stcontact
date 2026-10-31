---
uid: report-8aafab4a
id: REPORT-7079
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T22:41:26.815009+00:00'
updated_at: '2026-10-31T22:41:26.815009+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

Cherry-pick of 2470b440e3 ("Merge branch 'free-REQ-174' into xgd-working", the caretaker -> consultant role rename). Every conflicted file was resolved to HEAD (`git checkout --ours` + `git add`). Before that, I confirmed that the only working-tree differences from HEAD were the conflict blocks themselves (145 added lines, all markers or incoming sides). No other incoming hunks were auto-merged into these files. The staged result has no diff against HEAD: the commit is redundant (BUG-1109/BUG-1122 shape), not discarded.

- apps/control-app/src/ai.ts — code, 2c. HEAD already has the rename. Incoming re-imports CONSULTANT_PURPOSE from host-core and passes it to `sessionPriming(knowledge, PURPOSE)`. HEAD's later refactor (bundle-5607a08d) changed `sessionPriming` to take one argument, and host-core now owns where the purpose sits in the priming. Applying incoming would not type-check against HEAD.
- package.json — config, scalar. HEAD 0.2.48 vs incoming 0.2.46. Kept 0.2.48: taking incoming would downgrade the version that later merges (free-REQ-177) already bumped.
- tests/reconciliation-assistant-conversation-knowledge.test.ts — test. Incoming adds a local `PURPOSE` stand-in. HEAD imports the real CONSULTANT_PURPOSE from roles.ts and asserts the map/purpose/manual order against it (lines 41, 460-465), so the stand-in would be dead code.
- tests/reconciliation-beyond-l1-authoring.test.ts — test. HEAD is a superset: it adds a `definitionBefore` snapshot to AC1104. Incoming only lacks those lines. No test function removed.
- tests/reconciliation-page-composition-surface.test.ts — test. Same test function. HEAD's later name `..._carries_the_code_the_field_and_a_recovery_strategy` extends incoming's `..._carries_the_code_and_a_recovery_strategy`. No test function removed.
- tools/generate/src/cli/ai/host-core.ts — code. HEAD re-exports CONSULTANT_PURPOSE from ./roles, which has the identical new REQ-174 text, instead of declaring a second copy. HEAD builds the role from `priming`/`reminders` entry lists instead of `system`/`source`/`reminder`. HEAD keeps `const manager =` (used further down) and drops the per-turn `role.reminder =` mutation, now a reminder provider. These come from the later refactor on HEAD.
- tools/generate/src/cli/ai/host.ts — code. Incoming re-adds a `nodeDeps` function. HEAD already defines an exported `nodeDeps` at line 203 (plus the existing one at 263, which already uses CONSULTANT_PURPOSE). Taking incoming would add a duplicate declaration.

## Incoming changes preserved

Every REQ-174 change in the incoming commit is already in HEAD (checked with `git grep HEAD`):
- roles.ts: `CONSULTANT_ROLE = 'consultant'` (192), `LEGACY_ROLE_NAMES = ['caretaker']` (213), CONSULTANT_SYSTEM "You are a design consultant…" with "## What you are here for" (48, 54), `consultantReminder` with "Your client has changed…" (136, 148), REQ-174 rationale doc (28), CONSULTANT_PURPOSE with the new consultant wording (184).
- host-core.ts: imports LEGACY_ROLE_NAMES (59), registers the legacy names onto the same role (631), `createSession(CONSULTANT_ROLE…)` (729), `aiStatus` reports `[CONSULTANT_ROLE]` (898).
- No CARETAKER_* identifiers are left in ai.ts, host.ts, host-core.ts or roles.ts.

The incoming sides I dropped are not REQ-174 content. They are older code that HEAD's later refactor (bundle-5607a08d, stories story-58b2cec4 / story-a58a0974) already replaced, still renamed to consultant: the purpose constant moved to roles.ts, the role became entry lists, the reminder became a provider, and `sessionPriming` lost its purpose argument. Under the BUG-1301 precedence rule these hunks' targets were already removed by a legitimate, documented refactor in HEAD; the refactor's own comments in host-core.ts and ai.ts explain the move. No test function on either side was deleted.

Flag for post-merge review, per the enrichment rule: all seven files. The net change is nothing, and finalize should detect the empty staged diff and skip the commit.
