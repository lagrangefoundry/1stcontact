---
uid: acceptance_criterion-e0a729db
id: AC-1458
type: acceptance_criterion
title: Renaming a palette entry to its own current name succeeds as a no-op
created_by: xgd
created_at: '2026-08-31T21:29:18.849547+00:00'
updated_at: '2026-08-31T21:31:29.605876+00:00'
completed_at: null
last_field_updated: uat_coverage
status: pending
fields:
  story_uid: story-ee073693
  description: 'editPaletteRename accepts to == from as a no-op: the write succeeds,
    reports the entrys current reference count, and leaves the draft byte-unchanged.'
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Renaming a palette entry to the name it already has (`to === from`) succeeds
as a no-op: the write returns success, reports the entry's current
reference count (same shape as any other successful rename), and the draft
(document, palette and every page) is byte-unchanged.

## Verification

Rename an entry to its own current name from the CLI. Confirm: the call
succeeds (not refused as a collision), the reported count matches the
entry's actual reference count, and the draft bytes before and after are
identical.

## Reconciliation Decisions

**Self-rename no-op** (auto-defaulted at fix_uat_coverage, 2026-08-31):
REQ-133 states the *reason* for refusing a rename onto an existing name —
"a new name that already exists would merge two entries... the same class
of decision as deleting one in use." Renaming an entry to its own current
name does not merge two entries; there is only one entry involved. Intent
never states this exact case, but the code's existing behavior (accepting
it as a no-op via `to !== from && to in palette` in
`tools/generate/src/cli/edit.ts:1744`) is a direct application of REQ-133's
own stated rationale, not an arbitrary choice. Both candidate readings
(no-op, or refuse as `INVALID_INPUT`) are low-impact — neither loses data
nor opens a security exposure — so per BUG-1306 (lagrangefoundry/xgd) this
defaults to the reading that matches current shipped code rather than
blocking on an operator decision. Flag with a bug report if this default is
wrong.