---
uid: acceptance_criterion-7bbee966
id: AC-427
type: acceptance_criterion
title: Navigation pattern outside the recognized set is rejected
created_by: xgd
created_at: '2026-07-08T19:13:12.062770+00:00'
updated_at: '2026-07-08T19:13:12.062770+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6fc151b1
  kind: behavior
  regression_only: false
---

## Criterion
A navigation configuration whose pattern is not one of the recognized navigation patterns (in-page-anchors, top-tabs, top-tabs-dropdown, hamburger, footer-only) is rejected. The verdict reports failure with an error whose path locates the navigation pattern field.

## Verification
Submit a site whose nav pattern is an unrecognized value. Assert the result reports failure and an error path points at the nav pattern location.
