---
uid: report-d3db4ce3
id: REPORT-3083
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T21:32:08.816937+00:00'
updated_at: '2026-08-31T21:32:08.816937+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `apps/control-app/wrangler.toml` — **UU**, code/config file. Both sides carry
  the SAME free-coded subject (`chore(control-app): retain invocation logs
  [FREE-CODED]`), i.e. this commit's effect had already reached HEAD by another
  route. The incoming commit's entire payload — `[observability]` at the top
  level and `[env.production.observability]` declared AFTER `routes` — is
  already present verbatim in HEAD at lines 35-37 and 148-150. The only
  conflicting hunk was ambient comment drift: HEAD carries a later-added
  comment block ("THE DEPLOYED GATE'S CONFIGURATION…") that the incoming
  commit's older base predates and never touched. Resolved to HEAD
  (`git checkout --ours`), which is a strict superset of incoming for this file.

- `package.json` — **UU**, version scalar only. HEAD `0.2.14` vs incoming
  `0.2.12`. HEAD is the higher, later version; the incoming bump is free-coded
  bookkeeping, not code. Kept HEAD's `0.2.14`.

The commit's third file, `tests/test_UAT_FC_BUG-37_observability.test.ts`,
merged without conflict and is present in the tree (4007 bytes). No test
function was deleted or altered.

## Incoming changes preserved

- `apps/control-app/wrangler.toml` — CONFIRMED present. `git diff HEAD
  <CHERRY_PICK_HEAD> -- apps/control-app/wrangler.toml` shows no `+` line
  containing `observability`, `enabled`, or `head_sampling_rate`: every change
  the incoming commit authored in this file is already in HEAD, in the required
  order (production table after `routes`). What that diff *does* show is HEAD
  moving ahead of the incoming side independently — expanded `[vars]` comments
  and `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD` deliberately emptied at the top level
  (REQ-147). Those are HEAD-side changes made after this commit; taking `--ours`
  preserves them and discards nothing the developer wrote here.

- `package.json` — no developer code involved; version scalar only.

No hunk was dropped under the BUG-1301 precedence exception; none was needed.

## Net result

The staged tree has no diff against HEAD (`git diff --cached --stat HEAD` is
empty) and no conflict-class entries remain in `git status --porcelain`. This is
the redundant-commit case (BUG-1109 / BUG-1122), not a discard: STEP 3's check
confirms the incoming commit's key changes ARE present in HEAD rather than
absent. Per STEP 4, `--skip` was not called; the finalize step will detect the
clean staged diff. No `git cherry-pick` state transition was performed —
CHERRY_PICK_HEAD is intact.
