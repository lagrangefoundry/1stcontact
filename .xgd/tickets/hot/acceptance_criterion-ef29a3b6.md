---
uid: acceptance_criterion-ef29a3b6
id: AC-1061
type: acceptance_criterion
title: A failure after a turn has begun streaming is delivered inside the stream,
  followed by the completion that releases the caller
created_by: xgd
created_at: '2026-08-10T08:36:16.777249+00:00'
updated_at: '2026-08-16T05:46:19.805564+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
When a turn fails after streaming has begun — the point at which a refusal status
is no longer available — the failure is delivered as readable text inside the
stream and followed by exactly one terminal completion. A turn never simply stops,
because a stream that stops leaves the caller waiting on an answer that will never
arrive.

## Verification
Drive a turn whose model call fails once streaming is under way. The stream
carries text naming the failure in readable prose and exactly one completion
event; the response is a well-formed stream rather than a truncated one.