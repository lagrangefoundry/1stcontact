---
uid: report-a769a10b
id: REPORT-3058
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T20:31:28.789232+00:00'
updated_at: '2026-08-31T20:31:28.789232+00:00'
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
  Incoming commit `bcedebfb50ecf4208ef7ac0834cdee3af79236c9`
  (`xgd(ticket): update bug`, 2026-08-23 15:21:10) appends two body sections
  and bumps `updated_at` / `last_field_updated: body`. The HEAD side
  (`7a8d0abd29`, `seed_local_overlay`, 2026-08-31) is a strict superset:
  `git diff <theirs> <ours>` is 228 insertions and only 4 deletions, and
  those 4 are the three superseded metadata scalars (`updated_at`,
  `last_field_updated`, `status`) plus the one superseded `## Status`
  paragraph ("Scope drafted, awaiting operator confirmation before coding.",
  replaced on HEAD by the landed-and-verified narrative). No body content
  from the incoming side is missing. Kept the superset; on the four
  competing facts HEAD is the later-positioned intent (draft→bundled, and
  `updated_at` 2026-08-26T17:36:27Z vs the incoming 2026-08-23T22:21:09Z).
  This also matches the auto-enrichment rule for this file ("take the more
  recent commit by timestamp").

## Incoming changes preserved

Incoming commit `bcedebfb50` touches only the ticket above. Every section it
adds is present verbatim in the resolved file, verified by line number
against the resolved blob:

- `## Production state — confirmed empirically (2026-08-23)` — line 110.
- `### Interim production patch applied`, including the
  `INSERT OR IGNORE INTO tenants (...)` SQL — lines 123 and 129.
- ``## Second finding — `bin/publish --production` cannot authenticate as
  written``, through its closing "Needs its own ticket." — lines 138–159.

Nothing from the incoming diff is absent. No hunk was dropped, so the
BUG-1301 precedence exception was not invoked.

Note on the staged result: `git diff --cached HEAD` is empty. This is the
redundant-commit case described in STEP 4, not a discard — this update's
content had already reached the branch through the `seed_local_overlay`
commit, so STEP 3's test ("are the incoming commit's key changes present in
HEAD?") passes affirmatively. `--skip` was not called; the cherry-pick
sequencer state (CHERRY_PICK_HEAD) is left intact for
`cherry_pick_finalize_resolution`.
