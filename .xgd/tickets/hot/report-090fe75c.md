---
uid: report-090fe75c
id: REPORT-2993
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-21'
created_by: xgd
created_at: '2026-08-31T16:17:23.677096+00:00'
updated_at: '2026-08-31T16:17:23.677096+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-21
---

## Files resolved

- `apps/control-app/wrangler.toml` — UU, code/config file. Rule 2c.2
  (non-overlapping changes: combine, keep both sides). The two sides
  edited adjacent but disjoint regions of the `[env.production]` area:
  - HEAD (`reconcile`, intent bundle-b3b7c399) added a comment block
    ("THE DEPLOYED GATE'S CONFIGURATION…") attached to
    `[env.production.vars]`.
  - Incoming (free_coded `0fe586d1f6`, BUG-37) added a new
    `[env.production.observability]` table.

  Both are kept. Ordering matters and was chosen deliberately: the
  incoming table is placed immediately after `routes` and before HEAD's
  comment, because a TOML table header ends the table above it — the
  incoming commit's own comment and its UAT
  (`test_UAT_FC_BUG-37_the_production_route_survives_the_new_table`)
  require `[env.production.observability]` to follow the `[env.production]`
  bare keys, not precede them. HEAD's comment stays adjacent to the
  `[env.production.vars]` block it documents.

  The top-level `[observability]` hunk from the same commit merged
  cleanly and needed no resolution.

No deletion (DU/UD), AA, spec-ticket, or UAT conflicts were present. No
hunk was dropped, so the BUG-1301 precedence exception did not apply.

## Incoming changes preserved

`git diff HEAD -- apps/control-app/wrangler.toml` on the staged result is
exactly the incoming commit's two hunks and nothing else:

- top-level `[observability]` with `enabled = true` /
  `head_sampling_rate = 1`, plus its comment — present verbatim.
- `[env.production.observability]` with `enabled = true` /
  `head_sampling_rate = 1`, plus its comment — present verbatim.

HEAD's comment block is also retained (it is context in that diff, not a
deletion).

Spot-checked with `npm test -- tests/test_UAT_FC_BUG-37_observability.test.ts`:
4 passed / 4. (wrangler's logger emits an EPERM writing its debug log
under the sandbox; that is an environment artifact, not a test failure —
the suite reports all four tests passing.) Full-suite quality checks were
not run, per instruction.
