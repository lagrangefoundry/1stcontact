---
uid: report-8192a1b3
id: REPORT-3554
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-09T22:50:18.699371+00:00'
updated_at: '2026-09-09T22:50:18.699371+00:00'
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

  Incoming commit `1a64efde` ("xgd(ticket): update bug bug-db356ff8",
  2026-08-23 16:03:08 -0700, +67/-1) advances base blob `2ffe0bc5` to
  `71083b23`. It contributes one new body block and one frontmatter bump:

  - `# Approved scope addition — fix the publish credential (option A)`, with
    its subsections `## Why the API token cannot simply be swapped in`,
    `## The change`, and `## Note — two service tokens were created and revoked`
  - `updated_at` → `2026-08-23T23:03:08.033794+00:00`

  Diffing theirs (`71083b23`) against ours (`e3e27e2c`) gives 163 added lines
  and exactly **five** removed lines:

  ```
  updated_at: '2026-08-23T23:03:08.033794+00:00'
  completed_at: null
  last_field_updated: body
  status: draft
  Scope drafted, awaiting operator confirmation before coding.
  ```

  The whole "Approved scope addition" block is absent from that removal list,
  i.e. it is present in ours verbatim. The five removed lines are the same fact
  carried on both sides — the ticket's lifecycle state and the body's
  `## Status` paragraph — so 2e's per-fact timeline rule applies to them, and
  only to them.

  Timeline, per the enrichment's fallback for unknown intent on both sides
  (take the more recent commit by timestamp):

  - HEAD side: `56ced613` — 2026-08-31 12:19:38 -0700
  - Incoming:  `1a64efde` — 2026-08-23 16:03:08 -0700

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

Every section commit `1a64efde` authored — the `# Approved scope addition — fix
the publish credential (option A)` block and all three of its subsections — **is
present verbatim in the resolved file**, confirmed by the removal list above
containing none of it. Nothing the incoming commit authored was discarded; its
content survives inside a later, larger revision of the same ticket.

No hunk was dropped under the BUG-1301 precedence exception.

## Note for the finalize step

The staged tree is byte-identical to HEAD (`git diff --cached --stat HEAD` is
empty). This is the expected redundant-commit case (BUG-1109/BUG-1122): the
incoming commit's effect had already landed in HEAD through the later
`56ced613` update, which supersedes it in full. Per STEP 4 this is not a
failure and `--skip` was NOT called — `CHERRY_PICK_HEAD` is intact at
`1a64efde` for `cherry_pick_finalize_resolution` to handle.

This is the third consecutive commit in this bundle to resolve this way
(`1524d150` at scope `24/0`, `bcedebfb` at `25/0`, `1a64efde` here). The chain
is coherent: each is the next incremental edit to the same ticket on the working
timeline — the base blob of each conflict is the previous one's incoming blob
(`a541a6d9` → `2ffe0bc5` → `71083b23`) — while HEAD already holds the ticket's
final post-reconcile state, which contains all of them.
