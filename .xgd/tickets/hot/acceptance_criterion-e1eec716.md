---
uid: acceptance_criterion-e1eec716
id: AC-537
type: acceptance_criterion
title: 1c diff accepts a pre-shot --actual PNG and skips the browser
created_by: xgd
created_at: '2026-07-09T23:10:18.558063+00:00'
updated_at: '2026-07-09T23:10:18.558063+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1570884a
  kind: behavior
  regression_only: false
---

## Criterion
Running `1c diff --ref <refPng> --actual <ourPng>` diffs the two supplied images with no slug and without launching a browser (offline re-diff), producing the same heatmaps, `regions.json`, and summary as the render path. The `actual` side of the resulting report is the supplied PNG.

## Verification
Invoke with `--actual` pointing at an on-disk PNG and no browser driver available; assert the diff artifacts and report are produced and that no screenshot/browser step was performed (report's actual path equals the supplied PNG).
