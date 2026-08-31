---
uid: report-aaffe0ee
id: REPORT-2714
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T05:43:09.775461+00:00'
updated_at: '2026-08-31T05:43:09.775461+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-0dd62a5d.md` — class **AA** (both added), intent/bookkeeping ticket
  (`request-*`, rule **2e**, with **2b**'s superset clause). Both sides are the same 232/233-line
  request ticket; the only difference is that the incoming (free_coded) side adds one frontmatter
  field at line 41: `chat_comment: comment-30d4b30c`. Incoming is a strict superset of HEAD — no
  field or section present on the HEAD side is absent from incoming — so the superset was kept.
  Resolved with `git checkout --theirs` + `git add --sparse` (path is under `.xgd/tickets/`,
  DOC-986 §2/§4.1).

  No timeline lookup was needed: there is no fact changed differently on the two sides, only an
  addition on one side.

## Incoming changes preserved

- `.xgd/tickets/hot/request-0dd62a5d.md`: the incoming commit `8d31f9be`
  ("xgd(ticket): update request request-0dd62a5d") introduces the file with 234 insertions.
  Verified by blob identity — the staged index entry hashes to
  `c91a6d1909e75390cf226c1ec8f66185cf1eedbd`, which is exactly stage-3 (incoming) of the conflict.
  The resolved file is byte-identical to the incoming version, so every incoming change is present,
  including the added `chat_comment: comment-30d4b30c` field.

No hunks were dropped; the BUG-1301 precedence exception was not invoked.

## Tree state

`git status --porcelain` shows no remaining conflict classes; the file is staged as `M`. The
in-progress cherry-pick (CHERRY_PICK_HEAD `8d31f9be`) was left untouched for
`cherry_pick_finalize_resolution`.
