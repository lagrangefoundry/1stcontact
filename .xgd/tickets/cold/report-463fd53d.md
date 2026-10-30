---
uid: report-463fd53d
id: REPORT-576
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-6'
created_by: xgd
created_at: '2026-07-19T01:31:00.610089+00:00'
updated_at: '2026-07-19T01:31:00.610089+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-6
---

## Files resolved

- `package.json` — UU (both modified), config/scalar. Version-number conflict only. OURS = sync_working_to_main @ 0.0.155 (main reconciled truth); THEIRS = free_coded @ 0.0.121 (stale downward bump 0.0.120→0.0.121). Kept HEAD's 0.0.155 (higher/newer reconciled version); incoming version bump discarded as obsolete since main is already ahead. Flagged per intent metadata rule (intent unknown on ours side).

## Incoming changes preserved

The incoming free_coded commit (a5c295c4) touched 5 files. The four code/content files auto-merged with no conflict and are byte-identical between a5c295c4 and the applied commit bdc7cefa:
- `packages/framework/src/modules/contact-form/index.astro` — submitColor + submitInline: IDENTICAL, preserved.
- `packages/framework/src/modules/footer/index.astro` — copyright override + linkColor: IDENTICAL, preserved.
- `storage/sites/gigabytealchemy/draft/pages/home.json` — site wiring: IDENTICAL, preserved.
- `tests/req58-framework-gaps.test.ts` — +34 lines of UATs: IDENTICAL, preserved.

The only incoming change NOT carried forward is the package.json version bump to 0.0.121, intentionally dropped in favour of main's 0.0.155 per the config/scalar version-conflict rule. No developer code discarded.

Note: tree is clean with no CHERRY_PICK_HEAD — the conflict resolution and cherry-pick continuation were already completed earlier in this session; HEAD is the applied incoming commit bdc7cefa. No further git state transitions performed.
