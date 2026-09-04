---
uid: report-94d3582b
id: REPORT-3369
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T21:27:46.176745+00:00'
updated_at: '2026-09-02T21:27:46.176745+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` (BUG-39) — class **UU**, intent/bookkeeping
  ticket → rule **2e**. Two conflict hunks, both in the YAML frontmatter; the
  body merged clean.
  - Hunk 1 (`updated_at` / `last_field_updated` / `status`): same fact changed on
    both sides. HEAD = `status: bundled`, `updated_at 2026-08-31T05:05:09Z`;
    incoming = `status: free_coded`, `updated_at 2026-08-25T23:28:10Z`. HEAD is
    the later working-timeline position **and** `bundled` is strictly downstream
    of `free_coded` on the ticket lifecycle, so taking incoming here would have
    regressed pipeline-owned status. Kept HEAD.
  - Hunk 2 (`fields.bundled_in: bundle-8eef3846`): addition present only on the
    HEAD side; incoming adds nothing in that region. Non-overlapping addition →
    kept.
  - Net: HEAD is a strict superset of incoming for this file, so `git checkout
    --ours` was the composition, not a discard — see below.
  - Also noted: the incoming blob drops the trailing newline at EOF. Cosmetic
    churn, not developer intent; HEAD's trailing newline retained.

## Incoming changes preserved

Incoming commit `148b2c20715aca83e3f414f61e6b07e84b6c7258`
("Merge branch 'free-BUG-39' into xgd-working", 2026-08-25) changed exactly one
file. Diffing merge-base → incoming, its substantive additions were:

- `fields.commits: [{working_sha: 759cd87405a4b50f81995b2c9b510bf23be54fbd,
  reconcile_sha: null, main_sha: null}]`
- `fields.version: 0.2.15`
- `fields.story_points: 3`
- `status: free_coding` → `free_coded`

Every one of these is present in the resolved file. The three `fields` additions
merged clean (identical on both sides, outside the conflict markers) and are
verbatim in the result. The status advance is present via HEAD's further advance
`free_coded` → `bundled`, which is downstream of it.

No hunk was dropped; the BUG-1301 precedence exception was not invoked and no
test files were touched.

## Note on net diff

The staged result is byte-identical to HEAD, so `git diff --cached HEAD` is
empty. This is the redundant-commit case (BUG-1109 / BUG-1122): the incoming
commit's effect already reached this branch through the merge-back / sync route,
so replaying it changes nothing. Per STEP 4 this is not a failure and
`--skip` was NOT called — the tree is staged and the cherry-pick sequencer state
(`CHERRY_PICK_HEAD`) is left intact for `cherry_pick_finalize_resolution` to
detect the clean staged diff and skip the commit itself. Distinguished from a
discard per STEP 3: the incoming commit's key changes are demonstrably *present*
in HEAD (enumerated above), not absent.
