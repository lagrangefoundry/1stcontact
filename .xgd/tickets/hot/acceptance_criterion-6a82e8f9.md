---
uid: acceptance_criterion-6a82e8f9
id: AC-442
type: acceptance_criterion
title: Hero renders a call-to-action only when one is provided
created_by: xgd
created_at: '2026-07-08T19:20:47.376181+00:00'
updated_at: '2026-07-08T19:20:47.376181+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a224111f
  kind: behavior
  regression_only: false
---

## Criterion
The hero's call-to-action is optional: when a CTA (label + href) is provided, the rendered output includes a CTA link with that label and destination; when no CTA is provided, the rendered output contains no CTA link.

## Verification
Render the hero once with a CTA and assert a link with the configured label/href is present; render again without a CTA and assert no CTA link appears in the output.
