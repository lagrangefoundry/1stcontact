---
uid: report-3d4bf9f1
id: REPORT-3201
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T04:31:47.108306+00:00'
updated_at: '2026-09-01T04:31:47.108306+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — **UU**, intent/bookkeeping ticket
  (rule 2e). Resolved per-fact by the timeline rule, taking the HEAD side
  for the single conflicting fact.

  Both sides touched exactly the same three frontmatter fields and nothing
  else (incoming diff = one hunk, 3 insertions / 3 deletions, fully inside
  the conflict block):

  | field | base | ours (HEAD) | theirs (incoming) |
  |---|---|---|---|
  | `updated_at` | 2026-08-24T22:19:54 | 2026-08-26T17:36:27 | 2026-08-25T22:52:44 |
  | `last_field_updated` | `story_points` | `status` | `status` |
  | `status` | `free_coded` | `bundled` | `ready_to_reconcile` |

  Same fact changed differently on each side → genuine intent conflict, so
  the later-positioned side wins for that fact. HEAD is later by timestamp
  (08-26 vs 08-25), matching the auto-enrichment rule for the
  intent-unknown case. It is also the only self-consistent choice: the
  `fields:` block merged cleanly from the HEAD side and carries
  `bundled_in: bundle-78f4e2fe`, so keeping incoming's `ready_to_reconcile`
  would leave the ticket claiming a pre-bundle status while recording the
  bundle it was placed in. `bundled` is the downstream lifecycle state of
  `ready_to_reconcile`, not a competing one.

  Resolution mechanics: `git checkout --ours` (verified lossless — the
  resulting working file is byte-identical to the HEAD blob, and incoming
  changed nothing outside the conflict block, so no auto-merged incoming
  content was dropped), then `git add --sparse` (path is outside the
  sparse-checkout cone, DOC-986 §2/§4.1).

## Incoming changes preserved

The cherry-picked commit `0431fed4` touches exactly one file — the
bookkeeping ticket above. It contains **no code/implementation files**, so
STEP 3's code-preservation check has no in-scope files.

For the ticket itself, incoming's intent (advance `status` to
`ready_to_reconcile`) is not discarded: HEAD's ledger already carries that
transition forward and past it to `bundled`, with `bundled_in` recorded.
This is supersession along the ticket's own lifecycle, not loss of a
developer edit — incoming asserted no fact that HEAD's later state
contradicts in substance.

No hunks were dropped under the BUG-1301 precedence exception; it did not
apply here.

## Note for post-merge review

Per the auto-enrichment rule for the intent-unknown case, flagging this
file for post-merge review. The staged tree nets to **no diff vs HEAD**
(the resolution equals HEAD for this file). Per STEP 4 this is expected
for a commit whose effect the timeline already absorbed — no `--skip` was
issued; `cherry_pick_finalize_resolution` will detect the clean staged
diff. STEP 3 distinguishes this from a discard: the incoming status
transition is present in HEAD's lifecycle, not absent.
