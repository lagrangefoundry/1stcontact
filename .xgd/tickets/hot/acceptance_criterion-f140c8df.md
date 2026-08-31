---
uid: acceptance_criterion-f140c8df
id: AC-1467
type: acceptance_criterion
title: A cloud capture and a local capture of the same page are subject to identical
  preconditions, and existing local capture commands behave unchanged
created_by: xgd
created_at: '2026-08-31T22:53:35.636421+00:00'
updated_at: '2026-08-31T22:53:35.636421+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-080c6036
  kind: behavior
  regression_only: false
---

## Criterion

The preconditions above are a single definition applied by every capture path,
not a per-path copy. A capture taken through the deployed runtime and a capture
taken through the local toolchain of the same page therefore settle that page
identically.

Every existing local capture command — capture, screenshot ladder, conformance
and fidelity gate — produces the same results as before the cloud path existed.
In particular, a screenshot loads the page at the capture path's default width
and applies the target width at capture time, exactly as it always has, because
laying a page out at the target width from the start is observably different and
would silently change every existing screenshot.

## Verification

Assert that each capture path draws its preconditions from the shared definition
rather than carrying its own transcription of it, so a second copy is a
detectable regression rather than a silent drift.

Then run the pre-existing local capture, settle, screenshot, conformance,
conformance-security and ladder-screenshot suites and assert they pass
unchanged, including the order in which the target width is applied.

Drift here would not surface as a failure. The capture would still succeed and
would simply measure the wrong page, which is why identity is asserted rather
than assumed.
