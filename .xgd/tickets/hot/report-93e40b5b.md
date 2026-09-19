---
uid: report-93e40b5b
id: REPORT-4422
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-19T12:26:08.069837+00:00'
updated_at: '2026-09-19T12:26:08.069837+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/bug-034bf955.md` — **UU** (index-only; path is outside the
  sparse-checkout cone on this reconcile branch, so there were no working-tree
  markers — DOC-986 §2/§4.1). Classified under **rule 2e** (intent/bookkeeping
  ticket: `bug-*`). Resolved by keeping the **ours/HEAD** side as a strict
  superset, then `git checkout --ours` + `git add --sparse`.

  Evidence — the three stages were extracted and compared blob-to-blob:
  - base (stage 1, `79bb5d0`): 18-line stub, `title: Untitled`, `status: draft`,
    body `(new ticket)`.
  - incoming (stage 3, `a47ef05`, from `24b0c04` *"xgd(ticket): update bug
    bug-034bf955"*, authored 2026-09-01): adds the real title, `severity: medium`,
    `status: free_coding`, and the full 91-line Symptom / Root cause / Fix /
    Test plan body.
  - ours (stage 2, `a67d870`, from *"xgd(ticket): seed_local_overlay bug
    bug-034bf955"*): **identical body text**, plus later lifecycle state —
    `status: bundled`, `updated_at` 2026-09-16 vs 2026-09-01,
    `completed_at` 2026-09-14 (incoming: `null`), and the additional fields
    `commits[working_sha=bd7612f]`, `version: 0.2.36`, `story_points: 3`,
    `bundled_in: bundle-8e1807f6`.

  `git diff --no-index theirs ours` is 11 insertions / 4 deletions, **all in
  frontmatter** — the single body-region hunk is a trailing-newline difference
  only. There is no field the incoming side sets that ours lacks, and no field
  changed in a competing direction: every per-fact difference (`status`,
  `updated_at`, `completed_at`) resolves the same way, toward ours, which is both
  the later-positioned intent and the later point in the ticket lifecycle
  (`free_coding` → `bundled`). No timeline lookup was needed, and nothing was
  invented that is not on one of the two sides.

## Incoming changes preserved

Confirmed. The incoming commit `24b0c04` touches exactly one file and its entire
content delta — title, `severity`, the status advance off `draft`, and the whole
91-line body — is already present verbatim in the resolved (HEAD) version. The
post-watermark path landed this ticket update earlier and then carried it further
through the workflow.

Consequently the staged tree has **no net diff vs HEAD**
(`git diff --cached HEAD` is empty). Per STEP 4 this is the redundant-commit
case, not the discarded-commit case, and STEP 3's guard is what distinguishes
them: the incoming commit's key changes are *present* in HEAD via a different
route, not *absent*. `--skip` was not called; `CHERRY_PICK_HEAD`
(`24b0c044bca108845a37cb3ea6f6f20e6ba27283`) is still in place for
`cherry_pick_finalize_resolution` to detect the clean staged diff and skip the
commit itself.

No code or UAT test files were in this conflict set, so no BUG-1301 precedence
exception was invoked and no test function was dropped.
