---
uid: report-fe299156
id: REPORT-4684
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T09:49:41.739035+00:00'
updated_at: '2026-09-21T09:49:41.739035+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bundle-8eef3846.md` — UU, intent/bookkeeping ticket (§2e, bundle
  under `.xgd/tickets/`, outside the sparse-checkout cone so the conflict existed only
  in the index with no working-tree markers). Resolved by staging the HEAD-side blob
  `3f33389d` via `git update-index --cacheinfo`, then restoring the `skip-worktree` bit
  that every other ticket file in this worktree carries (clearing it made git report a
  phantom ` D` deletion for a path the sparse checkout never materialises).

  Per-fact analysis rather than whole-file pick: the incoming commit `8da3c09f`
  ("update bundle bundle-8eef3846") changes exactly three frontmatter facts —
  `status: reconciling` → `free_and_reconciled`, `completed_at: null` →
  `2026-08-31T23:59:50`, and the corresponding `updated_at` bump. HEAD already carries
  all three (same `status`, `completed_at` differing only in sub-second fraction:
  `.119536` vs `.420544`), plus a strict superset of further facts recorded 17 seconds
  later in the same reconcile run: `result: pass`, `merged_at_commit: 90527353`, the
  full `orphan_commits` old→new SHA map, and the collapsed `commits` entry
  (`main_sha: 90527353`). No field is changed differently on the two sides, so there is
  no genuine intent conflict; HEAD is the strict superset and the later-positioned
  intent (`updated_at` 2026-09-01T00:00:07 vs 2026-08-31T23:59:50). Nothing from the
  incoming side is discarded.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is a
bookkeeping ticket, so §3's `git show $CPHEAD -- <file>` code check does not apply.
Verified against the incoming commit regardless: all three facts it sets are present in
the resolved blob. No hunk was dropped, and the BUG-1301 precedence exception was not
invoked.

## Staging state

`git status --porcelain` is empty and `git ls-files -u` reports no unmerged entries;
`CHERRY_PICK_HEAD` (`8da3c09f4ea1738d466282ffbe1aca5a5c5f039f`) is intact. Because HEAD
already subsumed the incoming change, the staged diff against HEAD is empty — expected
for a superseded intermediate snapshot. Per STEP 4 this is left for Python's finalize
step to detect and skip; no `--continue`/`--skip`/`--quit`/`--abort` was issued.
