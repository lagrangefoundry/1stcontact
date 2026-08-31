---
uid: report-3e37fce2
id: REPORT-3057
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T20:29:55.104680+00:00'
updated_at: '2026-08-31T20:29:55.104680+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/bug-db356ff8.md` — UU, intent/bookkeeping ticket (rule 2e).
  Outside the sparse-checkout cone, so staged with `git add --sparse`.
  HEAD side (`7a8d0abd29`, `seed_local_overlay`, 2026-08-31) is a strict
  superset of the incoming side (`1524d1503f`, `update bug`, 2026-08-23):
  it carries every field and every body section the incoming commit adds,
  plus later bookkeeping the incoming side never had (`story_points: 3`,
  `commits[]` with `working_sha ea48502d0d`, `version: 0.2.10`,
  `bundled_in: bundle-78f4e2fe`, `status: bundled`, `updated_at`
  2026-08-26T17:36:27Z). Kept the superset; the only fields where the two
  sides state the same fact differently are `updated_at`,
  `last_field_updated`, `status`, and the `## Status` paragraph, and on
  all four HEAD is the later-positioned intent (the draft→bundled
  progression that already consumed the incoming update). This also matches
  the auto-enrichment rule for this file ("take the more recent commit by
  timestamp").

## Incoming changes preserved

Incoming commit `1524d1503f964ef4ed7adf60aa43dae3eefc08e7` changed exactly
one file, the ticket above. Every key change it makes is present in the
resolved file, verified against `git show HEAD:.xgd/tickets/hot/bug-db356ff8.md`:

- `title: 'control-app: fresh deployment 503s until bin/publish runs, so the
  builder never boots'` — present (line 5).
- `fields.severity: high` — present (line 18).
- The full body the incoming commit added (Symptom / Diagnosis / Immediate
  unblock / Proposed fix / Test plan) — present verbatim.

Nothing from the incoming diff is absent. No hunk was dropped, so the
BUG-1301 precedence exception was not invoked.

Note on the staged result: `git diff --cached HEAD` is empty. This is the
redundant-commit case described in STEP 4, not a discard — the incoming
update's content had already reached this branch through the
`seed_local_overlay` commit, so STEP 3's test ("are the incoming commit's
key changes present in HEAD?") passes affirmatively. `--skip` was not
called; the cherry-pick sequencer state (CHERRY_PICK_HEAD) is left intact
for `cherry_pick_finalize_resolution`.
