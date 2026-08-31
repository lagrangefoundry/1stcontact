---
uid: report-79c0f36f
id: REPORT-2944
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T14:41:13.426798+00:00'
updated_at: '2026-08-31T14:41:13.426798+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `package.json` — UU, config/manifest scalar conflict (STEP 2g + the auto-enriched
  per-file rule for this conflict). Sole conflict hunk was the `version` scalar:
  HEAD `0.2.9` vs incoming `0.2.3`. Resolved by keeping `0.2.9`.

  Rationale — the enrichment's stated rule for this file is "take the more recent
  commit by timestamp and flag for post-merge review":
  - OURS: `07afe0840d` "chore: version bump — 0.2.8 was claimed at the working tip
    by this ticket's own auto-commit [FREE-CODED]", 2026-08-31 02:14:00 -0700.
  - THEIRS: `27e08d3891` "Merge branch 'free-REQ-151' into xgd-working",
    2026-08-21 13:30:30 -0700.

  HEAD is ~10 days more recent, so HEAD's scalar wins. Taking the incoming `0.2.3`
  would have regressed the published version number by six patch releases. 2g's
  "scalar conflicts: incoming wins" is about developer *config intent* superseding
  automated churn; a version number is release bookkeeping, and here the incoming
  value is strictly behind the current one on the same linear version lineage.

  FLAGGED FOR POST-MERGE REVIEW per the enrichment rule (intent unknown on one side).

## Incoming changes preserved

The incoming commit `27e08d3891` is a merge of `free-REQ-151` into `xgd-working`.
Its complete change set relative to its first parent (`git diff --stat
0952a9b71f 27e08d3891`) is:

    package.json | 2 +-
    1 file changed, 1 insertion(+), 1 deletion(-)

That one line is the version bump. Versions across the relevant revisions:

- `0952a9b71f` (incoming first parent):  0.2.2
- `38e4a3cf22` (incoming second parent): 0.2.3
- `27e08d3891` (incoming):               0.2.3
- HEAD:                                  0.2.9

So the incoming commit carries no code, test, or config changes at all — its entire
intent is "advance the version past 0.2.2". HEAD is at 0.2.9, having already
advanced through and beyond 0.2.3 on the same lineage.

This is the STEP 3 / STEP 4 "present via a different route" case, NOT a discard:
the incoming commit's key change is not absent from HEAD, it is superseded by a
later bump of the same scalar. There is no developer-authored code in this commit
that could be dropped. No BUG-1301 precedence exception was invoked; no hunk was
dropped on the grounds of a HEAD-side refactor.

Consequence: the staged tree nets to no diff vs HEAD (`git diff --cached --stat
HEAD` is empty). Per STEP 4 this is expected and is not a failure — `--skip` was
NOT called; the finalize step will detect the clean staged diff and skip the commit.

## Git state

`CHERRY_PICK_HEAD` left intact. Only `git add -- package.json` was issued; no
`cherry-pick --continue/--skip/--quit/--abort`, no `reset`, no `checkout <branch>`.
`git status --porcelain` shows no remaining conflict-class lines (only pre-existing
untracked `.xgd/tickets/hot/*` files, which were untracked before this step and are
not part of this conflict).
