---
uid: acceptance_criterion-f8ad81ca
id: AC-465
type: acceptance_criterion
title: Post-JS rendered HTML and original raw HTML are both retained
created_by: xgd
created_at: '2026-07-09T20:12:46.711511+00:00'
updated_at: '2026-07-09T20:12:46.711511+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8f33f14c
  kind: behavior
  regression_only: false
---

## Criterion
The bundle retains two distinct HTML documents: the post-JavaScript rendered DOM (matching what the screenshot shows, including content and styling applied by script at runtime) and the original unmodified server response. Content that only exists after JavaScript runs is present in the rendered HTML but absent from the raw HTML.

## Verification
Capture a fixture whose hero background is applied by script. Assert the rendered HTML contains the visible headline and the JS-applied `background-image`, while the raw HTML contains the headline but not `background-image` — demonstrating the rendered/raw distinction that defeats static blindness.
