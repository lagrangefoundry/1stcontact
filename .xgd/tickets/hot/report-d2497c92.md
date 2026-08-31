---
uid: report-d2497c92
id: REPORT-2836
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:11:37.284291+00:00'
updated_at: '2026-08-31T08:11:37.284291+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-b4b9cca2.md` (REQ-50) — class **AA** (both added, no
  merge base in the index: only stages 2 and 3 present). Intent/bookkeeping
  ticket, so **rule 2e** applies, specifically the strict-superset branch:
  "incoming only appended a comment, advanced status, or added a field the other
  side never touched: keep the superset."

  The two sides differ by exactly one line. A full `diff -u` of the two blobs
  yields a single hunk:

      fields:
        ...
        version: 0.0.92
      + chat_comment: comment-109694b9

  Every other byte — frontmatter (uid, id, title, timestamps, status
  `free_and_reconciled`, `commits[].working_sha`, `version: 0.0.92`) and the
  entire ~8.8 KB body (Goal, Requirement, Scope of change, Agreed/Resolved design
  forks, Site-regeneration scope, Scope clarification, Delivered) — is identical
  on both sides. There is no competing fact: HEAD never touched
  `fields.chat_comment`, so the timeline tiebreak in 2e was not needed.

  Resolved with `git checkout --theirs` + `git add --sparse` (the path is under
  `.xgd/tickets/`, outside the sparse-checkout cone on reconcile branches —
  DOC-986 §2/§4.1).

  Referenced-ticket sanity check: `comment-109694b9` is a real ticket, present in
  HEAD at `.xgd/tickets/cold/comment-109694b9.md`. The added field is a live
  cross-reference, not a dangling one.

## Incoming changes preserved

Fully preserved — verified by object identity, not by inspection:

- Incoming commit: `c2412a5266647777d9c97bd858b4085efb5abe58`
  ("xgd(ticket): update request request-b4b9cca2", Martin Westhead,
  2026-08-23 13:22:49 -0700).
- Incoming (stage 3) blob: `6ff24d704e6a5505cd127fc3302d1b565ac32eae`
- Staged blob after resolution (`git rev-parse :.xgd/tickets/hot/request-b4b9cca2.md`):
  `6ff24d704e6a5505cd127fc3302d1b565ac32eae`

The staged result is byte-identical to the incoming side, so 100% of the incoming
commit's change (the `chat_comment: comment-109694b9` field) is present. Nothing
from the HEAD side was discarded either, since HEAD's blob
(`ef9bfdab2cf551732ceea6378fc6350223f9b285`) is a proper prefix-equal subset —
identical apart from the absent field.

No code/implementation files were in conflict, so STEP 3's per-file `git show`
walk had no further targets. No hunks were dropped; the BUG-1301 precedence
exception was not invoked and no test function on either side was touched.

Final tree state: no UU/AA/DU/UD lines remain; the file stages as `M`.
`CHERRY_PICK_HEAD` is intact at `c2412a5266647777d9c97bd858b4085efb5abe58` for
`cherry_pick_finalize_resolution`.
