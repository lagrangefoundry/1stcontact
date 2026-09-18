---
uid: report-d8438c66
id: REPORT-4343
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T07:47:57.500296+00:00'
updated_at: '2026-09-18T07:47:57.500296+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` (BUG-39) — **UU**, intent/bookkeeping
  ticket → **rule 2e**, "one side is a strict superset" branch. Resolved to
  the HEAD (ours) side.

  Cherry-pick is merge commit `148b2c2071` ("Merge branch 'free-BUG-39' into
  xgd-working"). Its effective change to this file is the diff against parent
  1 (`876811161c`); the diff against parent 2 (`7f1350e9a5`) is empty, i.e.
  the merge carried the free-BUG-39 side through unchanged.

  Only the YAML frontmatter conflicted. The 162-line body (Symptom / repro /
  Notes) is byte-identical on both sides — the sole body-level difference is
  that the incoming side dropped the file's trailing newline; ours retains
  it, which is kept.

  Per-fact breakdown of the frontmatter:

  | fact | ours (HEAD) | incoming | taken | why |
  |---|---|---|---|---|
  | `fields.commits` | `working_sha: 759cd874…` | identical | either | not in conflict — both sides added the same entry |
  | `fields.version` | `0.2.15` | `0.2.15` | either | identical |
  | `fields.story_points` | `3` | `3` | either | identical |
  | `fields.bundled_in` | `bundle-8eef3846` | absent | **ours** | ours-only field; incoming never touched it |
  | `status` | `bundled` | `free_coded` | **ours** | same fact, genuine conflict — see below |
  | `last_field_updated` | `status` | `story_points` | **ours** | bookkeeping scalar, follows `status` |
  | `updated_at` | `2026-08-31T05:05:09Z` | `2026-08-25T23:28:10Z` | **ours** | bookkeeping scalar, follows `status` |

  `status` is the one genuinely competing fact. Both sides' enrichment
  metadata reports the same subject with intent unknown, so no
  `xgd working-timeline` lookup is available on either side; the enrichment's
  own stated fallback — "take the more recent commit by timestamp" — selects
  ours (2026-08-31 vs 2026-08-25, six days later). This agrees with the
  lifecycle ordering independently: `free_coded` → `bundled` is forward
  motion, so HEAD is downstream of the incoming value rather than in
  disagreement with it. Taking the incoming side would have demoted the
  ticket `bundled` → `free_coded` and dropped `bundled_in`.

  No fields were invented; nothing is present in the resolution that was not
  already on the ours side.

## Incoming changes preserved

Verified against `git diff 148b2c2071^1 148b2c2071 -- <file>` and the staged
blob (`git show :<file>`). Every content addition the incoming commit makes
is present verbatim in the resolution:

- `fields.commits: [{working_sha: 759cd87405a4b50f81995b2c9b510bf23be54fbd,
  reconcile_sha: null, main_sha: null}]` — present
- `fields.version: 0.2.15` — present
- `fields.story_points: 3` — present

The incoming commit's `status: free_coding → free_coded` transition is
present via a different route, not discarded: HEAD already performed that
transition and then advanced one step further to `bundled`, recording
`bundled_in: bundle-8eef3846`. The incoming value is a strict ancestor of
the retained one on the ticket's own status ladder. The remaining incoming
deltas (`updated_at`, `last_field_updated`) are bookkeeping scalars that
travel with `status`.

No code/implementation files were in this conflict, so no BUG-1301
precedence exception was invoked and no hunk was dropped as obsolete. No
UAT test file was touched.

This resolution nets to no diff vs HEAD (`git diff --cached HEAD` is empty).
Per STEP 4 this is the redundant-commit case, not the discarded case — STEP
3's check above confirms the incoming commit's key changes are present in
HEAD rather than absent. `--skip` was NOT called; the cherry-pick sequencer
is left intact (`CHERRY_PICK_HEAD` = `148b2c20715aca83e3f414f61e6b07e84b6c7258`)
for `cherry_pick_finalize_resolution`.

## Note for post-merge review

The enrichment rule asked that this file be flagged for post-merge review.
One observation, recorded rather than acted on (rule 2e prohibits inventing
content not on either side): the retained `fields.bundled_in` reads
`bundle-8eef3846`, whereas this reconcile run's intent is `bundle-8e1807f6`.
Both values pre-exist on the ours side; neither was introduced here. Worth a
glance to confirm BUG-39's bundle membership is what the operator expects.

## Mechanics

The path is outside the sparse-checkout cone (13% of tracked files present),
so the conflict existed only in the index with no working-tree markers and
no file on disk. Resolved by pointing the index entry at the stage-2 (ours)
blob `52bab41feef14c15dce46fe47aac7b19ab0f59e8`, then materialising that blob
on disk — sibling ticket files under `.xgd/tickets/hot/` carry the `H` flag
and are present in the worktree, so leaving this one absent would have shown
a spurious ` D` deletion to any later `git add -A`. Final `git status
--porcelain` is empty.
