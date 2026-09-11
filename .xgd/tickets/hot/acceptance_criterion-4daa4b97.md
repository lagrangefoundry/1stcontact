---
uid: acceptance_criterion-4daa4b97
id: AC-1693
type: acceptance_criterion
title: An image past the ceiling for looking at one is stored whole and simply not
  looked at, rather than refused or shrunk
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:23:08.994039+00:00'
updated_at: '2026-09-11T04:35:58.265190+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-4cabde9a
  kind: behavior
  regression_only: false
---

## Criterion

An image larger than the ceiling for **looking at** an image is stored **whole** and simply not
looked at — it is not refused, and it is not shrunk or clipped to fit.

- The material is created and the stored bytes are the client's file in full, byte for byte.
- No description attempt is made against it.
- The body states that the image was stored but not described, and names the size ceiling for
  looking at one.
- The recorded outcome is the past-the-looking-ceiling outcome, distinct from every other
  degraded outcome; the recorded describer is empty.

This ceiling is independent of, and lower than, the per-file ceiling above which ingestion
refuses a file outright.

## Verification

With a describer configured, hand the step an image above the looking ceiling and below the
ingestion ceiling. Assert the describer was never invoked, a material is produced, the outcome
is the past-the-looking-ceiling one, the body names the ceiling, and the bytes retained are the
same length and content as the input.