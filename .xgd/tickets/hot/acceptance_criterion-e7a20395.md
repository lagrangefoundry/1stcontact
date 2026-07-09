---
uid: acceptance_criterion-e7a20395
id: AC-459
type: acceptance_criterion
title: Capturing a page writes a complete self-contained bundle
created_by: xgd
created_at: '2026-07-09T20:11:57.145849+00:00'
updated_at: '2026-07-09T20:11:57.145849+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8f33f14c
  kind: behavior
  regression_only: false
---

## Criterion
Running the capture command against a reachable page writes a self-contained capture bundle to a gitignored `storage/references/<host>/<path>/` directory containing: the structured essence file, a full-page screenshot (real PNG bytes, not a stub), the post-JS rendered HTML, the original raw HTML, and an `assets/` directory mirroring every subresource the page loaded (at minimum its stylesheets, images, and fonts). The structured essence lists at least those mirrored assets.

## Verification
Capture a local fixture page served over loopback into a temp working directory. Assert the bundle directory path is `storage/references/<host>/<slug-of-path>/`, that `capture.json`, `screenshot.full.png`, `rendered.html`, and `raw.html` all exist, that the screenshot begins with the PNG magic signature, and that `assets/` contains the fixture's stylesheet, image, and font files.
