---
uid: report-145cf122
id: REPORT-578
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-6'
created_by: xgd
created_at: '2026-07-19T01:33:08.412152+00:00'
updated_at: '2026-07-19T01:33:08.412152+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-6
---

## Files resolved

- `package.json` — UU (both modified), config scalar (version field). Conflict: HEAD `0.0.155` (sync_working_to_main, post-watermark) vs incoming `0.0.122` (free_coded gradient-panel commit). Resolution rule (enrichment): take the more recent version. Kept `0.0.155` — the higher monotonic version; taking incoming's `0.0.122` would have regressed the version number. Only the version scalar conflicted; no code hunks were in conflict on this file.

## Incoming changes preserved

The incoming commit (3c5d60d5, "gradient panel fill") applied all 13 of its files cleanly except the version scalar. Confirmed present in the resolved/committed tree (HEAD 62676b3f), 384 insertions:
- Framework code: `packages/framework/src/index.ts`, `modules/index.ts`, `modules/text-block/index.astro`, `modules/text-block/meta.ts`, `modules/text-style.ts`, `modules/types.ts`, `modules/validate.ts` — panelGradient field + gradient sweep authoring all present.
- Capture tools: `tools/generate/src/cli/capture/{extract,sections,types,values-diff}.ts` — all present.
- Tests: `tests/req62-gradient-panel.test.ts` (226 lines, 11 UATs) + `tests/fixtures/capture/gradient-panel.html` fixture — both present.

No developer code was discarded. Tree is clean and staged (no UU/AA/DU/UD lines remain).
