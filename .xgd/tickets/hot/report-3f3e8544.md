---
uid: report-3f3e8544
id: REPORT-458
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-5'
created_by: xgd
created_at: '2026-07-13T18:38:47.841973+00:00'
updated_at: '2026-07-13T18:38:47.841973+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-5
---

## Files resolved

- `package.json` — class UU, config scalar (`version` field). OURS/HEAD kept
  (`0.0.105`). Rule: version is monotonic; HEAD is the `sync_working_to_main`
  side and more recent by timestamp, and its version (0.0.105) supersedes both
  the incoming free-coded bump (0.0.74) and base (0.0.73). Taking incoming would
  downgrade the package version below main. No developer *code* lost — the
  incoming package.json change was solely the mechanical free-coding bump.

## Incoming changes preserved

The incoming commit 0a8c18f2 touched 6 files. The 5 code/test files carry all
the actual developer changes and were applied cleanly by the cherry-pick (staged
as M, verified via `git diff --cached HEAD`):

- `packages/framework/src/modules/dials.ts` — +16 (SUBHEAD_FONT_DIAL, SCRIM_GRADIENT_DIAL)
- `packages/framework/src/modules/hero/index.astro` — +27 (subhead-font + top-gradient scrim)
- `packages/framework/src/modules/hero/meta.ts` — +8 (subheadFont, scrimGradient dial wiring)
- `packages/framework/src/modules/text-block/index.astro` — +6 (panel sizes to contentWidth)
- `tests/req36-heading-treatment.test.ts` — +17 (REQ-36 assertions)

The only incoming package.json content was the version bump, intentionally
superseded by the higher HEAD version per the monotonic-version rule. All
substantive developer changes are present in the resolved tree.
