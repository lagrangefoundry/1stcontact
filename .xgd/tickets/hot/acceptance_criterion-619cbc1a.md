---
uid: acceptance_criterion-619cbc1a
id: AC-533
type: acceptance_criterion
title: 'Offline re-diff: --actual manifest short-circuits the browser and needs no
  slug'
created_by: xgd
created_at: '2026-07-09T22:59:31.778467+00:00'
updated_at: '2026-07-09T22:59:31.778467+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f826e5ca
  kind: behavior
  regression_only: false
---

## Criterion
When `--actual <manifest.json>` is supplied, the command computes the report from that pre-extracted manifest as the actual side without launching a browser or rendering/serving the draft, and a `<slug>` argument is not required. When `--actual` is omitted, a `<slug>` is required and its absence is reported as a usage error.

## Verification
Run `1c values-diff --ref <bundle> --actual <manifest.json>` with no slug and no browser available and assert a report is produced; run `1c values-diff --ref <bundle>` with neither slug nor `--actual` and assert a usage error.
