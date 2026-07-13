---
uid: report-1e29f24b
id: REPORT-465
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-5'
created_by: xgd
created_at: '2026-07-13T18:51:16.597703+00:00'
updated_at: '2026-07-13T18:51:16.597703+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-5
---

## Files resolved

- `package.json` — class UU (both modified). Only the `version` scalar conflicted
  (ours HEAD/sync_working_to_main `0.0.105` vs incoming free_coded `0.0.81`).
  Resolved keeping ours (`0.0.105`): the higher/current version, and a bookkeeping
  scalar carrying no incoming code. Incoming code changes live entirely in the other
  11 files, which applied cleanly.

## Incoming changes preserved

The resolved cherry-pick commit `4ad1305e` contains all 12 files of the incoming
free_coded commit ("feat(framework): shared row band, hero heading-font, text-block
CTA, airy spacing scale [FREE-CODED]"), 223 insertions / 10 deletions:

- `packages/framework/src/modules/contact-form/index.astro`
- `packages/framework/src/modules/dials.ts`
- `packages/framework/src/modules/footer/index.astro`
- `packages/framework/src/modules/header/index.astro`
- `packages/framework/src/modules/hero/index.astro`
- `packages/framework/src/modules/hero/meta.ts`
- `packages/framework/src/modules/row.ts`
- `packages/framework/src/modules/services-grid/index.astro`
- `packages/framework/src/modules/text-block/index.astro`
- `packages/framework/src/modules/text-block/meta.ts`
- `tests/req36-heading-treatment.test.ts` (98 insertions — new UAT coverage)
- `tools/generate/src/render/render.ts`

All incoming framework/module/test changes verified present in the resolved tree.
Only the `package.json` version scalar took the ours side, per the version-bookkeeping
resolution rule.

## Note

The sole conflict (package.json version) was resolved and the tree is clean with no
conflict markers. Working tree status is clean and no CHERRY_PICK_HEAD is present.
