---
uid: report-1bc39f32
id: REPORT-3348
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-02T20:21:02.716859+00:00'
updated_at: '2026-09-02T20:21:02.716859+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `package.json` — UU, config scalar (2g / enrichment "take the more recent commit by timestamp").
  Sole hunk was the `version` scalar: HEAD `0.2.20` vs incoming `0.2.11`.
  HEAD side is `510d4082382c7cba29890523b815537de666e259` "[FREE-CODED] REQ-162 — version 0.2.20"
  (Mon Aug 31 14:41:02 2026 -0700); incoming is `de71981f8abab7239a857e161c4f9f2ab76edd37`
  "Merge branch 'free-BUG-37' into xgd-working" (Mon Aug 24 14:42:38 2026 -0700), whose own
  package.json change was the bookkeeping bump `0.2.10 → 0.2.11`.
  HEAD is the later commit and version numbers are monotonic, so `0.2.20` was kept.
  No other field in the file conflicted.

## Incoming changes preserved

The incoming commit `de71981f8a` touched three files. Only `package.json` conflicted; the
other two merged with no markers, and the staged tree carries no diff against HEAD because
their content already landed in HEAD via an earlier post-watermark sync:

- `tools/generate/src/store/d1r2-store.ts` — every BUG-37 hunk is present in HEAD:
  the `LoadResult` type import, the `ASSEMBLED` memo map and its doc block
  (`d1r2-store.ts:152,185`), `assembledKey` (`:188`), `resetAssembledCache` (`:196`),
  the `ASSEMBLED.delete` in `forget` (`:405`), and the `loadDraft` memo path —
  miss-delete on absent row (`:807`), version-checked hit (`:812`), and populate (`:824`).
  The only difference between HEAD and the incoming blob in this file is in the OPPOSITE
  direction: HEAD additionally carries a later refactor of the unsafe-asset-name handling
  (partitioned `refused`/`accepted` lists plus a `console.warn` report) that the incoming,
  older commit predates. That is HEAD being ahead, not a discard.
- `tests/test_UAT_FC_BUG-37_preview_assemble_memo.workers.test.ts` — present in HEAD and
  tracked; the incoming commit added it and it was not modified here. No test function from
  either side was deleted.

`package.json`: the incoming change was purely the version bump, superseded by HEAD's higher
and later `0.2.20`. No developer code was dropped.

The resolution nets to no diff vs HEAD — this is the redundant-commit case (BUG-1109/BUG-1122),
not a discard: the incoming commit's key changes are demonstrably PRESENT in HEAD (see the
line references above), they simply arrived by a different route. `--skip` was not called;
staged and exiting normally for `cherry_pick_finalize_resolution` to handle.
