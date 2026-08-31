---
uid: report-31cca8ed
id: REPORT-2854
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:33:21.056377+00:00'
updated_at: '2026-08-31T08:33:21.056377+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-9707484c.md` — **AA** (both added), intent/bookkeeping
  ticket (REQ-121). Rule **2e** applied: the incoming side is a strict superset of
  HEAD's. Full-file diff between `:2:` (ours) and `:3:` (theirs) is a single added
  line — `chat_comment: comment-505b98c5` under `fields:`. Every other byte,
  including the entire `# As built` narrative, is byte-identical on both sides.
  No field is changed differently on the two sides, so no timeline lookup was
  needed. Resolved with `git checkout --theirs`, staged with `git add --sparse`
  (path is outside the sparse-checkout cone, DOC-986 §2/§4.1).

## Incoming changes preserved

- `.xgd/tickets/hot/request-9707484c.md`: incoming commit
  `5d670b61ac53b292f5f11136b075cfd400042fd5` ("xgd(ticket): update request
  request-9707484c") adds the file with 235 lines. The staged result matches that
  blob exactly; `git diff --cached HEAD` shows precisely the one added line
  (`+  chat_comment: comment-505b98c5`), which is the incoming commit's whole
  effect relative to HEAD's version of this file. Nothing from either side was
  discarded and no content was invented.

No code/implementation files were in conflict, so no BUG-1301 precedence
exception was invoked and no spot-check tests were required.
