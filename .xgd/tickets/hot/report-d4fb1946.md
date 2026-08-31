---
uid: report-d4fb1946
id: REPORT-2831
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:04:58.545166+00:00'
updated_at: '2026-08-31T08:04:58.545166+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-42385423.md` — **AA (both added)**, intent/bookkeeping ticket.
  Rule **2b / 2e (strict superset)**. Both sides carry the same
  `request-42385423` body; the incoming (`free_coded`) side differs by
  exactly one added frontmatter field under `fields:`:
  `chat_comment: comment-3dca5858`. Incoming is therefore a strict
  superset of HEAD — no field or section on the HEAD side is absent from
  the incoming side, and no fact is changed differently on the two sides,
  so no per-fact timeline arbitration was required. Resolved with
  `git checkout --theirs` + `git add --sparse` (path is outside the
  sparse-checkout cone, DOC-986 §2/§4.1; the working tree held the OURS
  content with no conflict markers, the conflict existed only in the
  index).

## Incoming changes preserved

- `.xgd/tickets/hot/request-42385423.md`: the staged blob is
  `50929d9f4b6eb34dec26b03378f7cebe64e5d732` — byte-identical to stage 3
  (the incoming side) of the conflict, and identical to the file as
  authored by the incoming commit `50658e8f8042e3bbabb7f035c58153e34b09d7c3`
  (`xgd(ticket): update request request-42385423`, 112 insertions, whole
  file). 100% of the incoming commit's content for this file is present in
  the resolution. Staged diff vs HEAD is the single line
  `+  chat_comment: comment-3dca5858`, which is exactly the delta the
  incoming side contributes over HEAD.

No hunks were dropped; the BUG-1301 precedence exception was not invoked.
No code, test, or UAT files were involved in this conflict.

Note on the auto-enrichment: it reported "intent unknown on one or both
sides — take the more recent commit by timestamp and flag for post-merge
review." The superset relationship makes that arbitration moot (the
timestamp rule and the superset rule select the same side, and nothing
from HEAD is lost either way), but the flag is carried here for
post-merge review: the added `chat_comment: comment-3dca5858` reference
was accepted as authored by the developer and was not otherwise validated.

Cherry-pick sequencer state (`CHERRY_PICK_HEAD`) left intact; no
`--continue`/`--skip`/`--quit`/`--abort`/`reset` was run.
