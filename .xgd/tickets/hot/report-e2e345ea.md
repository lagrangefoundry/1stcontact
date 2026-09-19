---
uid: report-e2e345ea
id: REPORT-4441
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T13:15:18.838474+00:00'
updated_at: '2026-09-19T13:15:18.838474+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `package.json` — UU, config file (rule 2g, scalar). Conflict was the single
  `"version"` field: ours `0.2.40`, incoming `0.2.38`. Kept ours (`0.2.40`).

  2g's "scalar conflicts: incoming wins" is about the developer's config
  *intent* superseding automated churn. Here the incoming scalar is not a
  config intent at all — it is the monotonic release-bookkeeping bump emitted
  by the free_coded promotion (`92e927e79f chore: bump version to 0.2.38 for
  REQ-156 [FREE-CODED]`, the second parent of the picked merge). The picked
  merge `197c4a0494`'s *entire* effect on `package.json` is `0.2.37 -> 0.2.38`.
  Taking it would regress the version on HEAD, and HEAD already carries the
  REQ-156 bump at a higher number.

## Incoming changes preserved

The picked commit `197c4a0494` ("Merge branch 'free-REQ-156' into xgd-working",
author date Tue Sep 1 15:08:13 2026) is already present on HEAD under a
different sha: `31f8e03282`, identical subject and identical author date, with
later workflow refinements stacked on top. Evidence:

- `git log HEAD -- package.json` shows `31f8e03282 Merge branch 'free-REQ-156'
  into xgd-working`, then `e86aecc7cb chore: bump version to 0.2.39 for REQ-156
  [FREE-CODED]`, then `80c9342ac1 Merge branch 'free-BUG-43' into xgd-working`
  (which carried `0.2.40`).
- The REQ-156 version bump therefore IS on HEAD, re-issued as `0.2.39` for the
  same ticket, and subsequently superseded by `0.2.40`. Keeping `0.2.40` retains
  the incoming intent (REQ-156 gets a version bump) at its later, correct value;
  it does not discard it.

Every other path touched by the picked commit is already identical on HEAD —
`git status --porcelain` reported `UU package.json` and nothing else, i.e. the
cherry-pick's content for all 26 other paths merged to no change. Spot-checked
present on HEAD:

- `tools/generate/src/cli/png.ts`
- `tests/test_UAT_FC_REQ-156_png_codec.test.ts`
- `tests/test_UAT_FC_REQ-156_fidelity_in_workerd.workers.test.ts`

No test function was deleted on either side. No hunk was dropped under the
BUG-1301 precedence exception — nothing needed it.

## Net result

The staged tree has no diff vs HEAD (`git diff --cached --stat HEAD` is empty).
This is the redundant-commit case (BUG-1109/BUG-1122), not a discard: STEP 3's
check passes because the incoming commit's key changes are *present* on HEAD via
`31f8e03282` + `e86aecc7cb`, not merely absent. Per STEP 4, `--skip` was NOT
called; the file is staged and CHERRY_PICK_HEAD is left intact for
`cherry_pick_finalize_resolution`.
