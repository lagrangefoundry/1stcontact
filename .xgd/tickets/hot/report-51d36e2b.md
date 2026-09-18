---
uid: report-51d36e2b
id: REPORT-4337
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T07:29:02.083401+00:00'
updated_at: '2026-09-18T07:29:02.083401+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — **UU**, intent/bookkeeping ticket (rule 2e),
  resolved as **ours (HEAD)**.

  Single conflict hunk, frontmatter only; bodies identical on both sides. Both
  sides advanced the SAME facts (`updated_at`, `completed_at`, `status`), so this
  is 2e's genuine-conflict case: take the later-positioned intent, per fact.

  - incoming (`486ef694`, 2026-08-25): `status: free_coded` → `ready_to_reconcile`,
    `updated_at` → `2026-08-25T22:52:42`, `completed_at` stays `null`.
  - ours (`56ced613`, 2026-08-31): `status: free_coded` → `free_and_reconciled`,
    `updated_at`/`completed_at` → `2026-08-31T19:19:38`, plus
    `fields.bundled_in: bundle-78f4e2fe` (that addition merged cleanly, outside
    the conflict region, and is preserved).

  HEAD is later on every conflicting fact by both commit timestamp (Aug 31 vs
  Aug 25) and the ticket's own `updated_at`, which agrees with the auto-enriched
  resolution rule ("take the more recent commit by timestamp"). The two statuses
  are not competing alternatives: `free_and_reconciled` is the state reached
  *after* `ready_to_reconcile` in the ticket lifecycle, so HEAD is downstream of
  the incoming transition. Taking incoming would have regressed BUG-36's status
  and dropped `completed_at` and `bundled_in`.

  No disjoint incoming-only field existed to combine — incoming touched a strict
  subset of the fields ours touched, so nothing from either side was lost.

## Incoming changes preserved

No code/implementation files were in this conflict; the only conflicted path is a
bookkeeping ticket. Nothing was dropped under the BUG-1301 precedence exception.

The incoming commit's key change (advancing BUG-36 out of `free_coded`) **is**
present in HEAD, via the later route that carried it on to
`free_and_reconciled` — redundant, not discarded (STEP 3's distinction).

Consequently the staged tree nets to **no diff vs HEAD** (`git diff --cached
HEAD` is empty). Per STEP 4 / BUG-1109 / BUG-1122 this is not a failure and
`--skip` was NOT called; `cherry_pick_finalize_resolution` will detect the clean
staged diff and skip the commit.

Staging verified: `git ls-files -u` empty, no conflict markers remain, no
conflict-class lines in `git status --porcelain`.

## Flagged for post-merge review

Per the enrichment rule's "flag this file for post-merge review" clause: BUG-36
(`bug-db356ff8`) reached `free_and_reconciled` on the HEAD side recorded as
`bundled_in: bundle-78f4e2fe`, while this reconcile run is bundle
`bundle-8e1807f6`. Worth a glance that the ticket is attributed to the intended
bundle.
