---
uid: report-315d8f50
id: REPORT-4835
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-23T18:09:00.418673+00:00'
updated_at: '2026-09-23T18:09:00.418673+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-93851fea.md` — **UU**, intent/bookkeeping ticket
  (STEP 2e), resolved under the enrichment's "intent unknown on both
  sides → take the more recent commit by timestamp" rule.

  Incoming is `370ff625` (`xgd(ticket): update bug bug-93851fea`,
  authored 2026-09-01 13:49:57 -0700). Both sides carry the same
  generic subject and neither narrates its operation, so the fallback
  is timestamp: OURS `updated_at: 2026-09-19T15:15:30Z` vs THEIRS
  `updated_at: 2026-09-01T20:49:57Z`. OURS is ~18 days later and is a
  strict superset of THEIRS. OURS taken for both conflict regions.

  Two conflict regions (down from three on the prior attempt against
  `dadea5a9b4` — this time the `commits` / `version` block and the
  file tail both merged cleanly as common context, because `370ff625`
  adds the same values HEAD already has):

  1. **Status block** — kept `updated_at: 2026-09-19`,
     `completed_at: 2026-09-14`, `status: free_and_reconciled`.
     Dropped THEIRS' `updated_at: 2026-09-01`, `completed_at: null`,
     `status: free_coded`.
  2. **`fields:` tail** — kept `story_points: 2` and
     `bundled_in: bundle-8e1807f6`. THEIRS has neither key.

  Resolved with `git checkout --ours`, staged with `git add --sparse`
  (the file sits outside the sparse-checkout cone on this resync
  branch, DOC-986 §2/§4.1). Each git write was issued as the sole
  content of its own call per BUG-1294.

  **Flagged for post-merge review** per the enrichment rule, since the
  winner was selected on timestamp rather than on stated intent.

## Incoming changes preserved

`370ff625` is an 8-insertion / 3-deletion frontmatter-only edit. It
makes exactly four changes; two are substantive additions and two are
lifecycle-state advances that HEAD has already moved past.

Both substantive additions are present verbatim in the staged blob:

- `commits:` list with `working_sha:
  d019bab77200d88dd613c94e0bbaa93b300ed526`, `reconcile_sha: null`,
  `main_sha: null` — present (confirmed by reading
  `git show :.xgd/tickets/hot/bug-93851fea.md`).
- `version: 0.2.35` — present.

Both merged without conflict: HEAD already carried identical values,
so git treated them as common context rather than competing hunks.

The body (Symptom / Root cause / Fix / Test plan) is untouched by this
commit — its diff does not reach past the frontmatter except for a
trailing-newline change that also merged cleanly. No test function was
touched on either side; the BUG-1301 precedence exception was neither
invoked nor needed.

The only incoming values not carried forward are the lifecycle fields:
`status: free_coded`, `updated_at: 2026-09-01T20:49:57`, and
`completed_at: null`. HEAD has this ticket at `free_and_reconciled`
with `completed_at: 2026-09-14`, plus `story_points` and `bundled_in`
that only exist because the work was bundled and shipped *after*
`370ff625` was authored. Taking THEIRS would rewind a reconciled,
bundled ticket to an earlier lifecycle state and drop those fields —
a regression, not a preserved developer change.

Net effect: the staged tree is byte-identical to HEAD for this file,
so this cherry-pick is an empty commit. `git diff --cached HEAD` is
empty, `git diff --name-only --diff-filter=U` reports nothing, and the
staged blob contains zero conflict markers. Per STEP 4 no `--skip`,
`--continue`, `--quit` or `--abort` was run; `CHERRY_PICK_HEAD` is
still present at `370ff625` for the finalize step, which will detect
the clean staged diff and skip the commit.

The nine untracked `.xgd/tickets/cold/*.md` files predate this conflict
and were left untouched.
