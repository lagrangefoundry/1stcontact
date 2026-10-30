---
uid: report-03a5be74
id: REPORT-5275
type: report
title: 'Resolver: conflict resolution for bug-db356ff8 during resync-377b581e'
created_by: xgd
created_at: '2026-09-28T03:21:11.248685+00:00'
updated_at: '2026-09-28T03:21:11.248685+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: review
  subject_uid: bug-db356ff8
---

# Conflict resolution: `.xgd/tickets/hot/bug-db356ff8.md`

## Context

Paused cherry-pick of `486ef694e0ce9d8ffab58fe8a8b55493f38b4861`
(`xgd(ticket): update bug bug-db356ff8`, authored 2026-08-25 15:52:42 -0700) onto
`resync-377b581e` at HEAD `8170d68306`.

One conflicted path, a 3-stage modify/modify on the ticket file. The path is
outside the worktree's sparse-checkout cone (`!/.xgd/tickets/**`), so it was not
materialized on disk when the conflict was raised.

## What each side changed

Cherry-pick base is the picked commit's parent (`47d8c78b`).

| field | base (`785e0a5e`) | incoming (`226541c7`) | ours / HEAD (`6d962ce5`) |
|---|---|---|---|
| `status` | `free_coded` | `ready_to_reconcile` | `free_and_reconciled` |
| `updated_at` | 2026-08-24T01:50 | 2026-08-25T22:52 | 2026-08-31T19:19 |
| `completed_at` | null | null | 2026-08-31T19:19 |
| `bundled_in` | — | — | `bundle-78f4e2fe` |

A direct ours-vs-theirs diff confirms the two sides differ **only** in those
frontmatter lifecycle fields, plus a trailing-newline fix on the ours side. The
370 lines of body prose are byte-identical. No body content exists on the
incoming side that ours lacks, so no content was at stake in this conflict.

## Resolution: ours, wholesale

Both sides move the same ticket along one lifecycle path:

    free_coded -> ready_to_reconcile -> bundled -> free_and_reconciled

The incoming commit advances `free_coded -> ready_to_reconcile` — it is the
*request* to reconcile. Ours is six days later and has already *completed* that
reconcile, landing `free_and_reconciled` with `completed_at` stamped and the
bundle linkage `bundled_in: bundle-78f4e2fe` recorded.

Taking the incoming side would therefore have regressed the ticket state, nulled
out `completed_at`, and dropped `bundled_in` — losing the record of which bundle
carried this work. The incoming status is a state ours has already passed
through, not a competing claim about it.

Resolved by taking the ours blob unchanged: stage 0 is `6d962ce5`, identical to
HEAD. `git add` needed `--sparse`, since the path lies outside the cone.

## Consequence for the sequencer

`git diff --cached HEAD` is empty — this resolution makes the cherry-pick a
no-op, because HEAD already carries a strictly later state of the only file the
picked commit touches. The pick is expected to report as empty when the
sequencer resumes it; that is the correct outcome here, not a lost change.

Per the resolver contract I have left `CHERRY_PICK_HEAD` in place and have not
run `--continue` or `--skip`. Sequencer advancement is the caller's to make.

## Verification

- `git ls-files -u` — empty; no unmerged stages remain.
- `git ls-files -s` — single stage-0 entry at `6d962ce5`.
- `git hash-object` on the worktree copy — `6d962ce5`, matching the ours blob exactly.
- `git status --short` — clean.
- `git rev-parse --verify CHERRY_PICK_HEAD` — still `486ef694`, pick untouched.
