---
uid: report-5b33590f
id: REPORT-3619
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-10T01:06:28.003051+00:00'
updated_at: '2026-09-10T01:06:28.003051+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` (BUNDLE-20) — class **UU**, intent/bookkeeping
  ticket (rule 2e). Both sides changed the SAME facts in frontmatter
  (`updated_at`, `completed_at`, `last_field_updated`, `status`), so this is a genuine
  per-fact intent conflict, not a disjoint-field combine. Enrichment declared intent
  unknown on one or both sides, so the timestamp rule applies:
    - OURS  (HEAD, commit `8e07e6015d`, 2026-08-31 07:23 -0700):
      `status: free_and_reconciled`, `completed_at: 2026-08-31T14:22:24Z`,
      `last_field_updated: result`, plus `result: pass`, `merged_at_commit`,
      collapsed `commits` entry and the `orphan_commits` remap table.
    - THEIRS (incoming free_coded `44f12ddc80`, 2026-08-25 16:30 -0700):
      `status: ready_to_reconcile`, `completed_at: null`, `last_field_updated: status`.
  HEAD is the later-positioned edit by ~6 days and holds the terminal lifecycle state
  for BUNDLE-20. Taking incoming would rewind an already-completed, already-merged
  bundle back to `ready_to_reconcile`. Resolved `git checkout --ours` + `git add --sparse`.
  Flagged for post-merge review per the enrichment rule (intent unknown on one side).

## Incoming changes preserved

The incoming commit `44f12ddc80` touched exactly one file and exactly four frontmatter
lines — a bundle status transition `reconciling` -> `ready_to_reconcile` with its
`updated_at`/`last_field_updated` bookkeeping. No code, test, or spec-ticket content is
in this commit (`git show --stat`: 1 file changed, 2 insertions, 2 deletions).

That intent is present in HEAD via a later route, not discarded: HEAD carries the same
bundle lifecycle strictly forward past `ready_to_reconcile` to `free_and_reconciled`
with `result: pass` and `merged_at_commit: eef7a8b48b`. Re-applying the incoming values
would be a backwards transition on the same state machine, which is why the conflict
nets to no staged diff vs HEAD (STEP 4's redundant-commit case, not STEP 3's discard
case).

No code files were conflicted, so no BUG-1301 precedence exception was invoked and no
test function on either side was dropped.

Staging verified: no UU/AA/DU/UD lines remain, no conflict markers in the file,
`CHERRY_PICK_HEAD` (`44f12ddc80`) still present for the finalize step.
