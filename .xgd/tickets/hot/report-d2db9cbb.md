---
uid: report-d2db9cbb
id: REPORT-7657
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T14:52:18.978416+00:00'
updated_at: '2026-11-01T14:52:18.978416+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

Incoming commit 9af6bdf02e ("Merge branch 'free-REQ-168' into xgd-working", 2026-09-02 20:27:31) is a DUPLICATE: the same merge was already cherry-picked onto this branch as e092ba69d2 (identical subject/author date, same patch modulo line offsets). All 23 non-conflicting files in the incoming commit merged to content identical to HEAD. Conflicts arise only because later free-coded merges already on HEAD — f97867a847 free-REQ-184 (2026-09-04 17:12) and c6a3db1a65 free-REQ-178 (2026-09-04 17:24), plus free-REQ-180 — further evolved the same regions. Both sides are free_coded, so the later working-timeline position (HEAD) wins.

- apps/control-app/src/identity.ts — code (2c), both-free_coded later-timeline rule: kept HEAD
- apps/control-app/src/index.ts — code (2c), later-timeline: kept HEAD
- apps/control-app/src/router.ts — code (2c), later-timeline: kept HEAD
- apps/control-app/src/scope.ts — AA (2b): HEAD is the superset (REQ-168 scope + REQ-184 business_id rename, Scope|null, NoBusinessError); kept HEAD
- apps/control-app/wrangler.toml — config (2g): HEAD adds the `wrangler dev`-only [vars] comment paragraph; incoming side was empty there; kept HEAD
- tests/support/d1-site-factory.ts — test support (2c), later-timeline: kept HEAD
- tests/test_UAT_FC_REQ-167_identity.workers.test.ts — UAT (2f), later-timeline: kept HEAD; no test functions removed
- tests/test_UAT_FC_REQ-168_scope.workers.test.ts — AA UAT (2b/2f): HEAD is the superset version; kept HEAD; no test functions removed
- tests/test_UAT_FC_REQ-178_businesses.workers.test.ts — UAT (2f), later-timeline: kept HEAD

Staged index equals HEAD (no net diff) — expected for a redundant commit (BUG-1109/BUG-1122); finalize step should skip it.

## Incoming changes preserved

The incoming commit's changes are present in HEAD through e092ba69d2 (the earlier cherry-pick of the same merge). Each conflict hunk's "theirs" side is the pre-REQ-184/178 wording of code that HEAD has since superseded. Examples: scope.ts comments on `account_id` that REQ-184 renamed to `business_id`; resolveScope returning `Promise<Scope>` where HEAD has `Promise<Scope | null>`. Taking theirs would have reverted later developer work. This commit is redundant, not discarded. No hunks were dropped under BUG-1301, and STEP 3h was not needed.

Flag for post-merge review, per enrichment rule: all 9 files (low risk — HEAD content unchanged).
