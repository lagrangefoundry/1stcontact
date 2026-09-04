---
uid: acceptance_criterion-54a648a0
id: AC-1551
type: acceptance_criterion
title: An image nothing is configured to look at is still kept, and its record says
  it has not been looked at
created_by: xgd
created_at: '2026-09-04T04:12:38.186360+00:00'
updated_at: '2026-09-04T04:12:38.186360+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-724e4e8c
  kind: behavior
  regression_only: false
---

## Criterion

On a deployment where nothing is configured to look at images, an image is still kept and still
becomes a material record.

The resulting record states:

- an outcome distinguishing "nothing was configured to look" from a look that was attempted and
  failed, because the two want different repairs — one waits for configuration, the other for a
  retry,
- a description saying in words that the image was stored but has not been looked at, and that it
  can be found by name rather than by what it shows,
- no producer.

## Verification

Ingest an image on a deployment with no image describer available. Assert the request succeeds, the
material exists with its bytes intact, the outcome is the nothing-configured value and not the
failure value, the producer is empty, and the description says the image has not been looked at.
