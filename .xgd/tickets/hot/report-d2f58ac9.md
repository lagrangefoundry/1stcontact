---
uid: report-d2f58ac9
id: REPORT-460
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-5'
created_by: xgd
created_at: '2026-07-13T18:42:18.244349+00:00'
updated_at: '2026-07-13T18:42:18.244349+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-5
---

## Files resolved

- `package.json` — class UU (both modified). Version-field conflict only: HEAD (`sync_working_to_main`) at `0.0.105` vs incoming free_coded commit f89cb077 bumping `0.0.75 → 0.0.76`. Applied timeline/most-recent rule: kept HEAD's higher, later version `0.0.105`. Incoming's real feature payload lives in the other four files (which applied cleanly), so keeping `0.0.105` discards no developer code — only the incoming's own routine version increment, which is superseded by main's advanced version.

## Incoming changes preserved

Incoming commit f89cb077 (REQ-36 checklist marker treatment) verified present in the staged tree:
- `packages/framework/src/modules/dials.ts` — `LIST_MARKER_DIAL = ['bullet', 'check']` present (line 264).
- `packages/framework/src/modules/text-block/meta.ts` — `listMarker: LIST_MARKER_DIAL` wired (line 65).
- `packages/framework/src/modules/text-block/index.astro` — `listMarker` dial read, `list-marker-check` class + accent `::before` ✓ marker CSS present (lines 43-60, 124-128).
- `tests/req36-heading-treatment.test.ts` — `test_UAT_FC_REQ-36_textblock_listMarker_check_uses_accent_ticks` UAT present (line 246).

These four files applied cleanly during cherry-pick (staged as M, no conflict markers). Only `package.json`'s version line conflicted; the feature code is fully intact. Tree is staged and clean; cherry-pick state preserved for finalize.
