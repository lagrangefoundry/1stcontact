---
uid: report-71f7f857
id: REPORT-2829
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:03:17.065334+00:00'
updated_at: '2026-08-31T08:03:17.065334+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-3f57cd0c.md` — class **AA** (both added), intent/bookkeeping
  ticket (rule 2e, with 2b's superset test). Both sides added REQ-139's request ticket
  independently. The two blobs are byte-identical except that the incoming (free_coded,
  `ae6201d0`) side carries one extra frontmatter field under `fields:`:
  `chat_comment: comment-2d304414`. Incoming is therefore a strict superset — it only
  added a field the HEAD side never touched — so the superset was kept via
  `git checkout --theirs`, then staged with `git add --sparse` (path is outside the
  sparse-checkout cone, DOC-986 §2/§4.1).

  No same-field divergence existed, so no `xgd working-timeline` tiebreak was needed.
  No field was invented; no `intent_uid`/`story_uid`/`capability_uid` was touched.

## Incoming changes preserved

- `.xgd/tickets/hot/request-3f57cd0c.md`: the staged blob is `a7f81220da1890e2057a0ec415d100b4687e8e2b`
  — byte-for-byte the incoming commit's version of the file. `git show ae6201d0 -- <file>`
  is a 160-line whole-file addition; every line of it is present in the resolution, and
  the staged diff vs HEAD is exactly the one line HEAD lacked
  (`+  chat_comment: comment-2d304414`). Nothing from the incoming side was discarded.

No hunks were dropped, so the BUG-1301 precedence exception did not apply. No code,
test, or UAT files were involved in this conflict.
