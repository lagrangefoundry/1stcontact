---
uid: acceptance_criterion-75e6be0f
id: AC-440
type: acceptance_criterion
title: Hero bg-color variant renders heading and subhead with no background image
  element
created_by: xgd
created_at: '2026-07-08T19:20:37.187307+00:00'
updated_at: '2026-07-08T19:20:37.187307+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a224111f
  kind: behavior
  regression_only: false
---

## Criterion
Rendering the hero with the `bg-color` variant produces HTML containing the configured heading and rendered subhead, and containing NO background image element. The heading uses fluid, clamp-based sizing that scales between type-scale steps according to the `size` dial (sm/md/lg).

## Verification
Render the hero with variant `bg-color`, a heading, and a subhead. Assert the heading and subhead text are present, assert there is no background `<img>` element, and assert the heading's sizing uses a clamp-based rule tied to the size dial.
