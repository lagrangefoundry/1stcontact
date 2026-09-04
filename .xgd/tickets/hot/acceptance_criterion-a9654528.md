---
uid: acceptance_criterion-a9654528
id: AC-1552
type: acceptance_criterion
title: An image too large to look at is stored whole and simply not described
created_by: xgd
created_at: '2026-09-04T04:12:39.232268+00:00'
updated_at: '2026-09-04T04:23:06.135858+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-724e4e8c
  kind: behavior
  regression_only: false
---

## Criterion

The ceiling on what can be looked at is independent of the ceiling on what the platform will hold.
An image small enough to be kept but too large to be looked at is stored **whole** and simply not
described.

The resulting record states:

- an outcome distinguishing "too large to look at" from every other degraded outcome, so that a
  later pass can tell it apart from a transient failure and not retry it pointlessly,
- a description saying the image was stored but not looked at because of its size, and that the file
  itself is kept whole,
- no producer.

The stored bytes are the complete original: nothing is downscaled, truncated or discarded in order
to make the image describable.

## Verification

Ingest an image whose size is above the looking ceiling and below the holding ceiling. Assert the
request succeeds, the outcome is the too-large-to-look value, the description states the file is
kept whole, and the bytes read back have the original length and content. Assert separately that an
image below the looking ceiling on the same deployment is described normally, so the two ceilings
are demonstrably distinct.