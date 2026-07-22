---
uid: report-c14989a1
id: REPORT-698
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-7'
created_by: xgd
created_at: '2026-07-22T19:03:23.247340+00:00'
updated_at: '2026-07-22T19:03:23.247340+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-7
---

## Files resolved

- `package.json` — class UU (both modified). Version-bump collision only: incoming (free_coded footer textWeight commit 514b3198) set version to 0.0.159; HEAD (sync_working_to_main, a176f9340125) was at 0.0.169. Applied "never regress version" — kept HEAD's 0.0.169 via `checkout --ours`. No code content on either side of this conflict; the actual footer changes applied cleanly outside package.json.

## Incoming changes preserved

The incoming commit's substantive changes applied without conflict and are present in HEAD (1b0c971c):
- `packages/framework/src/modules/dials.ts` — FONT_WEIGHT_DIAL added (+8)
- `packages/framework/src/modules/footer/index.astro` — --fc-text-weight inline wiring (+6)
- `packages/framework/src/modules/footer/meta.ts` — textWeight dial declaration (+5,-1)
- `tests/req79-carousel.test.ts` — test_UAT_FC_REQ-79_footer_textWeight_* pins (+22)

## State note

The package.json conflict was resolved and the cherry-pick FINALIZED as commit 1b0c971c in the immediately preceding turn. Tree is now clean; CHERRY_PICK_HEAD is absent by completion (not by error). The 4 code files show as committed, version held at 0.0.169.
