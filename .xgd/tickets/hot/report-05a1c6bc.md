---
uid: report-05a1c6bc
id: REPORT-4114
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-12T19:17:26.075808+00:00'
updated_at: '2026-09-12T19:17:26.075808+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-a98fb3b0.md` — UU, intent/bookkeeping ticket (rule 2e).
  Incoming commit `2c208ef3` ("xgd(ticket): update bug bug-a98fb3b0",
  2026-08-24 15:19:54 -0700) is a single-field update three seconds after its
  predecessor `04957574`: it adds `story_points: 2` and moves
  `last_field_updated: status -> story_points`. Nothing else.

  Resolved by keeping the HEAD side. `git diff :2: :3:` shows the sides differ
  only in lifecycle bookkeeping, with HEAD later on every contested fact:
  - `status`: HEAD `free_and_reconciled`; incoming `free_coded` — an earlier
    point on the same lifecycle, not a competing value.
  - `updated_at` / `completed_at`: HEAD `2026-08-31T19:19:34` and completed;
    incoming `2026-08-24T22:19:54` and `completed_at: null`.
  - `last_field_updated`: HEAD `status`; incoming `story_points`. This is a
    derived breadcrumb naming whichever field each side wrote most recently, not
    an independent fact — HEAD's value is correct for HEAD's content.
  - fields: HEAD carries the incoming `story_points: 2` verbatim, and
    additionally `bundled_in: bundle-78f4e2fe`, which incoming does not have.

  The prose body is identical on both sides.

  Timeline check (rule 2e's per-fact tiebreak, and the enrichment note's "take
  the more recent commit by timestamp"): the last HEAD-side commit touching this
  file is `01492336` dated 2026-08-31 12:19:34 -0700, a week later than the
  incoming commit's 2026-08-24 15:19:54 -0700. HEAD wins each contested fact.

  Path is outside the sparse-checkout cone, so staging used `git add --sparse`.
  Verified before staging: zero conflict markers in the worktree file, and its
  SHA-1 matches the `:2:` (ours) stage exactly.

## Incoming changes preserved

No code/implementation files were in this conflict — the single conflicted path
is a bookkeeping ticket. The one field this commit authored is present in the
resolved file:

- `story_points: 2` — present (line 24), same position under `fields:`,
  immediately after `version: 0.2.14`.

The incoming values not carried over are `status: free_coded`, `updated_at:
2026-08-24T22:19:54`, `completed_at: null`, and `last_field_updated:
story_points`, each superseded by a later HEAD-side value for the same fact.
That is the rule-2e tiebreak operating per fact, not a discard of developer
content.

No hunks were dropped under the BUG-1301 precedence exception; it was not
invoked.

Note for the finalize step: the staged diff against HEAD is empty
(`git diff --cached --stat HEAD` returns nothing), because HEAD already carries
this commit's effect and then some. This is the redundant-commit case of
BUG-1109/BUG-1122, not a discard: STEP 3's test is satisfied because the
incoming commit's key change is *present* in HEAD rather than absent.
`--skip` was not called; the cherry-pick sequencer state is intact.

This is the fourth consecutive commit in this bundle (after `1c5985f8`,
`82518d60`, and `04957574`) to touch only this ticket and net to no diff. All
four are working-side lifecycle updates for BUG-38 dated 2026-08-24, replaying
onto a branch whose copy of the ticket was last written 2026-08-31 and already
holds its final `free_and_reconciled` state.
