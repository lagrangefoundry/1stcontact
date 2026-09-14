---
uid: acceptance_criterion-e7809f43
id: AC-1787
type: acceptance_criterion
title: The remaining fidelity comparisons run inside the deployed serverless runtime
  at their comparison cores
created_by: martin-github@westhead.me
created_at: '2026-09-14T05:06:30.108615+00:00'
updated_at: '2026-09-14T05:16:31.950454+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-046cfc56
  kind: behavior
  regression_only: false
---

## Criterion
The three non-pixel comparisons on the fidelity path are shown to run in the
deployed serverless runtime, producing results rather than load failures:

- the **per-element value comparison** returns no deltas for two identical
  manifests and returns a delta naming the changed property for two that differ
- the **responsive comparison** builds its table across viewport sizes, marks the
  rows that changed, and classifies them
- the **L1 gate's three probes** fold a multi-viewport capture into one document
  and produce a report carrying all three probe results and a pass verdict

What is asserted is that they ran, not what they decided: the verdicts are those
capabilities' own business.

Reaching the L1 gate's probes from the serverless runtime means addressing the
fold and the probes directly rather than through the L1 module barrel, which
re-exports a round-trip module that pulls in an HTTP server. That is an import
path rather than a port, and this criterion is where it is recorded so the next
caller does not rediscover it.

## Verification
In a test project running in the deployed runtime: compare a manifest against
itself and against a colour-changed copy; build and classify a responsive table
from a mobile and a desktop manifest; fold a ladder of projections and run the
three-probe gate. Assert each returns its report shape with no import failure.