---
uid: report-ca9a5005
id: REPORT-5477
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T05:36:54.013216+00:00'
updated_at: '2026-09-29T05:36:54.013216+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-93851fea.md` — class **UU**, intent/bookkeeping
  ticket (`bug-*`), STEP 2e. Incoming is `370ff62593` ("xgd(ticket):
  update bug bug-93851fea", 2026-09-01T20:49:57) — the next lifecycle
  step after the previously-replayed `dadea5a9b4`. It does three things:
  advances `status` `free_coding` → `free_coded`, bumps `updated_at`, and
  adds `fields.commits` (working_sha `d019bab7`) plus
  `fields.version: 0.2.35`.

  **The two field additions merged cleanly** — git matched `commits` and
  `version: 0.2.35` against HEAD without conflict, because HEAD already
  carries them with byte-identical values. Two hunks conflicted:

  1. **Lifecycle scalars** (`updated_at`, `completed_at`, `status`). Both
     sides moved the same facts, so 2e's genuine-conflict branch applies:
     later-positioned intent wins, per fact. HEAD (`updated_at
     2026-09-19T15:15:30`, `completed_at 2026-09-14T10:29:09`, `status:
     free_and_reconciled`) postdates incoming (`2026-09-01T20:49:57`,
     `completed_at: null`, `status: free_coded`) by eighteen days, and
     `free_and_reconciled` is downstream of `free_coded` in the lifecycle.
     HEAD kept. `last_field_updated: status` was identical on both sides.

  2. **`fields` tail** (`story_points: 2`, `bundled_in: bundle-8e1807f6`).
     Present on HEAD, absent on incoming — incoming is not removing them,
     it simply predates their addition. 2e "one side a strict superset:
     keep the superset." HEAD kept.

  The EOF-newline hunk that conflicted on the previous attempt in this
  queue did **not** recur: both HEAD and this incoming blob now end
  without a trailing newline, so git matched them silently.

  Verified after resolution: no conflict markers remain, front matter
  re-parses as valid YAML with all 9 `fields` keys, all four body
  sections (Symptom / Root cause / Fix / Test plan) present, both UAT
  filenames intact, and no trailing newline introduced.

## Incoming changes preserved

- `.xgd/tickets/hot/bug-93851fea.md` — the substantive additions from
  `370ff62593` are present in the resolved file: `fields.commits` with
  `working_sha: d019bab77200d88dd613c94e0bbaa93b300ed526`,
  `reconcile_sha: null`, `main_sha: null` (lines 18–21 of the resolved
  front matter) and `fields.version: 0.2.35` (line 22). The only incoming
  values not taken are the three lifecycle scalars superseded by strictly
  later HEAD-side transitions — 2e's per-fact timeline rule operating as
  designed, not a discarded developer change.

No code files, no UAT test *files*, and no spec
(`story-`/`acceptance_criterion-`/`capability-`) tickets were involved, so
STEP 2c/2d/2f did not apply. The BUG-1301 precedence exception was not
needed and was not invoked; no hunk was dropped.

## Staging state

`git status --porcelain` is empty and `git diff --cached HEAD` is empty:
the UU line is gone and the resolution is byte-identical to HEAD, because
every fact this commit contributes had already been integrated into the
resync branch by earlier commits in the queue. Per STEP 4, `--skip` was
NOT invoked — finalize will detect the empty staged diff and skip the
commit. `CHERRY_PICK_HEAD` verified still present at `370ff62593`.
