---
uid: acceptance_criterion-033d8c82
id: AC-1776
type: acceptance_criterion
title: Decoded pixels are byte-identical to the recorded witness of the previous decoder,
  in both runtimes
created_by: martin-github@westhead.me
created_at: '2026-09-14T05:04:49.803876+00:00'
updated_at: '2026-09-14T05:04:49.803876+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-046cfc56
  kind: behavior
  regression_only: false
---

## Criterion
For every image in the pinned fixture corpus, decoding it yields a raster whose
width, height, channel count, buffer length and **content digest** equal the values
recorded from the previous native decoder while that decoder was still installed.
Equality is exact — a single differing byte fails — and the same assertion holds
whether the decode runs on an operator's machine or inside the deployed serverless
runtime, where the decompression primitive is the platform's rather than the
host language's.

The recorded witness is evidence, not an adjustable fixture: it may not be
regenerated to make an assertion pass.

## Verification
Decode every corpus entry in each runtime and compare dimensions, channel count,
byte length and digest against the recorded values. Assert the corpus is not
silently empty. Assert the same set of digests from both runtimes.
