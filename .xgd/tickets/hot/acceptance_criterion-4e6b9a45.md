---
uid: acceptance_criterion-4e6b9a45
id: AC-470
type: acceptance_criterion
title: URL shot screenshots an arbitrary URL to a PNG
created_by: xgd
created_at: '2026-07-09T20:20:03.502852+00:00'
updated_at: '2026-07-09T20:20:03.502852+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3ae5b34e
  kind: behavior
  regression_only: false
---

## Criterion
Running `1c shot --url <url>` screenshots the given URL directly (no render/serve step) and writes a PNG file at the resolved output path. The screenshotted URL in the result equals the URL that was passed.

## Verification
Run `1c shot --url` against a fixture page URL with an injected fake driver. Assert a PNG file is written at the returned output path with non-zero bytes, and the result's URL equals the supplied URL.
