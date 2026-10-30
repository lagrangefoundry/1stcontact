---
uid: report-2785b0d3
id: REPORT-5482
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T06:54:00.862632+00:00'
updated_at: '2026-09-29T06:54:00.862632+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-034bf955.md` — class **UU**, resolved under rule **2e**
  (intent/bookkeeping ticket, `bug-*`). The path is outside the sparse-checkout
  cone on this resync branch (DOC-986 §2/§4.1), so the conflict lived in the
  index only, with no working-tree markers; staged with `git add --sparse`.

  The incoming commit `24b0c044bc` ("xgd(ticket): update bug bug-034bf955",
  2026-09-01) is the ticket's **original authoring commit** — it took the file
  from `title: Untitled` / `status: draft` / body `(new ticket)` to the full
  Symptom / Root cause / Fix / Test plan body with `status: free_coding` and
  `severity: medium`.

  HEAD already contains that entire body verbatim, plus 18 days of subsequent
  lifecycle. Per 2e, HEAD's frontmatter is a strict superset and was kept whole:
  `status: free_and_reconciled` (vs incoming `free_coding`),
  `completed_at: 2026-09-14T10:29:07` (vs incoming `null`),
  `updated_at: 2026-09-19T15:15:29` (vs incoming `2026-09-01T21:10:09`), plus
  `commits[]` (working_sha `bd7612f977`), `version: 0.2.36`, `story_points: 3`
  and `bundled_in: bundle-8e1807f6` — none of which exist on the incoming side.
  Taking incoming there would have regressed a completed, reconciled, bundled
  ticket back to in-progress and dropped the reconcile bookkeeping.

  The one incoming-side fact NOT superseded by HEAD was the **trailing newline**:
  HEAD's copy ended without one (`\ No newline at end of file`), incoming's ended
  with one. That was applied from incoming. Verified as the canonical convention
  by pairwise `git diff --no-index` across four sibling tickets
  (`request-8b33a146.md`, `request-01ea4eec.md`,
  `acceptance_criterion-002fc710.md`, `acceptance_criterion-00d8a404.md`) — zero
  `\ No newline at end of file` markers across all of them; HEAD's copy of this
  file was the outlier.

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted path is an
intent ticket. Verified nonetheless by diffing the incoming blob against the
resolved working-tree file:

    git show CHERRY_PICK_HEAD:.xgd/tickets/hot/bug-034bf955.md > $TMPDIR/incoming-bug.md
    git diff --no-index $TMPDIR/incoming-bug.md .xgd/tickets/hot/bug-034bf955.md

The diff contains **only** the frontmatter hunk described above — every line of
incoming's prose body (Symptom, Root cause, Fix, Test plan, including the full
`tests/test_UAT_FC_BUG-42_markdown_rendering.test.ts` plan) is present
byte-for-byte in the resolved file. Nothing from the incoming side was discarded
except frontmatter facts that HEAD carries in a strictly later state.

No hunks were dropped under the BUG-1301 precedence exception; it did not apply
here. No test functions were touched on either side.

## Note for post-merge review

The conflict-intent metadata flagged this file as "intent unknown on one or both
sides — take the more recent commit by timestamp and flag for post-merge review."
Reading both sides resolved the ambiguity: they are not competing edits. Incoming
is the ticket's birth commit and is fully superseded by HEAD, so the resolution
collapses to the one-byte trailing-newline fix. Worth confirming that
`resync-377b581e` is replaying from the intended base — a queue that includes
commits already wholly integrated into HEAD may indicate the base was picked
further back than needed.
