---
uid: report-b14bdbae
id: REPORT-4836
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-23T18:10:24.849534+00:00'
updated_at: '2026-09-23T18:10:24.849534+00:00'
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

  Incoming is `04385bca` (`xgd(ticket): update bug bug-93851fea`,
  authored 2026-09-01 13:50:00 -0700) — the third consecutive
  single-ticket commit in this resync queue touching this same file,
  after `dadea5a9b4` (scope 284) and `370ff625` (scope 285). Both
  sides carry the same generic subject with no operation narrative, so
  the fallback is timestamp: OURS `updated_at: 2026-09-19T15:15:30Z`
  vs THEIRS `updated_at: 2026-09-01T20:50:00Z`. OURS is ~18 days later
  and a strict superset. OURS taken for both conflict regions.

  Two conflict regions:

  1. **Status block** — kept `updated_at: 2026-09-19`,
     `completed_at: 2026-09-14`, `last_field_updated: status`,
     `status: free_and_reconciled`. Dropped THEIRS'
     `updated_at: 2026-09-01T20:50:00`, `completed_at: null`,
     `last_field_updated: story_points`, `status: free_coded`.
  2. **`fields:` tail** — kept `bundled_in: bundle-8e1807f6`.
     THEIRS does not have this key.

  Resolved with `git checkout --ours`, staged with `git add --sparse`
  (file sits outside the sparse-checkout cone on this resync branch,
  DOC-986 §2/§4.1). Each git write was issued as the sole content of
  its own call per BUG-1294.

  **Flagged for post-merge review** per the enrichment rule, since the
  winner was selected on timestamp rather than on stated intent.

## Incoming changes preserved

`04385bca` is a 3-insertion / 2-deletion frontmatter-only edit. It
makes exactly one substantive change plus two bookkeeping bumps:

- **`story_points: 2`** (the substantive addition) — **present** in
  the staged blob, confirmed by reading
  `git show :.xgd/tickets/hot/bug-93851fea.md`. It merged without
  conflict: HEAD already carried the identical value, so git treated
  it as common context rather than a competing hunk. Git surfaced no
  conflict region around it.
- `updated_at` bump and `last_field_updated: status → story_points` —
  bookkeeping metadata describing *when and what* that edit touched.

The ticket body (Symptom / Root cause / Fix / Test plan) is entirely
untouched by this commit; its diff does not reach past the
frontmatter. No test function was touched on either side, so the
BUG-1301 precedence exception was neither invoked nor needed.

The only incoming values not carried forward are the lifecycle and
bookkeeping fields: `status: free_coded`, `completed_at: null`,
`last_field_updated: story_points`, and the older `updated_at`. HEAD
has this ticket at `free_and_reconciled` with
`completed_at: 2026-09-14` and `bundled_in: bundle-8e1807f6` — state
that exists only because the work was bundled and shipped *after*
`04385bca` was authored. Taking THEIRS would rewind a reconciled,
bundled ticket to an earlier lifecycle state and drop `bundled_in` —
a regression, not a preserved developer change. Notably,
`last_field_updated: story_points` is now stale on its own terms: it
describes an edit whose value HEAD already holds.

Net effect: the staged tree is byte-identical to HEAD for this file,
so this cherry-pick is an empty commit. `git diff --cached HEAD` is
empty, `git diff --name-only --diff-filter=U` reports nothing, and the
staged blob contains zero conflict markers. Per STEP 4 no `--skip`,
`--continue`, `--quit` or `--abort` was run; `CHERRY_PICK_HEAD` is
still present at `04385bca` for the finalize step, which will detect
the clean staged diff and skip the commit.

The nine untracked `.xgd/tickets/cold/*.md` files predate this conflict
and were left untouched.
