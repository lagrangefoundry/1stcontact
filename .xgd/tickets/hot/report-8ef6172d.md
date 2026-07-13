---
uid: report-8ef6172d
id: REPORT-468
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-5'
created_by: xgd
created_at: '2026-07-13T18:57:00.493425+00:00'
updated_at: '2026-07-13T18:57:00.493425+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-5
---

## Files resolved

- `package.json` (UU) — version-field-only conflict. HEAD=`0.0.105` (ours, sync_working_to_main, 2026-07-13) vs incoming=`0.0.84` (free_coded, 2026-07-10). Applied "more recent commit by timestamp" rule: kept HEAD's `0.0.105`. Version is a monotonic bookkeeping field (0.0.105 > 0.0.84); the incoming version bump is stale churn superseded by the newer sync. After resolution the file matches HEAD, so it drops from staged status — expected and correct.

## Incoming changes preserved

The incoming commit 756a3f48 ("feat(services-grid): icon-left card layout [FREE-CODED]") touched 5 files. Only `package.json` was conflicted; the 4 code files applied cleanly and remain staged as M with all incoming changes intact:

- `packages/framework/src/modules/dials.ts` — `ICON_LAYOUT_DIAL = ['top','left']` present.
- `packages/framework/src/modules/services-grid/index.astro` — `iconLayout` dial + `.icon-layout-left` grid CSS (4 occurrences) present.
- `packages/framework/src/modules/services-grid/meta.ts` — `iconLayout: ICON_LAYOUT_DIAL` present.
- `tests/req36-heading-treatment.test.ts` — both UATs (`test_UAT_FC_REQ-36_icon_layout_left_places_icon_beside_title`, `test_UAT_FC_REQ-36_icon_layout_defaults_to_top`) present.

The only incoming change absent from the result is the `package.json` version bump to 0.0.84 — deliberately superseded by HEAD's newer 0.0.105 per the timestamp rule. No developer code was discarded.
