---
uid: report-62d4090c
id: REPORT-3620
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-10T01:13:47.636371+00:00'
updated_at: '2026-09-10T01:13:47.636371+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/bundle-78f4e2fe.md` — **AA** (both added), intent/bookkeeping
  ticket (`bundle-*`). Rules **2b** (AA) + **2e** (bookkeeping ticket, per-fact
  timeline). Resolved to **ours (HEAD)** via `git checkout --ours`, staged with
  `git add --sparse`.

### Why ours, per fact

The two sides are the *same ticket at two points in its own lifecycle*, not two
competing edits:

- **Incoming** (`efdc5802`, 2026-08-26 10:36 -0700, _"xgd(ticket): create bundle
  bundle-78f4e2fe"_) is the ticket's **creation**: `status: ready_to_reconcile`,
  `completed_at: null`, `last_field_updated: created_at`, no `result`, and
  `fields.commits` holding 5 raw `working_sha` entries.
- **Ours** (`4b197af0`, 2026-08-31 12:19 -0700, _"xgd(ticket): update bundle
  bundle-78f4e2fe"_ — the last of a ~20-commit chain of updates that day) is the
  **same ticket after BUNDLE-21 finished its own reconcile**:
  `status: free_and_reconciled`, `result: pass`, `completed_at` set,
  `merged_at_commit: 96a76934`, `main_sha: 96a76934`, and 21 `orphan_commits`
  old→new remappings.

The markdown **body is byte-identical** on both sides (only a trailing-newline
difference). Every frontmatter field that differs is the *same fact* advanced by
the later operation — there is no disjoint edit on the incoming side to compose
in, so 2e's "apply BOTH" branch does not arise and the per-fact timeline rule
selects ours (2026-08-31) over incoming (2026-08-26) uniformly. This matches the
auto-enrichment's own instruction for this file ("take the more recent commit by
timestamp").

Corroborated by ancestry: `96a76934` (this ticket's recorded `merged_at_commit`)
**is an ancestor of HEAD**, so BUNDLE-21's reconcile is already fully integrated
into this branch. The incoming Aug-26 creation commit is replaying over a HEAD
that already holds its outcome.

Taking incoming would have regressed an operator-owned status
(`free_and_reconciled` → `ready_to_reconcile`) and destroyed the completed
reconcile record (`result`, `completed_at`, `merged_at_commit`, `main_sha`,
`orphan_commits`) on a bundle that has already merged to main.

No composition was attempted on `fields.commits`: restoring incoming's 5
`working_sha` values into a bundle whose reconcile has completed would produce a
state neither side wrote, which 2e prohibits ("inventing content not present on
either side").

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted path is a
bookkeeping ticket, so STEP 3's code-preservation check does not apply to any
file in this resolution.

For the one conflicted file, the incoming commit's content is **present in HEAD
via a later route, not discarded**: `efdc5802` touches only
`.xgd/tickets/hot/bundle-78f4e2fe.md` (1 file, 622 insertions — the ticket's
creation), and that ticket exists in HEAD with a byte-identical body and strictly
later lifecycle frontmatter. This is the redundant-commit case
(BUG-1109/BUG-1122), not a discard: the incoming commit's key change (the ticket
itself) is in HEAD.

No BUG-1301 precedence exception was invoked; no hunk was dropped on
already-refactored-away grounds; no test function was deleted.

## Verification

- `git status --porcelain` — no UU/AA/DU/UD/AU/UA lines remain.
- 0 conflict markers in the resolved file.
- `git diff --cached HEAD` — empty. The resolution nets to no diff vs HEAD, as
  expected for a redundant ticket-creation replay. Per STEP 4, `--skip` was NOT
  called; the finalize step will detect the clean staged diff.
- `CHERRY_PICK_HEAD` still present at `efdc5802`. No
  `cherry-pick --continue/--skip/--quit/--abort`, `reset`, or `checkout <branch>`
  was run; git writes were limited to `checkout --ours` and `add --sparse` on the
  single conflicted path.
