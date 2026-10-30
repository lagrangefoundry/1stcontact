---
uid: report-5b23cf1d
id: REPORT-5375
type: report
title: 'Resync resolve conflicts: 6ba006de764d843fa7f4357df2b341e72f20e2f6'
created_by: xgd
created_at: '2026-09-28T20:35:09.557082+00:00'
updated_at: '2026-09-28T20:35:09.557082+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-439cd0c8.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), STEP 2e. Resolved to the OURS side in full.

  The conflict was confined to the YAML front matter. Both sides moved
  `status` off the same base value (`draft`) and bumped `updated_at`:

  - **Theirs** (`72ef0ecea8`, `updated_at: 2026-08-31T23:13:20Z`):
    `status: draft → free_coding`. Nothing else.
  - **Ours** (resync branch HEAD, `updated_at: 2026-09-09T21:32:49Z`):
    `status: draft → bundled`, plus `version: 0.2.24`,
    `bundled_in: bundle-87be4669`, a `commits` entry with
    `working_sha: d99c1f4385`, and ~160 lines of new body content
    ("What was built, and where it departs from the decisions above",
    the bundle-size measurement table, the Evidence section, a
    "Resolved after implementation" section, and a rewritten
    Open questions section).

  Per-fact application of 2e:

  - `status` — same field, changed differently on both sides: genuine
    conflict, so the later-positioned intent wins. Ours is later both by
    position (2026-09-09 vs 2026-08-31) and by lifecycle: `bundled` is
    downstream of `free_coding`, so the ticket already passed through the
    incoming side's target state. Replaying `free_coding` would regress it.
  - `updated_at`, `last_field_updated` — follow `status`; ours.
  - `version`, `bundled_in`, `commits` — added on ours only, absent from
    theirs: keep (non-overlapping).
  - Body — untouched by theirs, so ours' additions are non-overlapping and
    kept in full. Nothing from theirs was dropped here.

  The composed result is byte-identical to the OURS blob, so the resolution
  was staged as that blob rather than hand-merged.

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted path
is a bookkeeping ticket, so STEP 3's `git show $CPHEAD -- <file>` check
applies to the ticket's front matter rather than to source.

Checked against `git show 72ef0ecea8 -- .xgd/tickets/hot/request-439cd0c8.md`:
the incoming commit's *only* substantive change is `status: free_coding`
(with its `updated_at`/`last_field_updated` companions). That fact is
deliberately not present in the resolution, under the per-fact
later-intent rule of 2e rather than the BUG-1301 precedence exception:
it is not a dropped hunk whose target vanished, it is a stale value for a
field whose current value on ours is strictly downstream of it. Every other
byte of the incoming version is present, because the incoming version
changed nothing else.

Consequence for the queue: the staged tree is byte-identical to HEAD, so
this cherry-pick carries no net change. Per STEP 4 this was left staged
and `--skip`/`--continue` were not invoked; the finalize step will detect
the empty staged diff. CHERRY_PICK_HEAD is intact at `72ef0ecea8`.

## Verification

- `git ls-files -u` → 0 entries (no UU/AA/DU/UD remaining).
- `git status --porcelain` → empty.
- `.git/CHERRY_PICK_HEAD` → `72ef0ecea8c1f1d1142fad036df53879883bd41c`, present.

Note: the path is outside the sparse-checkout cone (this worktree has 11%
of tracked files present), so the conflict existed only in the index with
no working-tree markers. Resolved by writing the stage-2 blob out with
`git cat-file blob` and staging it with `git add --sparse`, per STEP 4 /
DOC-986 §2.
