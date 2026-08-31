---
uid: report-dfe3f332
id: REPORT-3099
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T22:05:20.955827+00:00'
updated_at: '2026-08-31T22:05:20.955827+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — UU, intent/bookkeeping ticket (rule 2e,
  "one side is a strict superset"). Path is outside the sparse-checkout cone, so
  the conflict existed in the index only, with no working-tree markers; resolved
  with `git checkout --ours` + `git add --sparse`.

  The incoming commit (`e2ef5e98`, `xgd(ticket): update bug bug-23d1ec27`,
  2026-08-25) makes exactly two changes to the base blob `19672613`:
  1. adds `fields.chat_comment: comment-72dd436d`
  2. drops the trailing newline at EOF

  The HEAD-side blob (`01eb488d`) contains both of those facts already, plus a
  large set of disjoint updates the incoming side never touched:
  `status: draft` → `bundled`, `updated_at` advanced to 2026-08-31,
  `last_field_updated: status`, and new fields `commits`, `version: 0.2.15`,
  `story_points: 3`, `bundled_in: bundle-8eef3846`, together with the rewritten
  body ("Fix — as landed", "Watch for — resolved", "Out of scope" sections and
  the checked-off acceptance criteria).

  No field is changed differently on the two sides, so there is no per-fact
  conflict to send to `xgd working-timeline`. HEAD is a strict superset and is
  also the later-positioned side by timestamp, which agrees with the enrichment
  metadata's "take the more recent commit" rule. Kept HEAD whole.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-23d1ec27.md` — both incoming facts verified present in
  the staged blob: `chat_comment: comment-72dd436d` at line 18, and the file
  ends without a trailing newline (`... emits it.` with no `\n`, confirmed via
  `od -c`). Nothing from the incoming commit was dropped.

No hunks were dropped, so the BUG-1301 precedence exception was not used.

Note: because HEAD already carries the incoming commit's entire effect, this
resolution stages to no net diff vs HEAD. Per STEP 4 this is not a failure and
`--skip` was not called — the finalize step will detect the empty staged diff.
This is the redundant case, not the discarded one: STEP 3's check passes because
the incoming commit's key change is present in HEAD, not merely absent.
