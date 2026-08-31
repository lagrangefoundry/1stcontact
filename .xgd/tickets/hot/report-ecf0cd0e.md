---
uid: report-ecf0cd0e
id: REPORT-2792
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T07:15:54.008054+00:00'
updated_at: '2026-08-31T07:15:54.008054+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/bug-b9eb2e3a.md` — class **AA** (both added), intent/bookkeeping
  ticket (STEP 2 rule **2e**, strict-superset branch). Resolved by taking the
  incoming (free_coded) side via `git checkout --theirs` + `git add --sparse`.

  Both sides were byte-identical except for a single added line in `fields:`
  on the incoming side:

  ```
  +  chat_comment: comment-d296ef9d
  ```

  No field was changed differently on the two sides, so no timeline
  arbitration was needed — the incoming version is a strict superset of HEAD's
  (it only appends a field HEAD never touched), and 2e says keep the superset.
  No content was invented; the staged blob (`c87e92f0`) is byte-identical to
  the incoming stage-3 blob.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-b9eb2e3a.md` — **preserved in full.** The incoming
  commit `b0c8ff3b6699b3774d7bf7b1430bcbd6618ab1d3`
  ("xgd(ticket): update bug bug-b9eb2e3a") adds the file as a 62-line insertion;
  its only delta against the HEAD-side version is the `chat_comment:
  comment-d296ef9d` field, and that line is present in the resolved/staged file.
  `git diff --cached HEAD` for this path is exactly that one-line addition, and
  `git ls-files -s` confirms the staged object hash equals the incoming blob.

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No
code/implementation files, UAT test files, or spec tickets were involved in this
conflict — the sole conflict was this bookkeeping ticket. The in-progress
cherry-pick state (`CHERRY_PICK_HEAD`) is intact and untouched.
