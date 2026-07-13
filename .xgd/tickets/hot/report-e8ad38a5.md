---
uid: report-e8ad38a5
id: REPORT-485
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-5'
created_by: xgd
created_at: '2026-07-13T19:28:28.439611+00:00'
updated_at: '2026-07-13T19:28:28.439611+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-5
---

## Files resolved

- `package.json` — class UU (both modified). Ours = `sync_working_to_main` (715a993ebead, version 0.0.105); theirs = incoming free_coded (dc41e246, version 0.0.99). Conflict was version scalar only. Applied "more recent / higher version" rule: kept HEAD's 0.0.105. Incoming's only change to this file was the version bump, which is intentionally superseded by the later main-side bump.

## Incoming changes preserved

The incoming commit dc41e246 touched 5 files. The 4 code/test files had no conflict and are byte-identical to the incoming versions in the resolved HEAD:

- `packages/framework/src/index.ts` — IDENTICAL to incoming
- `packages/framework/src/modules/index.ts` — IDENTICAL to incoming
- `packages/framework/src/modules/text-markup.ts` — IDENTICAL to incoming (231-line block-document pivot fully present)
- `tests/req54-styled-text-markup.test.ts` — IDENTICAL to incoming (241-line test update fully present)

`package.json`: the only divergence, limited to the version scalar, resolved per the version-collision rule (higher/more-recent wins). No developer code discarded.

## Note on state

The conflict was resolved and the cherry-pick was committed as HEAD (ddbe7e78) — the incoming commit landed with its `[FREE-CODED]` message and marker intact. Tree is clean; `git status --porcelain` returns empty. CHERRY_PICK_HEAD is absent (cherry-pick already completed for this commit).
