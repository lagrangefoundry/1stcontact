---
uid: acceptance_criterion-a17a2ed5
id: AC-789
type: acceptance_criterion
title: A behaviour's universal obligations are checkable in the mounted position,
  not only standalone
created_by: xgd
created_at: '2026-08-03T03:21:16.588922+00:00'
updated_at: '2026-08-03T03:21:16.588922+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-02f21b8a
  kind: behavior
  regression_only: false
---

## Criterion

The conformance harness can place a behaviour under test in the shape it actually
ships in — mounted into a seam of an L1 page body — and run the same universal
obligations (safety, security, cross-browser, responsive, isolation) against that
composition. The page it serves in this mode is a valid composed page: it carries
an L1 body, the instance is bound to a seam in that body, and the served markup
carries the behaviour's own markup nested inside that seam at every probed
viewport width.

## Verification

Run the harness on a behaviour with the mounted mode requested, then inspect what
was served: the page carries an L1 body, the instance names an existing seam, and
the served HTML nests the behaviour's markup inside the seam's box. Confirm the
page passed validation on the way in (an invalid composition is refused rather
than served).
