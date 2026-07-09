---
uid: acceptance_criterion-e47fe24d
id: AC-464
type: acceptance_criterion
title: Pages are segmented into sections by style signature
created_by: xgd
created_at: '2026-07-09T20:12:26.833087+00:00'
updated_at: '2026-07-09T20:12:26.833087+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8f33f14c
  kind: behavior
  regression_only: false
---

## Criterion
The page is divided into sections at boundaries where its visual style signature (background, color scheme, type treatment, spacing/container) shifts. A page with two distinct style bands yields two sections; a uniformly-styled page yields exactly one section. Sections are styling contexts, not modules or content groups.

## Verification
Capture a fixture with a dark image hero band followed by a light color content band; assert exactly two sections, the first with an `image` background and the second with a `color` background. Capture a uniformly-styled fixture; assert exactly one section.
