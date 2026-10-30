---
uid: report-6bfdf723
id: REPORT-5451
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T04:21:06.972266+00:00'
updated_at: '2026-09-29T04:21:06.972266+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-6893f6ea.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), rule **2e**: same fact changed on both sides, so take the
  later-positioned intent, per fact. Resolved to the HEAD side.

  The conflicting hunk was the frontmatter status block only (4 lines):

  | side | `updated_at` | `status` |
  |---|---|---|
  | HEAD (ours) | `2026-09-09T21:32:50` | `bundled` |
  | incoming (`58d4f8ec81`) | `2026-09-01T18:53:35` | `free_coded` |

  `status` is a single scalar fact that both sides set differently, so 2e's
  genuine-conflict branch applies. Three independent signals put the HEAD
  intent later and make it the correct winner:

  1. **Intent ledger ordering.** `xgd ticket history` on both sides: the
     incoming lineage on xgd-working ends at `58d4f8ec81` (2026-09-01,
     `ready_to_reconcile` -> `free_coded`, a same-day rollback). The HEAD
     lineage continues past it to `c94654a355` (2026-09-09,
     `seed_local_overlay`), the bundle-formation event that sets
     `status: bundled`. HEAD's intent is strictly later.
  2. **Internal consistency.** The unconflicted `fields` block in the merged
     file carries `bundled_in: bundle-87be4669` and
     `commits[0].working_sha: 2745001058`. Taking the incoming `free_coded`
     would leave a ticket that is `free_coded` while simultaneously assigned
     to a bundle - a contradiction.
  3. **Bundle cohort.** All four sibling tickets in `bundle-87be4669`
     (`request-3bc4b835`, `request-439cd0c8`, `request-78370159`,
     `request-909e42f8`) are `status: bundled`. Reverting REQ-158 to
     `free_coded` would split the bundle.

  No other field, section, or body prose conflicted. The entire ~180-line body
  (including "What has changed under this ticket since it was written" and
  "Answers to the open questions") merged cleanly and is preserved intact.

## Incoming changes preserved

No code or implementation files were in conflict. The cherry-picked commit
`58d4f8ec81` ("xgd(ticket): update request request-6893f6ea") touches exactly
one file, `.xgd/tickets/hot/request-6893f6ea.md`, and its entire diff is the
2-line frontmatter status flip shown above. There is no developer code in this
commit to discard or preserve.

The incoming `status: free_coded` / `updated_at: 2026-09-01T18:53:35` hunk is
deliberately NOT present in the resolved file. This is the prescribed outcome
of rule 2e (later-positioned intent wins per fact) for a bookkeeping ticket,
not a dropped developer change. It is also not the BUG-1301 precedence
exception: no refactor is involved and no test or code target was removed. The
incoming intent is simply superseded by the later bundling decision already
integrated into HEAD.

## Staging state

- `git ls-files -u` -> empty (no unmerged index entries).
- `grep '<<<<<<<|>>>>>>>'` on the resolved file -> no matches.
- `git status --porcelain` -> empty.
- `CHERRY_PICK_HEAD` still present at `58d4f8ec81`, untouched; no
  `--continue`/`--skip`/`--quit`/`--abort` was run.

The staged tree is byte-identical to HEAD, so this cherry-pick is a net no-op
once resolved (the superseding `bundled` state was already reached on the
main-rooted branch). Per STEP 4 this was left for the finalize step to detect
and skip rather than skipped here.
