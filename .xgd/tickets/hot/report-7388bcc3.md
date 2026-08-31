---
uid: report-7388bcc3
id: REPORT-3073
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T21:02:27.534589+00:00'
updated_at: '2026-08-31T21:02:27.534589+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — class **UU**, rule **2e** (intent/bookkeeping
  ticket, per-fact timeline resolution). Single conflict hunk, four frontmatter
  lifecycle scalars only (`updated_at`, `completed_at`, `last_field_updated`,
  `status`). The rest of the file merged cleanly, including the trailing-newline
  change, which is identical on both sides.

  Per-fact outcome — all four are the SAME facts changed on both sides, so the
  timeline rule applies to each:
  - `status`: incoming `reconciling` (2026-08-24T02:10:52Z) vs HEAD
    `free_and_reconciled` (2026-08-31T14:23:04Z) → HEAD, the later position of
    the same lifecycle field.
  - `completed_at`: null vs `2026-08-31T14:22:24Z` → HEAD.
  - `updated_at` / `last_field_updated`: → HEAD, consistent with the above.

  No fact is incoming-only: the incoming diff touches nothing outside these four
  lines, so nothing from the incoming side was dropped in favour of HEAD on a
  field HEAD did not itself later set.

## Incoming changes preserved

Not a code file; no implementation hunks involved. The incoming commit
(`7d0a6ec8332b611b57fda89f95d36b1399b9d05e`, 2026-08-23 19:10:52 -0700) is a
4-line status advance of BUNDLE-20 from `ready_to_reconcile` to `reconciling` —
the developer-side record of that bundle *entering* reconcile.

Its intent is present in HEAD via a later route, not discarded: HEAD's side of
this file (commit `8e07e6015dead83333d9ae23d1116e97a118a490`, 2026-08-31
07:23:04 -0700, eight days later) records that same bundle having *completed*
reconcile — `status: free_and_reconciled`, `result: pass`, `completed_at` set,
`merged_at_commit: eef7a8b48bfa15c54b64db9541a0e781a016ba9e`, the `commits`
list collapsed to a single resolved `main_sha`, and a full `orphan_commits`
old_sha→new_sha map. Writing incoming's `reconciling` over that would move the
ticket backwards through its own lifecycle and contradict the completion
record that HEAD already carries.

The resolution therefore nets to no diff vs HEAD. Per STEP 4 that is not a
failure and `--skip` was not called; the staged tree is left for
`cherry_pick_finalize_resolution` to handle. This is the redundant case, not
the discarded case, by STEP 3's own test: the incoming commit's key change
(this bundle progressing through reconcile) is present in HEAD, superseded by
its terminal state — not simply absent.

No BUG-1301 precedence exception was invoked; no hunk was dropped on that basis.
No UAT or code files were part of this conflict.
