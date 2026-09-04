---
uid: report-8f9c7373
id: REPORT-3373
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T21:40:39.962511+00:00'
updated_at: '2026-09-02T21:40:39.962511+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — UU, intent/bookkeeping ticket (rule 2e).
  Single conflicting hunk, entirely inside the frontmatter, covering the same
  facts on both sides (`updated_at`, `last_field_updated`, `status`):
  - HEAD: `updated_at: 2026-08-31T05:05:09Z`, `status: bundled`
    (plus `fields.bundled_in: bundle-8eef3846` on the merged-clean side)
  - Incoming (bffb6b34fa): `updated_at: 2026-08-26T18:31:09Z`,
    `status: ready_to_reconcile`

  Same fact changed differently on each side, so the per-fact timeline rule
  applies: HEAD is the later-positioned state — `bundled` is the downstream
  successor of `ready_to_reconcile` in the ticket lifecycle, and HEAD carries
  the matching `bundled_in` reference. Resolved with `git checkout --ours`,
  staged with `git add --sparse` (path is outside the sparse-checkout cone).
  No fields were invented; no field present only on the incoming side was lost.

## Incoming changes preserved

No code/implementation files were conflicted in this commit — the incoming
commit `bffb6b34fa` touches exactly one file, the bookkeeping ticket above,
and its whole diff is the status advance to `ready_to_reconcile`.

That change is not discarded: HEAD already contains its effect and has moved
past it. The incoming commit advanced the ticket to `ready_to_reconcile` on
2026-08-26; HEAD's own later commit advanced the same field to `bundled` on
2026-08-31 and recorded `bundled_in: bundle-8eef3846`. Re-applying the
incoming side would regress an operator-owned status field backwards through
the lifecycle. This is STEP 4's redundant-commit case (the incoming intent is
present in HEAD via a later route), not STEP 3's discard case.

The resolution therefore nets to no diff vs HEAD. Per STEP 4, `--skip` was NOT
called; the file is staged and the cherry-pick sequencer state
(CHERRY_PICK_HEAD = bffb6b34faf48d7c750ccafbec0005964840184a) is left intact
for cherry_pick_finalize_resolution.

No BUG-1301 precedence exception was needed; no test files were involved.
