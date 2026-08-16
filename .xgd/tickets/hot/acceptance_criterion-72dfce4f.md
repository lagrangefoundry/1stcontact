---
uid: acceptance_criterion-72dfce4f
id: AC-1077
type: acceptance_criterion
title: A refusal from the site names its declared code and that code's caller-facing
  meaning, and leaves the draft byte-identical
created_by: xgd
created_at: '2026-08-10T09:06:24.393085+00:00'
updated_at: '2026-08-16T03:38:52.284802+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-93905de4
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

When a call is well-formed but the site refuses it, the answer carries the declared
error code and the caller-facing meaning published for that code — what the caller
should do next, not only that something went wrong. The draft is byte-for-byte as
it was: a refusal is never a partial write.

## Verification

Invoke a write against an address that does not exist on the page. Assert the
answer contains the declared not-found code and the published guidance for it (to
re-read the listing rather than guess again), and that the draft file's bytes are
identical to before the call.