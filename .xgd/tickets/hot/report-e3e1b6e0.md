---
uid: report-e3e1b6e0
id: REPORT-320
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-07-09T20:17:10.596531+00:00'
updated_at: '2026-07-09T20:17:10.596531+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-8f33f14c
---

No type errors. All done.

## Completion Report

```
UATs generated for story story-8f33f14c (plan item 1 of 7)

Story: story-8f33f14c
Test file(s) created:
  - tests/reconciliation-capture.test.ts

Tests written: 10
Tests passed: 10
Tests failed: 0

test_files_created:
  - "tests/reconciliation-capture.test.ts"
```

### Summary

Created `tests/reconciliation-capture.test.ts` with one UAT per acceptance criterion (10 ACs, AC-459 through AC-468), matching the project's existing test patterns (vitest, ephemeral loopback fixture server, real headless Chromium via `chromiumAvailable()`/`it.runIf`, fake `BrowserDriver` for seam tests).

Test → AC mapping:
- **AC459** — writes complete self-contained bundle (`capture.json`, PNG, rendered/raw HTML, mirrored `assets/`)
- **AC460** — theme colors painted with `var()` resolved to hex; no `var(` survives
- **AC461** — section background image + text-over overlay (~0.55 opacity, `textOverImage`)
- **AC462** — hidden content (`display:none`, off-screen drawer) excluded
- **AC463** — verbatim text with exact painted styling (44px display font headline, `#1a73e8`/32px subhead)
- **AC464** — style-signature segmentation (2 bands → 2 sections; uniform → 1)
- **AC465** — post-JS rendered HTML vs original raw HTML distinction
- **AC466** — offline re-extraction from bundle with origin unreachable
- **AC467** — injectable driver seam (factory invoked once, essence reflects injected signals)
- **AC468** — browser failure retries (3 attempts) then errors naming the URL; no static fallback

The nine browser-driven ACs were grounded in the proven logic from the existing `tests/capture.test.ts` (its `test_UAT_FC_REQ-12_*` tests). AC-468 had **no** prior test — I wrote it fresh against `runCapturePipeline`'s retry-then-throw contract in `pipeline.ts`. All 10 pass against the existing implementation; no runtime code was modified and no existing test files were touched.

Note: the pre-existing `tests/capture.test.ts` FC tests remain on disk — renaming/deleting those `test_UAT_FC_REQ-12_*` orphans is the downstream reconciliation review phase's responsibility (`check_fc_orphans`), not this UAT-generation step.
