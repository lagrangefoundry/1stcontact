---
uid: acceptance_criterion-bd0f50cc
id: AC-1078
type: acceptance_criterion
title: Site content coming back from a read is marked as third-party prose, the marking
  is explained once, and a caller's own change confirmations are not marked
created_by: xgd
created_at: '2026-08-10T09:06:29.548041+00:00'
updated_at: '2026-08-10T09:06:29.548041+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-93905de4
  kind: behavior
  regression_only: false
---

## Criterion

Everything a read returns is somebody else's words — page copy, a page title, a
setting — so it comes back wrapped in a marking that says so, opened and closed
around the payload. What that marking means is stated once in what the consumer is
told about the surface, rather than left to be inferred. A write's confirmation is
the surface's own words about the caller's own change and is not marked, so the
marking keeps its meaning.

## Verification

Perform a read that includes page copy: assert the answer begins with the opening
marker and ends with the closing marker, and that the page's own words appear
inside. Perform a write: assert its confirmation carries no marker. Assert the
surface's manual contains the marker and explains it.
