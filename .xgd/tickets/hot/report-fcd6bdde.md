---
uid: report-fcd6bdde
id: REPORT-3851
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-11T01:31:41.352339+00:00'
updated_at: '2026-09-11T01:31:41.352339+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/request-26dafd83.md` — UU, index-only (path outside the
  sparse-checkout cone, DOC-986 §2/§4.1: no working-tree conflict markers).
  Class 2e (intent/bookkeeping ticket, `request-*`). Rule applied: **one side is
  a strict superset of the other — keep the superset (ours/HEAD)**.
  Resolved with `git checkout --ours`, then `git add --sparse`.

  Both the 2e superset rule and the auto-enrichment's fallback ("take the more
  recent commit by timestamp") select the same side: ours is
  `updated_at: 2026-09-09T21:32:49Z`, incoming is the 2026-08-31 `free_coded`
  commit `287de98`. No per-fact timeline split was needed because no fact is
  changed differently on the two sides.

## Incoming changes preserved

The incoming commit `287de98` ("xgd(ticket): update request request-26dafd83")
touched this one file and made exactly two changes:

1. added `fields.chat_comment: comment-cb7fa49c`
2. removed the trailing newline at EOF

Both are present verbatim in the resolved (ours) version — confirmed by diffing
the merge base blob `f461ffc4` against our stage-2 blob `139d3468`: it contains
`+  chat_comment: comment-cb7fa49c` and ends `\ No newline at end of file`.
Nothing from the incoming diff is absent. Ours additionally carries bundle
bookkeeping the incoming side never had (`status: bundled`, `version: 0.2.31`,
`bundled_in: bundle-87be4669`, three `commits` entries) and a `## What landed`
body section that answers and removes the "Granularity" open question.

No hunk was dropped, so the BUG-1301 precedence exception was not invoked. No
test files were involved.

**Note for the finalize step:** because HEAD already contains the incoming
commit's entire effect, the resolution nets to no staged diff vs HEAD
(`git diff --cached HEAD` is empty). Per STEP 4 this is the redundant-commit
case (BUG-1109/BUG-1122), not a discard — STEP 3's check distinguishes them and
confirms the incoming change is present in HEAD rather than merely absent.
`--skip` was NOT called; CHERRY_PICK_HEAD is left intact for
`cherry_pick_finalize_resolution`.
