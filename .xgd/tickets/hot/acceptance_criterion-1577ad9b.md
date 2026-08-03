---
uid: acceptance_criterion-1577ad9b
id: AC-799
type: acceptance_criterion
title: An endpoint the capture never recorded is reported as a residual, never invented
created_by: xgd
created_at: '2026-08-03T03:47:29.785846+00:00'
updated_at: '2026-08-03T03:47:29.785846+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8b2f295c
  kind: behavior
  regression_only: false
---

## Criterion
A mounted behaviour's submission endpoint is the endpoint the capture recorded
for that form. When the capture recorded none, the imported behaviour carries no
endpoint — it submits to its own address, which is what a page whose endpoint
was never observed honestly does — and the gap is reported as a residual stating
that the endpoint must be set before the reproduction collects real submissions.
When the captured endpoint is not a safe address, it is dropped rather than
carried into the reproduction, and the drop is reported as a residual naming the
rejected value. No endpoint is ever fabricated.

## Verification
Derive a behaviour's configuration from captured controls carrying a safe
endpoint and confirm it is used verbatim with no residual. Repeat with no
captured endpoint: confirm the configuration carries none and a residual states
the form posts to its own URL. Repeat with an unsafe captured endpoint: confirm
it is absent from the configuration and a residual names it as rejected.
