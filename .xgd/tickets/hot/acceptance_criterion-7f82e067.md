---
uid: acceptance_criterion-7f82e067
id: AC-1780
type: acceptance_criterion
title: A re-encoded raster decodes back to identical pixels for every channel count
  the toolchain produces
created_by: martin-github@westhead.me
created_at: '2026-09-14T05:05:30.338009+00:00'
updated_at: '2026-09-14T05:05:30.338009+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-046cfc56
  kind: behavior
  regression_only: false
---

## Criterion
Encoding a raster and decoding the result returns the same picture:

- for a one-, two-, three- and four-channel raster, every pixel survives the round
  trip, with the one- and two-channel cases returning expanded to three and four
  channels per the expansion contract and the samples themselves unchanged
- every entry in the pinned corpus, decoded and re-encoded and decoded again,
  yields a pixel buffer whose digest equals the first decode's

What is pinned is the **pixels**, deliberately not the encoded bytes: the
compressed form is not canonical, so comparing files would pin the compressor
rather than the image, and would fail for reasons that have nothing to do with
fidelity.

## Verification
Round-trip a synthetic raster at each channel count and compare per-pixel samples
against the input, accounting for the declared expansion. Round-trip every corpus
entry and compare the decoded digest before and after. Do not compare encoded
bytes.
