---
uid: report-d59d1b23
id: REPORT-3312
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T18:39:33.751669+00:00'
updated_at: '2026-09-02T18:39:33.751669+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-0cdfdc5b.md` — class **AA** (both added), intent/bookkeeping
  ticket (rule 2e). Resolved to the HEAD side via `git checkout --ours` +
  `git add --sparse`.

  Per-fact analysis (the two blobs differ ONLY in frontmatter; the 370-line
  markdown body is byte-identical on both sides):

  | fact | ours (HEAD) | theirs (incoming 458b7fc9c2) | kept |
  |---|---|---|---|
  | `status` | `free_and_reconciled` | `ready_to_reconcile` | ours |
  | `updated_at` | `2026-08-31T14:22:38Z` | `2026-08-20T02:59:27Z` | ours |
  | `completed_at` | `2026-08-31T14:22:38Z` | `null` | ours |
  | `fields.bundled_in` | `bundle-b3b7c399` | (absent) | ours |

  Ours wins on every conflicting fact by the 2e timeline rule: the HEAD-side
  commit `9981276295` is dated Mon Aug 31 2026, the incoming commit
  `458b7fc9c2` is dated Sun Aug 23 2026 and carries a ticket snapshot whose
  own `updated_at` is Aug 20 — strictly earlier on both the commit timeline
  and the ticket's own field timeline. This matches the auto-enrichment
  resolution rule ("take the more recent commit by timestamp"), and it is
  also the superset case: HEAD has advanced `status`, set `completed_at`,
  and added `bundled_in`, none of which the older incoming snapshot ever
  touched. `bundled_in` is an addition made by HEAD after the incoming
  snapshot, not a deletion performed by incoming.

  Taking theirs would have reverted operator-owned reconcile bookkeeping
  (`free_and_reconciled` -> `ready_to_reconcile`, dropping `completed_at`
  and `bundled_in`) — i.e. re-opening an already-reconciled request.

  No fields were invented, and no `intent_uid` / `story_uid` /
  `capability_uid` field was modified.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is
an intent ticket, so 2c/2f do not apply and no test function was touched or
deleted.

STEP 3 verification for the one conflicted file: `git show 458b7fc9c2 --
.xgd/tickets/hot/request-0cdfdc5b.md` is a whole-file add of 370 lines. A
blob-level diff of stage 2 vs stage 3 shows 3 insertions / 4 deletions, all
inside the YAML frontmatter — the entire narrative body of the incoming
version is already present verbatim in HEAD's copy of the file. The incoming
content is therefore preserved via a later revision of the same ticket
(present-by-another-route), not discarded. The only incoming values absent
from the resolution are the four stale frontmatter scalars listed above,
which are superseded snapshots of fields HEAD later advanced — the intended
outcome of the 2e timeline rule, not a loss of developer content.

No hunk was dropped under the BUG-1301 precedence exception.

Note for the finalize step: the staged tree nets to no diff vs HEAD
(`git diff --cached --stat HEAD` is empty). This is the redundant-commit
case (BUG-1109/BUG-1122) — the incoming commit's effect is already in HEAD
through the later Aug 31 ticket update — and is explicitly distinguished
from a discard by the STEP 3 check above. `--skip` was NOT called;
CHERRY_PICK_HEAD remains intact for
`cherry_pick_finalize_resolution`.
