---
uid: report-b97b7993
id: REPORT-5455
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T04:33:56.082774+00:00'
updated_at: '2026-09-29T04:33:56.082774+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Summary

One conflict. Incoming commit `3fc6491817` ("xgd(ticket): create bug
bug-3ade1af4") is the **original creation of BUG-40 as an empty draft**;
HEAD carries the same ticket finished (`status: free_and_reconciled`,
`completed_at` set, `version: 0.2.33`, `bundled_in: bundle-8e1807f6`, and a
160-line body). Resolved by taking HEAD — the strict superset. No developer
code was discarded; no test function was touched on either side.

## Files resolved

- `.xgd/tickets/hot/bug-3ade1af4.md` — **AA** (both added, no stage-1 base),
  intent/bookkeeping ticket (`bug-*`, rule **2e**). Two hunks, both resolved
  to **ours**:
  - frontmatter — incoming sets the ticket's *initial* values
    (`title: Untitled`, `updated_at` = `created_at`, `completed_at: null`,
    `last_field_updated: created_at`, `status: draft`); HEAD has advanced
    every one of those five fields.
  - fields tail + body — HEAD adds `chat_comment`, `severity`,
    `story_points`, `commits`, `version`, `bundled_in` and the full
    Symptom / three-Cause / Test-plan body; the incoming side of this hunk
    is the stub `(new ticket)`.

  Per 2e: no field/section is changed differently on both sides, so no
  per-fact timeline tiebreak was needed — HEAD is a strict superset and the
  superset is kept. Resolved with `git checkout --ours` + `git add --sparse`
  (the path is outside the sparse-checkout cone per DOC-986 §2/§4.1, though
  the hunk had also materialized in the worktree). Staged blob
  `4b1ec9bd2a0d8d4430610c6967fd3313146a83fe`.

## Incoming changes preserved

No file under `xgd_source/**`, `tests/**` or `bin/**` was in conflict, so
STEP 3's code-file verification has no targets and the BUG-1301 precedence
exception was not invoked. No hunk was dropped under it.

For the one ticket file, nothing was lost. The incoming blob
(`a92ed3206a622a9e258443589553843dd4d841fe`) is an 18-line stub whose every
line is either **byte-identical to HEAD** or a **strictly earlier value of a
field HEAD has since advanced**:

- identical on both sides: `uid`, `id: BUG-40`, `type: bug`,
  `created_by: xgd`, `created_at: '2026-09-01T19:01:30.821719+00:00'`, and
  all three `fields` entries it carries (`auto_merge_back`, `needs_review`,
  `priority`) — those three sit in the common context region and did not
  conflict at all.
- superseded by HEAD: `title` (`Untitled` → the real 2-line title),
  `updated_at` (`2026-09-01` → `2026-09-19T15:15:31`), `completed_at`
  (`null` → `2026-09-14T10:29:13`), `last_field_updated`
  (`created_at` → `status`), `status` (`draft` → `free_and_reconciled`).

There is no field the incoming side sets that HEAD does not also set, so
taking HEAD loses no fact. Taking the incoming side would have reverted a
completed, reconciled, bundled ticket back to an untitled draft and rewound
its clock by ~18 days.

Worth flagging: this is *not* the usual "picked commit already on HEAD under
a different sha" pattern. `git log --find-object=a92ed320 HEAD` is **empty**,
so the incoming blob appears nowhere in this branch's history. HEAD's copy of
the file was introduced independently at `7d4b20a363` ("seed_local_overlay",
2026-09-11) — already populated — and refined at `29bdc256d7` (2026-09-17)
and `959fade37c` (2026-09-19). The two lineages introduce the same path from
different sides, which is why the merge has no base and reports AA. Ours is
nonetheless the strict superset by content, which is what decides it.

## Note for the finalize step

The resolved blob equals HEAD's blob, so `git status --porcelain` is **empty**
and this commit is expected to be skipped as empty. Per the stage contract,
`--skip` was **not** invoked here; `CHERRY_PICK_HEAD`
(`3fc64918172b7674ada9a9019219032670f4c630`) is left intact and the
cherry-pick is still in progress for the next workflow step.
