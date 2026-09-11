---
uid: report-76e453ea
id: REPORT-3553
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-09T22:48:15.641224+00:00'
updated_at: '2026-09-09T22:48:15.641224+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` (BUG-36) — **UU**, intent/bookkeeping
  ticket → rule **2e**, "one side is a strict superset of the other: keep the
  superset". Resolved to the **HEAD (ours)** blob `e3e27e2c`.

  Incoming commit `bcedebfb` ("xgd(ticket): update bug bug-db356ff8",
  2026-08-23 15:21:10 -0700, +52/-2) advances base blob `a541a6d9` to
  `2ffe0bc5`. It contributes two new body sections and two frontmatter bumps:

  - `## Production state — confirmed empirically (2026-08-23)` (incl. the
    `### Interim production patch applied` subsection)
  - `## Second finding — bin/publish --production cannot authenticate as written`
  - `updated_at` → `2026-08-23T22:21:09.946754+00:00`,
    `last_field_updated` → `body`

  Diffing theirs (`2ffe0bc5`) against ours (`e3e27e2c`) gives 229 added lines
  and exactly **five** removed lines:

  ```
  updated_at: '2026-08-23T22:21:09.946754+00:00'
  completed_at: null
  last_field_updated: body
  status: draft
  Scope drafted, awaiting operator confirmation before coding.
  ```

  Both new sections are absent from that removal list, i.e. they are present in
  ours verbatim. The five removed lines are the same fact carried on both sides
  — the ticket's lifecycle state and the body's `## Status` paragraph — so 2e's
  per-fact timeline rule applies to them, and only to them.

  Timeline, per the enrichment's fallback for unknown intent on both sides
  (take the more recent commit by timestamp):

  - HEAD side: `56ced613` — 2026-08-31 12:19:38 -0700
  - Incoming:  `bcedebfb` — 2026-08-23 15:21:10 -0700

  HEAD is later by 8 days, and its value is the forward lifecycle step in every
  case: `status` `draft` → `free_and_reconciled`, `completed_at` set, and the
  `## Status` prose advanced from "Scope drafted, awaiting operator confirmation
  before coding" to "Both halves landed and verified". Ours additionally carries
  `story_points`, `commits[]` (working_sha `ea48502d`), `version: 0.2.10` and
  `bundled_in: bundle-78f4e2fe`, none of which the incoming side touched. Taking
  theirs would have reverted an operator-owned status to `draft` and dropped
  that bookkeeping.

  Resolved with `git checkout --ours` (worktree blob verified as `e3e27e2c`),
  no hand-editing of the ticket file, then `git add --sparse`.

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted path is a
bookkeeping ticket (2e), not a spec ticket, code file, or UAT.

Every section commit `bcedebfb` authored — `## Production state — confirmed
empirically`, `### Interim production patch applied`, and `## Second finding —
bin/publish --production cannot authenticate as written` — **is present verbatim
in the resolved file**, confirmed by the removal list above containing none of
them. Nothing the incoming commit authored was discarded; its content survives
inside a later, larger revision of the same ticket.

No hunk was dropped under the BUG-1301 precedence exception.

## Note for the finalize step

The staged tree is byte-identical to HEAD (`git diff --cached --stat HEAD` is
empty). This is the expected redundant-commit case (BUG-1109/BUG-1122): the
incoming commit's effect had already landed in HEAD through the later
`56ced613` update, which supersedes it in full. Per STEP 4 this is not a
failure and `--skip` was NOT called — `CHERRY_PICK_HEAD` is intact at
`bcedebfb` for `cherry_pick_finalize_resolution` to handle.

This is the second consecutive commit in this bundle to resolve this way
(the prior one was `1524d150`, scope `24/0`), which is consistent: both are
successive incremental edits to the same ticket on the working timeline, and
HEAD already holds the ticket's final post-reconcile state.
