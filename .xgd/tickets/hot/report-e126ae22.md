---
uid: report-e126ae22
id: REPORT-473
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-5'
created_by: xgd
created_at: '2026-07-13T19:05:37.584214+00:00'
updated_at: '2026-07-13T19:05:37.584214+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-5
---

## Files resolved

- `package.json` — UU (config/version file). Conflict was limited to the `version` scalar: ours (HEAD, `sync_working_to_main`) = `0.0.105`; incoming (free_coded) = `0.0.89` (a `0.0.88 → 0.0.89` bump). Kept HEAD's `0.0.105` — the higher version supersedes the incoming bump; regressing to `0.0.89` would move the package version backward.

## Incoming changes preserved

- The incoming commit `fdd1a239` touches `package.json` ONLY to bump the version (`0.0.88 → 0.0.89`). No other developer content is in the package.json diff. Keeping `0.0.105` satisfies the bump intent (version is incremented, in fact beyond the incoming value) and discards no developer code.
- All substantive REQ-36 developer changes land in the other files, which cherry-pick applied cleanly (no conflict) and are staged: `packages/framework/src/modules/hero/index.astro`, `.../hero/meta.ts`, `tests/fixtures/capture/req36-lazy.html`, `tests/req36-capture-settle.test.ts`, `tests/req36-heading-treatment.test.ts`, `tools/generate/src/cli/capture/playwright-driver.ts`.
