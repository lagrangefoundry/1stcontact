---
uid: report-2e46e3a0
id: REPORT-477
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-5'
created_by: xgd
created_at: '2026-07-13T19:12:43.952198+00:00'
updated_at: '2026-07-13T19:12:43.952198+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-5
---

## Files resolved

- `package.json` — class UU (config/scalar version conflict). Kept HEAD's `version: 0.0.105` over incoming `0.0.92`. Both the intent-metadata rule ("take the more recent commit by timestamp": HEAD 2026-07-13 > incoming 2026-07-10) and version-forward semantics (0.0.105 > 0.0.92) select the HEAD value. The incoming commit's only edit to this file was a bump 0.0.91→0.0.92, fully subsumed by the higher branch version — no developer code discarded.

## Incoming changes preserved

- The cherry-picked commit `04ddedbb` (REQ-50 "unify spec vocabulary with the fidelity diff (styled runs)") contributes 46 staged files. All substantive incoming changes are present and staged: `text-style.ts` (new), `dials.ts`, `validate.ts`, `types.ts`, all 5 modules (hero/header/text-block/services-grid/contact-form), `gradient.ts` deletion, site-schema types, regenerated example sites, migrated test suite, scaffold/conformance updates.
- `package.json`: the incoming version-bump intent is preserved by keeping the higher HEAD version; no code content lost.
- CHERRY_PICK_HEAD (04ddedbb) left intact; no conflict markers remain; tree staged and ready for cherry_pick_finalize_resolution.
