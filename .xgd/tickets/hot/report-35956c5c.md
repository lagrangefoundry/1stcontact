---
uid: report-35956c5c
id: REPORT-5437
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T03:28:43.468959+00:00'
updated_at: '2026-09-29T03:28:43.468959+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-3bc4b835.md` (REQ-167) — **UU**, class **2e**
  (intent/bookkeeping ticket, `request-*`). Outside the sparse-checkout cone
  (DOC-986 §2/§4.1), so the conflict lived in the index only; materialized with
  `git checkout --conflict=diff3`, resolved, staged with `git add --sparse`.

  Three conflicted frontmatter hunks, all the *same fact* (the ticket's
  lifecycle state and its bookkeeping), changed differently on both sides —
  the genuine-intent-conflict branch of 2e. Resolved per fact by taking the
  later-positioned intent, which is OURS on all three:

  | field | base | incoming (0d47d0c43a) | ours (HEAD) | kept |
  |---|---|---|---|---|
  | `updated_at` | 2026-09-01T01:31 | 2026-09-01T18:09 | 2026-09-09T21:32 | ours |
  | `status` | `free_coded` | `ready_to_reconcile` | `bundled` | ours |
  | `last_field_updated` | `story_points` | `status` | `status` | ours |

  `xgd working-timeline` is not applicable here: both sides are the same uid,
  so there is no pair of intents to order. The discriminator is the `updated_at`
  pair, which is unambiguous (8 days apart), and it is independently corroborated
  by the cleanly-merged `fields` block, which already carries
  `bundled_in: bundle-87be4669` — a bundled-stage field that would be
  inconsistent with an incoming `ready_to_reconcile` status. `bundled` is
  downstream of `ready_to_reconcile`, so taking incoming would have regressed
  the ticket's stage and desynced it from its own `fields`.

  The ticket body (prose, ~165 lines) merged cleanly and is untouched.

## Incoming changes preserved

No code, test, spec, or config files were in conflict — the incoming commit
`0d47d0c43a` touches exactly one file and changes exactly the three frontmatter
lines tabulated above (verified with `git show 0d47d0c43a -- <path>`: 3
insertions, 3 deletions, all in the YAML header).

Every one of those three incoming values is therefore *superseded*, not
discarded: each is an earlier transition of the same field that HEAD has since
advanced further along the same lifecycle. This is 2e's genuine-conflict rule
(later intent wins, per fact), not a dropped hunk — the BUG-1301 PRECEDENCE
exception was not invoked and no test function was deleted.

Consequence for the next step: after resolution the tree is identical to HEAD
(`git status --porcelain` is empty, `git ls-files -u` is empty), because the
cherry-picked patch is now wholly redundant. Per STEP 4 this was staged and
left alone — `--skip`/`--continue`/`--quit`/`--abort` were NOT called, and
`CHERRY_PICK_HEAD` (`0d47d0c43ac47266dffc8e45cbe587c39c3ecf13`) is intact for
the finalize step, which will detect the clean staged diff and skip the commit.
